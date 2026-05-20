import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { RepositoryBindingsModule } from '../infrastructure/prisma/repository-bindings.module';
import { AttendanceFlowsController } from './attendance.controller';
import { AttendanceFlowsService } from './attendance-flows.service';

@Module({


  imports: [AuthModule, RepositoryBindingsModule],


  controllers: [AttendanceFlowsController],



  providers: [AttendanceFlowsService],





})

export class AttendanceModule {}
