import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshDto,
  RegisterAssistantDto,
  RegisterStudentDto,
  ResetPasswordDto,
} from './dto/auth.requests';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register/student')
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  registerStudent(@Body() body: RegisterStudentDto) {
    return this.auth.registerStudent(body);
  }

  @Post('register/assistant')
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  registerAssistant(@Body() body: RegisterAssistantDto) {
    return this.auth.registerAssistant(body);
  }

  @Post('login')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  login(@Body() body: LoginDto) {
    return this.auth.login(body);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  refresh(@Body() body: RefreshDto) {
    return this.auth.refresh(body.refreshToken);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  forgot(@Body() body: ForgotPasswordDto) {
    return this.auth.forgotPassword(body.email);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  reset(@Body() body: ResetPasswordDto) {
    return this.auth.resetPassword(body.token, body.newPassword);
  }
}
