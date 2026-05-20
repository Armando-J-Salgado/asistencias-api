import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPrincipal as JP } from '../auth/auth.types';
import { SectionsService } from './sections.service';
import { GroupsService } from './groups.service';
import { AssistantshipsService } from './assistantships.service';
import {
  AssistantshipPatchDto,
  AssistantshipWriteDto,
  GroupUpsertDto,
  GroupMembersDto,
  SectionCreateDto,
} from './dto/campus.dto';

/** Sections tree + nested groups & assistantships to match the SPA navigation. */

@Controller('sections')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SectionsController {
  constructor(
    private readonly sections: SectionsService,
    private readonly groups: GroupsService,
    private readonly assistantships: AssistantshipsService,
  ) {}

  @Get()
  @Roles('student', 'assistant', 'admin')
  gallery() {
    return this.sections.gallery();
  }

  @Post()
  @Roles('admin')
  create(@Body() body: SectionCreateDto) {
    return this.sections.createAdminOnly(Number(body.sectionNumber));
  }

  @Patch(':sectionId/deactivate')
  @Roles('admin')
  deactivate(@Param('sectionId') sectionId: string) {
    return this.sections.deactivateAdmin(sectionId);
  }

  @Get(':sectionId/students')
  @Roles('assistant', 'admin')
  sectionStudents(@Param('sectionId') sectionId: string) {
    return this.sections.listStudentsForSection(sectionId);
  }

  @Get(':sectionId/groups')
  @Roles('student', 'assistant', 'admin')
  groupsList(@Param('sectionId') sectionId: string) {
    return this.groups.list(sectionId);
  }

  @Post(':sectionId/groups')
  @Roles('assistant', 'admin')
  groupsCreate(
    @Param('sectionId') sectionId: string,
    @Body() body: GroupUpsertDto,
    @CurrentUser() user: JP,
  ) {
    return this.groups.create(sectionId, user, {
      name: body.name,
      number: Number(body.number),
    });
  }

  @Patch(':sectionId/groups/:groupId')
  @Roles('assistant', 'admin')
  groupsPatch(
    @Param('sectionId') sectionId: string,
    @Param('groupId') groupId: string,
    @Body() body: Partial<GroupUpsertDto & { isActive?: boolean }>,
    @CurrentUser() user: JP,
  ) {
    const patch: Record<string, unknown> = {};

    if (body.name !== undefined) patch.name = body.name;


    if (body.number !== undefined) patch.number = Number(body.number);
    if (body.isActive !== undefined) patch.isActive = body.isActive;

    return this.groups.patch(sectionId, user, groupId, patch as any);


  }

  @Patch(':sectionId/groups/:groupId/members')
  @Roles('assistant', 'admin')
  groupMembersPatch(
    @Param('sectionId') sectionId: string,
    @Param('groupId') groupId: string,
    @Body() body: GroupMembersDto,
    @CurrentUser() user: JP,
  ) {
    return this.groups.replaceMembers(sectionId, user, groupId, body.studentIds);
  }

  @Delete(':sectionId/groups/:groupId')
  @Roles('admin')
  groupsDelete(
    @Param('sectionId') sectionId: string,
    @Param('groupId') groupId: string,
    @CurrentUser() user: JP,
  ) {
    return this.groups.delete(sectionId, user, groupId);
  }



  @Get(':sectionId/groups/:groupId/members')


  @Roles('student', 'assistant', 'admin')



  groupMembers(
    @Param('sectionId') sectionId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.groups.members(sectionId, groupId);



  }



  @Get(':sectionId/assistantships')


  @Roles('student', 'assistant', 'admin')



  ashList(@Param('sectionId') sectionId: string) {


    return this.assistantships.list(sectionId);


  }



  @Post(':sectionId/assistantships')


  @Roles('assistant', 'admin')


  ashCreate(
    @Param('sectionId') sectionId: string,
    @Body() body: AssistantshipWriteDto,
    @CurrentUser() user: JP,

  ) {


    return this.assistantships.create(sectionId, user, body);


  }



  @Patch(':sectionId/assistantships/:assistantshipId')


  @Roles('assistant', 'admin')



  ashPatch(
    @Param('assistantshipId') assistantshipId: string,
    @Body() body: AssistantshipPatchDto,

    @CurrentUser() user: JP,

  ) {



    return this.assistantships.patch(assistantshipId, user, {


      date: body.date,



      startTime: body.startTime,



      endTime: body.endTime,



      isActive: body.isActive,

    });




  }



}
