import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';


import { RolesGuard } from '../auth/guards/roles.guard';


import { Roles } from '../common/decorators/roles.decorator';


import { CurrentUser } from '../common/decorators/current-user.decorator';


import type { JwtPrincipal } from '../auth/auth.types';


import { UsersService } from './users.service';
import { UsersImportService } from './users-import.service';


import { PatchMeDto } from './dto/profile.dto';


import { ChangePasswordDto, PatchUserAdminDto, AssignStudentSectionDto } from '../campus/dto/campus.dto';

@Controller('users')


@UseGuards(JwtAuthGuard)


export class UsersController {



  constructor(
    private readonly users: UsersService,
    private readonly importService: UsersImportService,
  ) {}



  @Get('me')


  me(@CurrentUser() user: JwtPrincipal) {


    return this.users.me(user);



  }



  @Patch('me')


  patchMe(@CurrentUser() user: JwtPrincipal, @Body() body: PatchMeDto) {


    return this.users.patchMe(user, body);



  }



  @Patch('me/password')


  patchPw(@CurrentUser() user: JwtPrincipal, @Body() body: ChangePasswordDto) {


    return this.users.patchPassword(user, {


      currentPassword: body.currentPassword,


      newPassword: body.newPassword,


    });



  }



  @Get('admin')


  @UseGuards(RolesGuard)


  @Roles('admin')


  adminList() {


    return this.users.adminList();


  }



  @Post('admin/import-students')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  importStudents(@UploadedFile() file?: { buffer: Buffer }) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Archivo CSV requerido (campo file)');
    }
    return this.importService.importStudentsFromCsv(file.buffer);
  }

  @Get('admin/:userId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  adminOne(@Param('userId') userId: string) {
    return this.users.adminBrief(userId);
  }

  @Patch('admin/:userId/student-section')
  @UseGuards(RolesGuard)
  @Roles('admin')
  adminAssignSection(
    @Param('userId') userId: string,
    @Body() body: AssignStudentSectionDto,
  ) {
    return this.users.adminAssignStudentSection(userId, body.sectionId);
  }

  @Patch('admin/:userId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  adminPatch(@Param('userId') userId: string, @Body() body: PatchUserAdminDto) {
    return this.users.adminPatch(userId, body);
  }
}



