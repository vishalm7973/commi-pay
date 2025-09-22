import { Injectable, NotFoundException, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserRole } from 'src/common/enums/user-role.enum';
import { User, UserDocument } from 'src/schemas/user.schema';
import { CreateUserDto } from 'src/shared/dtos/user/create-user.dto';
import { UpdateUserDto } from 'src/shared/dtos/user/update-user.dto';
import { UserToken } from 'src/shared/interfaces/user-request.interface';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

  async create(createUserDto: CreateUserDto, user: UserToken): Promise<User> {
    const createdById = new Types.ObjectId(user.id);
    const createdUser = new this.userModel({ ...createUserDto, createdBy: createdById, role: UserRole.MEMBER });
    return await createdUser.save();
  }

  async findAll(
    user: UserToken,
    page: number = 1,
    limit: number = 20,
    search?: string,
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const createdById = new Types.ObjectId(user.id);
    const query: any = {
      createdBy: createdById,
    };

    if (search) {
      const normalizedSearch = search.replace(/\s+/g, '');
      query['$or'] = [
        { firstName: { $regex: normalizedSearch, $options: 'i' } },
        { lastName: { $regex: normalizedSearch, $options: 'i' } },
        { phoneNumber: { $regex: normalizedSearch, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const total = await this.userModel.countDocuments(query);

    const data = await this.userModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .exec();

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updatedUser = await this.userModel.findByIdAndUpdate(id, updateUserDto, {
      new: true,
    });
    if (!updatedUser) throw new NotFoundException(`User with ID ${id} not found`);
    return updatedUser;
  }

  async remove(id: string,): Promise<User> {
    const deletedUser = await this.userModel.findByIdAndDelete(id);
    if (!deletedUser) throw new NotFoundException(`User with ID ${id} not found`);
    return deletedUser;
  }
}
