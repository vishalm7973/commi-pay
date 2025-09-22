import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Installment, InstallmentDocument } from 'src/schemas/installment.schema';
import { InstallmentPayment, InstallmentPaymentDocument } from 'src/schemas/installment-payment.schema';
import type { UserToken } from 'src/shared/interfaces/user-request.interface';
import { Committee, CommitteeDocument } from 'src/schemas/committee.schema';
import { PaymentStatus } from 'src/common/enums/payment.enum';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectModel(Installment.name) private installmentModel: Model<InstallmentDocument>,
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


    // async getPendingPaymentsReportAgg(memberId: string, user: UserToken) {
    //     const createdById = new Types.ObjectId(user.id);
    //     const memberObjectId = new Types.ObjectId(memberId);

    //     const pipeline: any[] = [
    //         {
    //             $match: {
    //                 createdBy: createdById,
    //                 member: memberObjectId,
    //                 status: PaymentStatus.PENDING,
    //             },
    //         },

    //         // lookup installment
    //         {
    //             $lookup: {
    //                 from: 'installments',
    //                 localField: 'installment',
    //                 foreignField: '_id',
    //                 as: 'installmentDoc',
    //             },
    //         },
    //         { $unwind: { path: '$installmentDoc', preserveNullAndEmptyArrays: true } },

    //         // lookup committee inside installmentDoc
    //         {
    //             $lookup: {
    //                 from: 'committees',
    //                 localField: 'installmentDoc.committee',
    //                 foreignField: '_id',
    //                 as: 'committeeDoc',
    //             },
    //         },
    //         { $unwind: { path: '$committeeDoc', preserveNullAndEmptyArrays: true } },

    //         // compute monthlyContribution, amountPaid and pendingAmount
    //         {
    //             $addFields: {
    //                 monthlyContribution: { $ifNull: ['$installmentDoc.monthlyContribution', 0] },
    //                 amountPaid: { $ifNull: ['$amountPaid', 0] },
    //             },
    //         },
    //         {
    //             $addFields: {
    //                 pendingAmount: { $max: [{ $subtract: ['$monthlyContribution', '$amountPaid'] }, 0] },
    //             },
    //         },

    //         // group by committee + installment (for this member only)
    //         {
    //             $group: {
    //                 _id: {
    //                     committeeId: '$committeeDoc._id',
    //                     installmentId: '$installmentDoc._id',
    //                 },
    //                 committee: { $first: '$committeeDoc' },
    //                 installment: { $first: '$installmentDoc' },
    //                 totalPendingAmount: { $sum: '$pendingAmount' },
    //                 payments: {
    //                     $push: {
    //                         paymentId: '$_id',
    //                         amountPaid: '$amountPaid',
    //                         monthlyContribution: '$monthlyContribution',
    //                         pendingAmount: '$pendingAmount',
    //                         paymentDate: '$paymentDate',
    //                         status: '$status',
    //                     },
    //                 },
    //             },
    //         },

    //         // reshape
    //         {
    //             $project: {
    //                 _id: 0,
    //                 committee: 1,
    //                 installment: 1,
    //                 totalPendingAmount: 1,
    //                 payments: 1,
    //             },
    //         },

    //         // optional sort
    //         { $sort: { 'committee._id': 1, 'installment._id': 1 } },
    //     ];

    //     const grouped = await this.paymentModel.aggregate(pipeline).exec();

    //     // compute grand total for this member
    //     const summary = grouped.reduce(
    //         (acc, g) => {
    //             acc.totalPendingAmount += g.totalPendingAmount ?? 0;
    //             acc.totalPendingCount += g.payments.length ?? 0;
    //             return acc;
    //         },
    //         { totalPendingAmount: 0, totalPendingCount: 0 },
    //     );

    //     return { groups: grouped, summary };
    // }
}
