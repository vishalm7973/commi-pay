import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Installment, InstallmentDocument } from 'src/schemas/installment.schema';
import { InstallmentPayment, InstallmentPaymentDocument } from 'src/schemas/installment-payment.schema';
import type { UserToken } from 'src/shared/interfaces/user-request.interface';
import { Committee, CommitteeDocument } from 'src/schemas/committee.schema';
import { PaymentStatus } from 'src/common/enums/payment.enum';
import { UserDocument } from 'src/schemas/user.schema';
import { UserRole } from 'src/common/enums/user-role.enum';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectModel(Installment.name) private installmentModel: Model<InstallmentDocument>,
        @InjectModel(Installment.name) private userModel: Model<UserDocument>,
        @InjectModel(InstallmentPayment.name) private paymentModel: Model<InstallmentPaymentDocument>,
        @InjectModel(Committee.name) private committeeModel: Model<CommitteeDocument>,
    ) { }

    async getPendingPaymentsReportAgg(memberId: string, user: UserToken) {
        const createdById = new Types.ObjectId(user.id);
        const memberObjectId = new Types.ObjectId(memberId);

        const pipeline: any[] = [
            {
                $match: {
                    createdBy: createdById,
                    member: memberObjectId,
                    status: PaymentStatus.PENDING,
                },
            },

            // lookup installment
            {
                $lookup: {
                    from: 'installments',
                    localField: 'installment',
                    foreignField: '_id',
                    as: 'installmentDoc',
                },
            },
            { $unwind: { path: '$installmentDoc', preserveNullAndEmptyArrays: true } },

            // lookup committee inside installmentDoc
            {
                $lookup: {
                    from: 'committees',
                    localField: 'installmentDoc.committee',
                    foreignField: '_id',
                    as: 'committeeDoc',
                },
            },
            { $unwind: { path: '$committeeDoc', preserveNullAndEmptyArrays: true } },

            // compute monthlyContribution, amountPaid and pendingAmount
            {
                $addFields: {
                    monthlyContribution: { $ifNull: ['$installmentDoc.monthlyContribution', 0] },
                    amountPaid: { $ifNull: ['$amountPaid', 0] },
                },
            },
            {
                $addFields: {
                    pendingAmount: { $max: [{ $subtract: ['$monthlyContribution', '$amountPaid'] }, 0] },
                },
            },

            // now facet: one branch to create grouped rows, another to compute totals
            {
                $facet: {
                    groups: [
                        {
                            $group: {
                                _id: {
                                    committeeId: '$committeeDoc._id',
                                    installmentId: '$installmentDoc._id',
                                },
                                committee: {
                                    $first: {
                                        id: '$committeeDoc._id',
                                        amount: '$committeeDoc.amount',
                                        monthlyDueDay: '$committeeDoc.monthlyDueDay',
                                    },
                                },
                                installment: {
                                    $first: {
                                        id: '$installmentDoc._id',
                                        startingBid: '$installmentDoc.startingBid',
                                        winningBidAmount: '$installmentDoc.winningBidAmount',
                                    },
                                },
                                monthlyContribution: { $first: '$monthlyContribution' }, // same for group
                                count: { $sum: 1 },
                                totalPendingAmount: { $sum: '$pendingAmount' },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                committee: 1,
                                installment: 1,
                                payment: {
                                    monthlyContribution: '$monthlyContribution',
                                    count: '$count',
                                    totalPendingAmount: '$totalPendingAmount',
                                },
                            },
                        },
                        { $sort: { 'committee._id': 1, 'installment._id': 1 } },
                    ],

                    // compute grand totals across all matched documents (not across grouped docs)
                    summary: [
                        {
                            $group: {
                                _id: null,
                                totalPendingAmount: { $sum: '$pendingAmount' },
                                totalPendingCount: { $sum: 1 },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                totalPendingAmount: 1,
                                totalPendingCount: 1,
                            },
                        },
                    ],
                },
            },

            // unwind the summary array so we can reshape it easily (optional)
            {
                $addFields: {
                    summary: {
                        $cond: [
                            { $gt: [{ $size: '$summary' }, 0] },
                            { $arrayElemAt: ['$summary', 0] },
                            { totalPendingAmount: 0, totalPendingCount: 0 },
                        ],
                    },
                },
            },

            // final project to return structure as { groups: [...], summary: {...} }
            {
                $project: {
                    groups: 1,
                    summary: 1,
                },
            },
        ];

        const [result] = await this.paymentModel.aggregate(pipeline).exec();
        if (!result) {
            return { groups: [], summary: { totalPendingAmount: 0, totalPendingCount: 0 } };
        }

        return {
            groups: result.groups ?? [],
            summary: result.summary ?? { totalPendingAmount: 0, totalPendingCount: 0 },
        };
    }

    async getDashboardStats(user: UserToken) {
        const ownerId = new Types.ObjectId(user.id);

        // prepare three DB ops and run in parallel
        const committeesCountPromise = this.committeeModel.countDocuments({ createdBy: ownerId });
        const membersCountPromise = this.userModel.countDocuments({ createdBy: ownerId });

        // aggregation to count distinct members with at least one pending payment
        const pendingMembersCountPromise = this.paymentModel.aggregate([
            { $match: { createdBy: ownerId, status: PaymentStatus.PENDING } },
            { $group: { _id: '$member' } },        // one group per member
            { $count: 'pendingMembersCount' },     // count number of groups
        ]).exec();

        const [committeesCount, membersCount, pendingAggResult] = await Promise.all([
            committeesCountPromise,
            membersCountPromise,
            pendingMembersCountPromise,
        ]);

        const pendingMembersCount = (pendingAggResult && pendingAggResult[0] && pendingAggResult[0].pendingMembersCount) || 0;

        return {
            committees: committeesCount,
            members: membersCount,
            pendingMembers: pendingMembersCount,
        };
    }

    // Helper to escape regex special chars
    escapeRegExp(str: string) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    async getPendingMembers(user: UserToken, page = 1, limit = 10, search?: string) {
        const ownerId = new Types.ObjectId(user.id);
        const skip = (Math.max(1, page) - 1) * Math.max(1, limit);

        const rawSearch = (search ?? '').trim();
        const searchNormalized = rawSearch.length
            ? rawSearch.replace(/\s+/g, '').toLowerCase()
            : '';

        const escapeForRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const pipeline: any[] = [
            { $match: { createdBy: ownerId, status: PaymentStatus.PENDING } },

            {
                $lookup: {
                    from: 'installments',
                    localField: 'installment',
                    foreignField: '_id',
                    as: 'installmentDoc',
                },
            },
            { $unwind: { path: '$installmentDoc', preserveNullAndEmptyArrays: true } },

            {
                $addFields: {
                    monthlyContribution: { $ifNull: ['$installmentDoc.monthlyContribution', 0] },
                    amountPaid: { $ifNull: ['$amountPaid', 0] },
                },
            },
            {
                $addFields: {
                    pendingAmount: { $max: [{ $subtract: ['$monthlyContribution', '$amountPaid'] }, 0] },
                },
            },

            { $match: { pendingAmount: { $gt: 0 } } },

            {
                $group: {
                    _id: '$member',
                    totalPendingAmount: { $sum: '$pendingAmount' },
                    pendingCount: { $sum: 1 },
                },
            },

            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'memberDoc',
                },
            },
            // keep even if no match
            { $unwind: { path: '$memberDoc', preserveNullAndEmptyArrays: true } },

            {
                $addFields: {
                    normalizedFirstName: {
                        $toLower: { $replaceAll: { input: { $ifNull: ['$memberDoc.firstName', ''] }, find: ' ', replacement: '' } },
                    },
                    normalizedLastName: {
                        $toLower: { $replaceAll: { input: { $ifNull: ['$memberDoc.lastName', ''] }, find: ' ', replacement: '' } },
                    },
                    normalizedPhoneNumber: {
                        $toLower: { $replaceAll: { input: { $ifNull: ['$memberDoc.phoneNumber', ''] }, find: ' ', replacement: '' } },
                    },
                },
            },
        ];

        if (searchNormalized) {
            const regex = new RegExp(escapeForRegex(searchNormalized), 'i');
            pipeline.push({
                $match: {
                    $or: [
                        { normalizedFirstName: { $regex: regex } },
                        { normalizedLastName: { $regex: regex } },
                        { normalizedPhoneNumber: { $regex: regex } },
                    ],
                },
            });
        }

        pipeline.push({
            $facet: {
                data: [
                    { $sort: { 'memberDoc.firstName': 1, 'memberDoc.lastName': 1 } },
                    { $skip: skip },
                    { $limit: Math.max(1, limit) },
                    {
                        $project: {
                            _id: 0,
                            id: '$_id',
                            firstName: '$memberDoc.firstName',
                            lastName: '$memberDoc.lastName',
                            phoneNumber: '$memberDoc.phoneNumber',
                            totalPendingAmount: 1,
                            pendingCount: 1,
                        },
                    },
                ],
                total: [{ $count: 'count' }],
            },
        });

        const [result] = await this.paymentModel.aggregate(pipeline).exec();

        return {
            data: result?.data ?? [],
            total: result?.total?.[0]?.count ?? 0,
            page: Math.max(1, page),
            limit: Math.max(1, limit),
        };
    }

}
