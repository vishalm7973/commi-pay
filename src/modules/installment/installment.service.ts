import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Installment, InstallmentDocument } from 'src/schemas/installment.schema';
import { InstallmentPayment, InstallmentPaymentDocument } from 'src/schemas/installment-payment.schema';
import { CreateInstallmentDto } from 'src/shared/dtos/installment/create-installment.dto';
import { UpdateInstallmentPaymentDto } from 'src/shared/dtos/installment/update-installment-payment.dto';
import type { UserToken } from 'src/shared/interfaces/user-request.interface';
import { Committee, CommitteeDocument } from 'src/schemas/committee.schema';
import { PaymentStatus } from 'src/common/enums/payment.enum';
import { User, UserDocument } from 'src/schemas/user.schema';

@Injectable()
export class InstallmentService {
    constructor(
        @InjectModel(Installment.name) private installmentModel: Model<InstallmentDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(InstallmentPayment.name) private paymentModel: Model<InstallmentPaymentDocument>,
        @InjectModel(Committee.name) private committeeModel: Model<CommitteeDocument>,
        @InjectConnection() private readonly connection: Connection,
    ) { }

    async create(createInstallmentDto: CreateInstallmentDto, user: UserToken): Promise<Installment> {
        const createdById = new Types.ObjectId(user.id);
        const session = await this.connection.startSession();
        session.startTransaction();

        try {
            const committee = await this.committeeModel.findOne(
                { _id: createInstallmentDto.committee, createdBy: createdById },
                null,
                { session },
            );
            if (!committee) throw new NotFoundException('Committee not found or not owned by user');

            // Calculate monthly contribution
            const membersCount = committee.members.length;
            const winningBidAmount = createInstallmentDto.winningBidAmount;
            const monthlyContribution = Math.ceil((committee.amount - winningBidAmount) / membersCount);

            const installmentData = {
                committee: committee._id,
                winningBidder: new Types.ObjectId(createInstallmentDto.winningBidder),
                monthlyContribution,
                startingBid: createInstallmentDto.startingBid,
                month: createInstallmentDto.month,
                year: createInstallmentDto.year,
                isSettled: false,
                settlementDate: null,
                createdBy: createdById,
                winningBidAmount
            };

            const createdInstallment = new this.installmentModel(installmentData);
            const savedInstallment = await createdInstallment.save({ session });

            const payments = committee.members.map(memberId => ({
                installment: savedInstallment._id,
                member: memberId,
                amountPaid: 0,
                paymentDate: null,
                status: PaymentStatus.PENDING,
                createdBy: createdById,
            }));

            await this.paymentModel.insertMany(payments, { session });

            await session.commitTransaction();
            return savedInstallment;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async markPayment(
        installmentId: string,
        memberId: string,
        updateData: UpdateInstallmentPaymentDto,
        user: UserToken
    ) {
        const createdById = new Types.ObjectId(user.id);

        // Find one to fetch installment amount
        const payment = await this.paymentModel
            .findOne({
                installment: new Types.ObjectId(installmentId),
                member: new Types.ObjectId(memberId),
                createdBy: createdById
            })
            .populate('installment', 'monthlyContribution')
            .exec();

        if (!payment) throw new NotFoundException('Installment payment record not found');

        let amount: number = 0;
        if (
            payment.installment &&
            typeof payment.installment === 'object' &&
            'monthlyContribution' in payment.installment
        ) {
            amount = (payment.installment as { monthlyContribution: number }).monthlyContribution;
        }

        const isMarkingPaid = updateData.isPaid;

        let updateFields: any = {};

        if (isMarkingPaid) {
            updateFields = {
                status: PaymentStatus.COMPLETED,
                amountPaid: amount,
                paymentDate: new Date()
            };
        } else {
            updateFields = {
                status: PaymentStatus.PENDING,
                amountPaid: 0,
                paymentDate: null
            };
        }

        // Update all matching records
        const result = await this.paymentModel.updateMany(
            {
                installment: new Types.ObjectId(installmentId),
                member: new Types.ObjectId(memberId),
                createdBy: createdById
            },
            { $set: updateFields }
        );

        return result;
    }


    async delete(installmentId: string, user: UserToken): Promise<boolean> {
        const session = await this.connection.startSession();
        session.startTransaction();

        try {
            const committees = await this.committeeModel.find({ createdBy: new Types.ObjectId(user.id) }).select('_id').session(session);
            const committeeIds = committees.map(c => c._id);

            const installment = await this.installmentModel.findOne({
                _id: installmentId,
                committee: { $in: committeeIds },
            }).session(session);

            if (!installment) throw new NotFoundException(`Installment not found or access denied`);

            await this.paymentModel.deleteMany({ installment: installmentId }).session(session);
            await this.installmentModel.deleteOne({ _id: installmentId }).session(session);

            await session.commitTransaction();
            return true;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async getInstallments(
        committeeId: string,
        user: UserToken,
        page: number = 1,
        limit: number = 10,
        search?: string
    ): Promise<{ data: Installment[]; total: number; page: number; limit: number }> {
        const createdById = new Types.ObjectId(user.id);

        const committee = await this.committeeModel
            .findOne({ _id: committeeId, createdBy: createdById })
            .select('_id').lean();
        if (!committee) {
            throw new NotFoundException('Committee not found');
        }

        const query: any = {
            committee: committee._id,
            createdBy: createdById,
        };
        if (search) {
            // Try to parse search for numeric amount
            const amountSearch = Number(search);

            query['$or'] = [];

            if (!isNaN(amountSearch)) {
                query['$or'].push({ monthlyContribution: amountSearch });
            }
        }

        const skip = (page - 1) * limit;

        const total = await this.installmentModel.countDocuments(query);

        const data = await this.installmentModel
            .find(query)
            .populate('winningBidder', 'firstName lastName countryCode phoneNumber')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();

        return { data, total, page, limit };
    }

    async getAvailableMembersForCommittee(committeeId: string, user: UserToken): Promise<User[]> {
        if (!user || !user.id) throw new Error('user token required');
        const createdById = new Types.ObjectId(user.id);
        const committeeObjectId = new Types.ObjectId(committeeId);
        const installmentsColl = this.installmentModel.collection.name;
        const usersColl = this.userModel.collection.name;

        const pipeline = [
            // 1. Match committee + ownership
            { $match: { _id: committeeObjectId, createdBy: createdById } },

            // 2. Safely extract members, always as ObjectId
            {
                $project: {
                    members: {
                        $map: {
                            input: { $ifNull: ['$members', []] },
                            as: 'm',
                            in: {
                                $cond: [
                                    { $eq: [{ $type: '$$m' }, 'objectId'] },
                                    '$$m',
                                    { $toObjectId: '$$m' }
                                ]
                            }
                        }
                    }
                }
            },

            // 3. Lookup installments winningBidder for this committeeId and creator
            {
                $lookup: {
                    from: installmentsColl,
                    let: { committeeId: '$_id', creatorId: createdById },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$committee', '$$committeeId'] },
                                        { $eq: ['$createdBy', '$$creatorId'] },
                                        { $ne: ['$winningBidder', null] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                winningBidderId: {
                                    $cond: [
                                        { $eq: [{ $type: '$winningBidder' }, 'objectId'] },
                                        '$winningBidder',
                                        { $toObjectId: '$winningBidder' }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'usedWinners'
                }
            },

            // 4. Collect winningBidder ObjectIds
            {
                $addFields: {
                    usedWinningIds: {
                        $map: {
                            input: '$usedWinners',
                            as: 'doc',
                            in: '$$doc.winningBidderId'
                        }
                    }
                }
            },

            // 5. Compute set difference (unused members)
            {
                $addFields: {
                    unusedMemberIds: {
                        $setDifference: ['$members', { $ifNull: ['$usedWinningIds', []] }]
                    }
                }
            },

            // 6. Lookup user details for unused members
            {
                $lookup: {
                    from: usersColl,
                    localField: 'unusedMemberIds',
                    foreignField: '_id',
                    as: 'unusedUsersDetail'
                }
            },

            // 7. Sanitize fields for response
            {
                $addFields: {
                    sanitizedUsers: {
                        $map: {
                            input: '$unusedUsersDetail',
                            as: 'u',
                            in: {
                                id: '$$u._id',
                                firstName: '$$u.firstName',
                                lastName: '$$u.lastName',
                                countryCode: '$$u.countryCode',
                                phoneNumber: '$$u.phoneNumber',
                            }
                        }
                    }
                }
            },

            {
                $addFields: {
                    sanitizedUsers: {
                        $sortArray: { input: '$sanitizedUsers', sortBy: { firstName: 1 } }
                    }
                }
            },

            // 8. Return sanitized users only
            { $project: { _id: 0, sanitizedUsers: 1, unusedMemberIds: 1, members: 1, usedWinningIds: 1 } }
        ];

        // If using NestJS: add logs for debugging each stage.
        const result = await this.committeeModel.aggregate(pipeline).allowDiskUse(true).exec();
        // Add console.log to inspect result, unusedMemberIds, members, usedWinningIds
        // console.log('Aggregation result:', JSON.stringify(result, null, 2));
        // If result is empty, directly query the raw documents for manual verification.

        // Returns array of sanitized unused members.
        return (result[0] && result[0].sanitizedUsers) || [];
    }

    async getPaymentsForInstallment(
        installmentId: string,
        user: UserToken,
        page: number = 1,
        limit: number = 10,
        search?: string
    ): Promise<{
        data: InstallmentPayment[];
        total: number;
        page: number;
        limit: number;
        paid: number;
    }> {
        const createdById = new Types.ObjectId(user.id);

        // verify installment exists and belongs to user
        const installment = await this.installmentModel
            .findOne({ _id: installmentId, createdBy: createdById })
            .select('_id')
            .lean();

        if (!installment) {
            throw new NotFoundException('Installment not found');
        }

        const baseMatch: any = {
            installment: installment._id,
            createdBy: createdById,
        };

        const postLookupMatchClauses: any[] = [];
        if (search && search.trim().length > 0) {
            const trimmed = search.trim();
            const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapeRegex(trimmed), 'i');

            postLookupMatchClauses.push({
                $or: [
                    { 'member.firstName': { $regex: regex } },
                    { 'member.lastName': { $regex: regex } }
                ]
            });
        }

        const skip = (page - 1) * limit;

        const pipeline: any[] = [
            { $match: baseMatch },

            {
                $lookup: {
                    from: 'users',
                    let: { memberId: '$member' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$_id', '$$memberId'] } } },
                        {
                            $project: {
                                id: '$_id',
                                _id: 0,
                                firstName: 1,
                                lastName: 1,
                                countryCode: 1,
                                phoneNumber: 1,
                            }
                        }
                    ],
                    as: 'member'
                }
            },

            { $unwind: '$member' },

            {
                $project: {
                    id: '$_id',
                    _id: 0,
                    installment: 1,
                    member: 1,
                    paymentDate: 1,
                    status: 1,
                }
            }
        ];

        if (postLookupMatchClauses.length) {
            pipeline.push({
                $match:
                    postLookupMatchClauses.length === 1
                        ? postLookupMatchClauses[0]
                        : { $and: postLookupMatchClauses }
            });
        }

        pipeline.push(
            { $sort: { createdAt: 1 } },
            {
                $facet: {
                    data: [{ $skip: skip }, { $limit: limit }],
                    total: [{ $count: 'count' }],
                    paid: [
                        { $match: { paymentDate: { $ne: null } } },
                        { $count: 'count' }
                    ]
                }
            }
        );

        const result = await this.paymentModel.aggregate(pipeline);

        const rawData = result?.[0]?.data || [];
        const total = result?.[0]?.total?.[0]?.count ?? 0;
        const paid = result?.[0]?.paid?.[0]?.count ?? 0;

        return { data: rawData, total, page, limit, paid };
    }

    async getPaymentDetails(paymentId: string, user: UserToken): Promise<InstallmentPayment> {
        const createdById = new Types.ObjectId(user.id);
        const payment = await this.paymentModel
            .findOne({ _id: paymentId, createdBy: createdById })
            .populate('member')
            .populate('installment')
            .exec();
        if (!payment) throw new NotFoundException('Payment record not found');
        return payment;
    }
}
