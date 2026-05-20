import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SectionCreateDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sectionNumber!: number;
}

export class GroupUpsertDto {
  @IsString()
  @Length(1, 160)
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  number!: number;
}

export class AssistantshipWriteDto {
  @IsISO8601()
  date!: string;

  @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
  startTime!: string;

  @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
  endTime!: string;
}

export class AssistantshipPatchDto {
  @IsOptional()
  @IsISO8601()
  date?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
  startTime?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
  endTime?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PatchUserAdminDto {
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignStudentSectionDto {
  @IsString()
  @Length(10, 80)
  sectionId!: string;
}

export class EnrollSectionDto {
  @IsString()
  @Length(10, 80)
  sectionId!: string;
}

export class ChangePasswordDto {
  @IsString()
  @Length(8, 200)
  currentPassword!: string;

  @IsString()
  @Length(8, 200)
  newPassword!: string;
}

export class JoinGroupDto {
  @IsString()
  @Length(10, 80)
  groupId!: string;
}

export class GroupMembersDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @Length(10, 80, { each: true })
  studentIds!: string[];
}
