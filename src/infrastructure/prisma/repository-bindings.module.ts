import { Module } from '@nestjs/common';
import {
  ATTENDANCE_CHECK_REPOSITORY,
  ASSISTANT_REPOSITORY,
  ASSISTANTSHIP_REPOSITORY,
  GROUP_REPOSITORY,
  SECTION_REPOSITORY,
  STUDENT_REPOSITORY,
  USER_REPOSITORY,
} from '../../domain/tokens/injection.tokens';
import { PrismaInfrastructureModule } from './prisma.module';
import { PrismaUserRepository } from './repos/prisma-user.repository';
import { PrismaStudentRepository } from './repos/prisma-student.repository';
import { PrismaAttendanceCheckRepository } from './repos/prisma-attendance.repository';
import {
  PrismaGroupRepository,
  PrismaSectionRepository,
} from './repos/prisma-section-groups.repository';
import { PrismaAssistantRepository } from './repos/prisma-assistant.repository';
import { PrismaAssistantshipRepository } from './repos/prisma-assistantship.repository';

@Module({
  imports: [PrismaInfrastructureModule],
  providers: [
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: STUDENT_REPOSITORY, useClass: PrismaStudentRepository },
    { provide: ASSISTANT_REPOSITORY, useClass: PrismaAssistantRepository },
    { provide: SECTION_REPOSITORY, useClass: PrismaSectionRepository },
    { provide: GROUP_REPOSITORY, useClass: PrismaGroupRepository },
    {
      provide: ASSISTANTSHIP_REPOSITORY,
      useClass: PrismaAssistantshipRepository,
    },
    {
      provide: ATTENDANCE_CHECK_REPOSITORY,
      useClass: PrismaAttendanceCheckRepository,
    },
  ],
  exports: [
    USER_REPOSITORY,
    STUDENT_REPOSITORY,
    ASSISTANT_REPOSITORY,
    SECTION_REPOSITORY,
    GROUP_REPOSITORY,
    ASSISTANTSHIP_REPOSITORY,
    ATTENDANCE_CHECK_REPOSITORY,
  ],
})
export class RepositoryBindingsModule {}
