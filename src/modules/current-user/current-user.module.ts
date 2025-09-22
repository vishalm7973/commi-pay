import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/user.schema';
import { CurrentUserController } from './current-user.controller';
import { UserService } from '../user/user.service';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [CurrentUserController],
  providers: [UserService],
  exports: [UserService],
})
export class CurrentUserModule {}
