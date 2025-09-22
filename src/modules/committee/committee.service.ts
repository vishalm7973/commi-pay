import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Committee, CommitteeDocument } from 'src/schemas/committee.schema';
import { CreateCommitteeDto } from 'src/shared/dtos/committee/create-committee.dto';
import { UpdateCommitteeDto } from 'src/shared/dtos/committee/update-committee.dto';
import { UserToken } from 'src/shared/interfaces/user-request.interface';

@Injectable()
export class CommitteeService {
    constructor(
        @InjectModel(Committee.name) private committeeModel: Model<CommitteeDocument>,
    ) { }

    async create(createCommitteeDto: CreateCommitteeDto, user: UserToken): Promise<Committee> {
        const createdById = new Types.ObjectId(user.id);
        const membersObjectIds = createCommitteeDto.members.map(id => new Types.ObjectId(id));
        const startDate = new Date(createCommitteeDto.startDate);
        const months = membersObjectIds.length;

        // Calculate endDate by adding member count as months to startDate
        const endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + months - 1);

        const committeeData = {
            ...createCommitteeDto,
            members: membersObjectIds,
            createdBy: createdById,
            startDate,
            endDate,
        };

        const createdCommittee = new this.committeeModel(committeeData);
        return await createdCommittee.save();
    }

    async findAll(
        user: UserToken,
        page: number = 1,
        limit: number = 10,
        search?: string,
    ): Promise<{ data: Committee[]; total: number; page: number; limit: number }> {
        const createdById = new Types.ObjectId(user.id);
        const query: any = {
            createdBy: createdById,
        };
        if (search) {
            // Try to parse search for numeric amount
            const amountSearch = Number(search);

            query['$or'] = [];

            if (!isNaN(amountSearch)) {
                query['$or'].push({ amount: amountSearch });
            }
        }

        const skip = (page - 1) * limit;

        const total = await this.committeeModel.countDocuments(query);

        const data = await this.committeeModel
            .find(query)
            .sort({ createdAt: -1 }) // latest first
            .skip(skip)
            .limit(limit)
            .exec();

        return { data, total, page, limit };
    }
    async findById(id: string, user: UserToken): Promise<Committee> {
        const createdById = new Types.ObjectId(user.id);
        const committee = await this.committeeModel
            .findOne({ _id: id, createdBy: createdById })
            .populate('members')
            .exec();
        if (!committee) throw new NotFoundException(`Committee with id ${id} not found`);
        return committee;
    }

    async update(id: string, updateData: UpdateCommitteeDto, user: UserToken): Promise<Committee> {
        const createdById = new Types.ObjectId(user.id);
        if (updateData.members) {
            updateData.members = updateData.members.map(id => new Types.ObjectId(id));
        }

        // Parse dates if provided
        const startDate = updateData.startDate ? new Date(updateData.startDate) : undefined;

        // Calculate endDate only if startDate or members updated
        if (startDate || updateData.members) {
            const membersCount = updateData.members ? updateData.members.length : 0;

            const existingCommittee = await this.committeeModel
                .findOne({ _id: id, createdBy: createdById })
                .select('startDate')
                .exec();
            if (!existingCommittee) throw new NotFoundException(`Committee with id ${id} not found`);

            const baseDate = startDate || existingCommittee.startDate;

            // Calculate new endDate: add memberCount months to baseDate
            updateData.endDate = new Date(baseDate);
            updateData.endDate.setMonth(updateData.endDate.getMonth() + membersCount - 1);
        } else if (updateData.endDate) {
            // If endDate explicitly provided, parse it
            updateData.endDate = new Date(updateData.endDate);
        }

        const updated = await this.committeeModel
            .findOneAndUpdate(
                { _id: id, createdBy: createdById },
                updateData,
                { new: true }
            )
            .populate('members')
            .exec();

        if (!updated) throw new NotFoundException(`Committee with id ${id} not found`);
        return updated;
    }

    async delete(id: string, user: UserToken): Promise<boolean> {
        const createdById = new Types.ObjectId(user.id);
        const result = await this.committeeModel
            .findOneAndDelete({ _id: id, createdBy: createdById })
            .exec();
        if (!result) throw new NotFoundException(`Committee with id ${id} not found`);
        return true;
    }
}
