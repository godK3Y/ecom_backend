import { Injectable, ConflictException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/users.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async register(registerDTO: RegisterDto): Promise<User> {
    // ตรวจสอบว่ามีอีเมลนี้ในระบบแล้วหรือไม่
    const existingUser = await this.userModel.findOne({
      email: registerDTO.email,
    });
    if (existingUser) {
      throw new ConflictException('อีเมลนี้ถูกใช้งานในระบบแล้ว');
    }
    const newUser = new this.userModel(registerDTO);
    return await newUser.save();
  }
  async create(RegisterDto: RegisterDto): Promise<User> {
    const newUser = new this.userModel(RegisterDto);
    return await newUser.save();
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: string) {
    return `This action returns a #${id} user`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(id: string, _updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }
}
