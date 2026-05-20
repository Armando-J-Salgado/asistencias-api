import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RepositoryBindingsModule } from '../infrastructure/prisma/repository-bindings.module';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { StudentSectionEnrollerDomain } from '../domain/services/student-section-enroller.domain';
import { GroupEnrollerDomain } from '../domain/services/group-enroller.domain';

@Module({
  imports: [RepositoryBindingsModule, AuthModule],
  controllers: [StudentsController],
  providers: [StudentsService, StudentSectionEnrollerDomain, GroupEnrollerDomain],


})

export class StudentsModule {}
