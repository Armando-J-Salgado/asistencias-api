import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';

export class RegisterStudentDto {
  @IsEmail()
  email!: string;

  /** Password policy enforced again in validators. */

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @Length(1, 120)
  name!: string;

  @IsString()
  @Length(1, 120)
  lastname!: string;

  @IsString()
  @Length(1, 64)
  idCard!: string;
}

export class RegisterAssistantDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @Length(1, 120)
  name!: string;

  @IsString()
  @Length(1, 120)
  lastname!: string;

  @Matches(/^(AYUDANTE|TUTOR)$/)
  role!: 'AYUDANTE' | 'TUTOR';
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(8)
  newPassword!: string;

  /** Raw token mailed to the user's inbox */

  @IsString()
  @Length(24, 256)
  token!: string;
}
