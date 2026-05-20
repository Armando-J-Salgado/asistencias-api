import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPrincipal } from '../auth/auth.types';
import { ResolveScanDto, DecideAttendanceDto } from './dto/attendance.dto';

import { AttendanceFlowsService } from './attendance-flows.service';

@Controller('')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceFlowsController {


  constructor(private readonly flows: AttendanceFlowsService) {}



  @Post('attendance/scan/resolve')


  @Roles('assistant', 'admin')


  resolve(@Body() body: ResolveScanDto) {


    return this.flows.previewFromStudentQr(body.token);


  }



  @Post('attendance/checks/:checkId/decision')


  @Roles('assistant', 'admin')


  decide(
    @CurrentUser() user: JwtPrincipal,
    @Param('checkId') checkId: string,
    @Body() body: DecideAttendanceDto,

  ) {



    return this.flows.decide(user, checkId, body.approve);



  }



  @Get('assistantships/:assistantshipId/dashboard')


  @Roles('assistant', 'admin')



  dashboard(@Param('assistantshipId') assistantshipId: string) {


    return this.flows.dashboard(assistantshipId);


  }



}
