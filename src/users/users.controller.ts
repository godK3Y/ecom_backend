import { Controller, Get, Body, Req, UseGuards, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDto } from './dto/register.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(@Body() registerDTO: RegisterDto) {
    const user = await this.usersService.register(registerDTO);
    return new UserResponseDto(user);
  }
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Req() req) {
    const user = await this.usersService.findByEmail(req.user.email);
    return new UserResponseDto(user);
  }
}
