import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { RepositoryBindingsModule } from '../infrastructure/prisma/repository-bindings.module';
import { ScanTokenService } from './scan-token.service';

@Global()
@Module({
  imports: [
    RepositoryBindingsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) =>
        ({
          secret: cfg.get<string>('jwtSecret'),
          signOptions: {
            expiresIn: cfg.get<string>('jwtAccessExpires') ?? '15m',
          },
        }) as any,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ScanTokenService],
  exports: [AuthService, ScanTokenService, JwtModule, PassportModule],
})
export class AuthModule {}
