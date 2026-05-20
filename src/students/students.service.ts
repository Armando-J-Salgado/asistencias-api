import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { StudentSectionEnrollerDomain } from '../domain/services/student-section-enroller.domain';
import type { JwtPrincipal } from '../auth/auth.types';
import type { IStudentRepository } from '../domain/ports/student-and-attendance.ports';
import type { IAttendanceCheckRepository } from '../domain/ports/student-and-attendance.ports';
import {
  ATTENDANCE_CHECK_REPOSITORY,
  STUDENT_REPOSITORY,
} from '../domain/tokens/injection.tokens';
import { GroupEnrollerDomain } from '../domain/services/group-enroller.domain';
import { ScanTokenService } from '../auth/scan-token.service';

@Injectable()
export class StudentsService {
  constructor(
    @Inject(STUDENT_REPOSITORY) private readonly students: IStudentRepository,
    @Inject(ATTENDANCE_CHECK_REPOSITORY)
    private readonly attendance: IAttendanceCheckRepository,
    private readonly sectionEnroller: StudentSectionEnrollerDomain,
    private readonly groupEnroller: GroupEnrollerDomain,
    private readonly scanTokens: ScanTokenService,
  ) {}

  private async requireStudent(actor: JwtPrincipal) {
    if (!actor.personas.includes('STUDENT')) {
      throw new ForbiddenException('Student persona required');

    }



    const s = await this.students.findAggregateByUserId(actor.sub);


    if (!s) throw new ForbiddenException('Student profile missing');



    return s;


  }



  async listAttendance(user: JwtPrincipal) {


    await this.requireStudent(user);
    return this.attendance.listForStudentUser(user.sub);


  }



  async attendanceDetail(user: JwtPrincipal, checkId: string) {


    await this.requireStudent(user);


    const row = await this.attendance.findForStudent(checkId, user.sub);



    if (!row) {


      throw new ForbiddenException('Not found');


    }



    return row;


  }



  async mintQr(user: JwtPrincipal, checkId: string) {


    await this.requireStudent(user);


    const row = await this.attendance.findForStudent(checkId, user.sub);


    if (!row) {


      throw new ForbiddenException('Not found');


    }



    const token = this.scanTokens.mintAttendanceCheckQrToken(checkId);



    return { token };
  }

  async enrollSection(_user: JwtPrincipal, _sectionId: string) {
    throw new ForbiddenException(
      'La inscripción en sección la realiza un administrador',
    );
  }

  async joinGroup(_user: JwtPrincipal, _groupId: string) {
    throw new ForbiddenException(
      'La asignación de grupo la realiza un administrador',
    );
  }

  async leaveGroup(_user: JwtPrincipal) {
    throw new ForbiddenException(
      'No puedes modificar tu grupo; contacta a un administrador',
    );
  }



}
