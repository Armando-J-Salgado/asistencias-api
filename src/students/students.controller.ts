import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPrincipal } from '../auth/auth.types';
import { StudentsService } from './students.service';
import { EnrollSectionDto, JoinGroupDto } from '../campus/dto/campus.dto';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {

  constructor(private readonly students: StudentsService) {}

  @Get('me/attendance-checks')


  @Roles('student')


  attendanceList(@CurrentUser() user: JwtPrincipal) {



    return this.students.listAttendance(user);


  }



  @Get('me/attendance-checks/:checkId')


  @Roles('student')


  attendanceOne(
    @CurrentUser() user: JwtPrincipal,
    @Param('checkId') checkId: string,
  ) {


    return this.students.attendanceDetail(user, checkId);


  }



  @Get('me/attendance-checks/:checkId/qr-token')


  @Roles('student')


  qr(@CurrentUser() user: JwtPrincipal, @Param('checkId') checkId: string) {


    return this.students.mintQr(user, checkId);


  }

  @Post('me/enroll-section')
  @Roles('student')
  enroll(@CurrentUser() user: JwtPrincipal, @Body() body: EnrollSectionDto) {
    return this.students.enrollSection(user, body.sectionId);
  }

  @Post('me/groups/join')


  @Roles('student')


  join(@CurrentUser() user: JwtPrincipal, @Body() body: JoinGroupDto) {


    return this.students.joinGroup(user, body.groupId);


  }



  @Post('me/groups/leave')


  @Roles('student')


  leave(@CurrentUser() user: JwtPrincipal) {



    return this.students.leaveGroup(user);



  }



}
