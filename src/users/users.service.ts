import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import argon2 from 'argon2';

import type { JwtPrincipal } from '../auth/auth.types';
import type { IUserRepository } from '../domain/ports/user-repository.port';
import type { IAssistantRepository } from '../domain/ports/assistant-repository.port';
import type { IStudentRepository } from '../domain/ports/student-and-attendance.ports';
import {

  ASSISTANT_REPOSITORY,

  STUDENT_REPOSITORY,


  USER_REPOSITORY,





} from '../domain/tokens/injection.tokens';


import type { PatchUserAdminDto } from '../campus/dto/campus.dto';
import { StudentSectionEnrollerDomain } from '../domain/services/student-section-enroller.domain';


@Injectable()

export class UsersService {


  constructor(


    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,

    @Inject(STUDENT_REPOSITORY) private readonly students: IStudentRepository,


    @Inject(ASSISTANT_REPOSITORY)



    private readonly assistants: IAssistantRepository,

    private readonly sectionEnroller: StudentSectionEnrollerDomain,

  ) {}




  async me(actor: JwtPrincipal) {



    const safe = await this.users.findByIdSafe(actor.sub);



    if (!safe) throw new NotFoundException();



    const student = await this.students.findAggregateByUserId(actor.sub);



    const assistant = await this.assistants.findAggregateByUserId(actor.sub);



    return {


      userId: safe.id,

      email: safe.email,



      name: safe.name,



      lastname: safe.lastname,



      isActive: safe.isActive,



      isAdmin: safe.isAdmin,



      personas: actor.personas,



      student:


        student == null




          ? null




          : {




              studentId: student.studentId,




              idCard: student.idCard,





              imageUrl: student.imageUrl,





              sectionId: student.sectionId,





              groupId: student.groupId,





            },





      assistant:


        assistant == null




          ? null




          : {




              assistantId: assistant.assistantId,





              role: assistant.role,




            },






    };





  }






  async patchMe(





    actor: JwtPrincipal,




    patch: {





      name?: string;





      lastname?: string;





      idCard?: string;





      imageUrl?: string;





    },






  ) {






    const studentRestricted =
      actor.personas.includes('STUDENT') && !actor.personas.includes('ADMIN');

    if (studentRestricted) {
      if (
        patch.name !== undefined ||
        patch.lastname !== undefined ||
        patch.idCard !== undefined
      ) {
        throw new ForbiddenException(
          'Los estudiantes solo pueden actualizar su fotografía desde el perfil',
        );
      }
    }

    if (patch.name !== undefined || patch.lastname !== undefined) {




      await this.users.updateProfile(actor.sub, {


        ...(patch.name !== undefined ? { name: patch.name } : {}),



        ...(patch.lastname !== undefined ? { lastname: patch.lastname } : {}),




      });




    }







    if (patch.idCard !== undefined || patch.imageUrl !== undefined) {




      const agg = await this.students.findAggregateByUserId(actor.sub);






      if (!agg) {




        throw new ForbiddenException(


          'Solo estudiantes pueden actualizar carnet/imagen desde este endpoint',





        );





      }







      await this.students.updateExtrasByUser(actor.sub, {


        ...(patch.idCard !== undefined ? { idCard: patch.idCard } : {}),




        ...(patch.imageUrl !== undefined


          ? { imageUrl: patch.imageUrl }






          : {}),






      });




    }







    return this.me(actor);






  }






  async patchPassword(






    actor: JwtPrincipal,




    dto: { currentPassword: string; newPassword: string },






  ) {






    const incl = await this.users.findByIdIncludingPassword(actor.sub);






    if (!incl?.passwordHash) throw new NotFoundException();





    const ok = await argon2




      .verify(incl.passwordHash, dto.currentPassword)




      .catch(() => false);





    if (!ok) throw new BadRequestException('Contraseña actual incorrecta');






    await this.users.updatePassword(


      actor.sub,






      await argon2.hash(dto.newPassword),





    );





    await this.users.revokeAllRefreshForUser(actor.sub);





    return { ok: true };






  }







  async adminList() {


    return this.users.listBriefForAdmin();


  }







  async adminBrief(targetUserId: string) {


    const brief = await this.users.findBriefPublicByIdForAdmin(targetUserId);





    if (!brief) throw new NotFoundException();





    return brief;





  }







  async adminPatch(targetUserId: string, dto: PatchUserAdminDto) {
    if (dto.isAdmin !== undefined) {
      await this.users.setAdmin(targetUserId, dto.isAdmin);
    }

    if (dto.isActive !== undefined) {
      await this.users.setActive(targetUserId, dto.isActive);
    }

    return this.adminBrief(targetUserId);
  }

  async adminAssignStudentSection(targetUserId: string, sectionId: string) {
    const brief = await this.users.findBriefPublicByIdForAdmin(targetUserId);
    if (!brief) throw new NotFoundException();
    if (!brief.studentId) {
      throw new BadRequestException('User is not a student');
    }

    await this.sectionEnroller.enroll(targetUserId, sectionId, {
      allowReassign: true,
    });
    return this.adminBrief(targetUserId);
  }
}
