import { Module } from '@nestjs/common';

import { RepositoryBindingsModule } from '../infrastructure/prisma/repository-bindings.module';
import { StudentSectionEnrollerDomain } from '../domain/services/student-section-enroller.domain';
import { GroupEnrollerDomain } from '../domain/services/group-enroller.domain';

import { UsersController } from './users.controller';

import { UsersService } from './users.service';
import { UsersImportService } from './users-import.service';

@Module({


  imports: [RepositoryBindingsModule],




  controllers: [UsersController],







  providers: [
    UsersService,
    UsersImportService,
    StudentSectionEnrollerDomain,
    GroupEnrollerDomain,
  ],






})

export class UsersModule {}
