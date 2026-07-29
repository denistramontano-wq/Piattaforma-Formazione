import { Body, Controller, Get, Put } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('me')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  me() {
    return this.service.me();
  }

  @Put()
  update(@Body() body: { fullName?: string; avatarUrl?: string }) {
    return this.service.updateMe(body);
  }
}
