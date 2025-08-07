import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from '../users/dto/register.dto';
import { JwtPayloadDto, LoginResponseDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: JwtPayloadDto): Promise<LoginResponseDto> {
    console.log('🚀 Login process for user:', user._id);
    const payload = { email: user.email, sub: user._id };
    const token = await this.jwtService.signAsync(payload);
    console.log('🎟️ JWT token generated successfully');
    return { access_token: token };
  }

  async findByEmail(email: string) {
    return this.userService.findByEmail(email);
  }

  async create(registerDto: RegisterDto) {
    return this.userService.create(registerDto);
  }
}
