import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { JwtPrincipal } from '../auth/auth.types';
import type {
  IGroupRepository,
  ISectionRepository,
} from '../domain/ports/sections-and-groups.ports';
import type { IStudentRepository } from '../domain/ports/student-and-attendance.ports';
import {
  GROUP_REPOSITORY,
  SECTION_REPOSITORY,
  STUDENT_REPOSITORY,
} from '../domain/tokens/injection.tokens';
import { GroupEnrollerDomain } from '../domain/services/group-enroller.domain';
import { GroupValidator } from '../domain/validators/group.validator';

@Injectable()
export class GroupsService {
  private readonly groupValidator = new GroupValidator();

  constructor(
    @Inject(SECTION_REPOSITORY) private readonly sections: ISectionRepository,
    @Inject(GROUP_REPOSITORY) private readonly groups: IGroupRepository,
    @Inject(STUDENT_REPOSITORY) private readonly students: IStudentRepository,
    private readonly groupEnroller: GroupEnrollerDomain,
  ) {}

  async list(sectionId: string) {
    const s = await this.sections.findActive(sectionId);
    if (!s) throw new NotFoundException('Section not found');
    return this.groups.listActiveForSection(sectionId);
  }

  async create(
    sectionId: string,
    actor: JwtPrincipal,
    input: { name: string; number: number },
  ) {
    this.groupValidator.validateUpsert({
      name: input.name,
      number: input.number,
    });

    const section = await this.sections.findActive(sectionId);
    if (!section) throw new NotFoundException('Section not found');

    const isAdmin = actor.personas.includes('ADMIN');
    const isAssistant = actor.personas.includes('ASSISTANT');
    if (!(isAdmin || isAssistant)) {
      throw new ForbiddenException('Only assistants/admins can create groups');
    }

    return this.groups.create({
      sectionId,
      name: input.name.trim(),
      number: input.number,
    });
  }

  async patch(
    sectionId: string,
    actor: JwtPrincipal,
    groupId: string,
    patch: Partial<{ name: string; number: number; isActive: boolean }>,
  ) {
    await this.ensureGroupInSection(sectionId, groupId);
    await this.assertStaffCanEditGroups(actor);
    return this.groups.update(groupId, patch);
  }

  async members(sectionId: string, groupId: string) {
    await this.ensureGroupInSection(sectionId, groupId);
    return this.groups.members(groupId);
  }

  async delete(sectionId: string, actor: JwtPrincipal, groupId: string) {
    await this.ensureGroupInSection(sectionId, groupId);
    this.assertAdminCanDeleteGroups(actor);
    await this.groups.deleteAndUnassignMembers(groupId);
    return { ok: true };
  }

  async replaceMembers(
    sectionId: string,
    actor: JwtPrincipal,
    groupId: string,
    studentIds: string[],
  ) {
    await this.ensureGroupInSection(sectionId, groupId);
    await this.assertStaffCanEditGroups(actor);

    const roster = await this.students.listCardsBySection(sectionId);
    const rosterByStudentId = new Map(roster.map((row) => [row.studentId, row]));
    const nextStudentIds = [...new Set(studentIds)];

    for (const studentId of nextStudentIds) {
      if (!rosterByStudentId.has(studentId)) {
        throw new NotFoundException('Student not found in this section');
      }
    }

    const currentMembers = await this.groups.members(groupId);
    const nextUserIds = new Set(
      nextStudentIds.map((studentId) => rosterByStudentId.get(studentId)!.userId),
    );

    for (const member of currentMembers) {
      if (!nextUserIds.has(member.userId)) {
        await this.students.setGroup(member.userId, null);
      }
    }

    for (const studentId of nextStudentIds) {
      await this.students.setGroup(rosterByStudentId.get(studentId)!.userId, groupId);
    }

    return this.groups.members(groupId);
  }

  async enrollSelf(actor: JwtPrincipal, groupId: string) {
    const g = await this.groups.findActive(groupId);
    if (!g) throw new NotFoundException('Group not found');
    await this.groupEnroller.enroll(actor.sub, groupId);
    return { ok: true };

  }



  async leaveSelf(actor: JwtPrincipal) {


    await this.groupEnroller.leave(actor.sub);
    return { ok: true };
  }



  private async ensureGroupInSection(sectionId: string, groupId: string) {


    const g = await this.groups.findActive(groupId);


    if (!g || g.sectionId !== sectionId) {
      throw new NotFoundException('Group not found in this section');
    }
    return g;
  }



  private async assertStaffCanEditGroups(actor: JwtPrincipal) {


    const ok =
      actor.personas.includes('ADMIN') || actor.personas.includes('ASSISTANT');
    if (!ok) throw new ForbiddenException('Only assistants/admins');


  }

  private assertAdminCanDeleteGroups(actor: JwtPrincipal) {
    const ok = actor.personas.includes('ADMIN');
    if (!ok) throw new ForbiddenException('Only admins can delete groups');
  }



}
