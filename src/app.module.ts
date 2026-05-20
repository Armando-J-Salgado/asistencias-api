import { Module } from '@nestjs/common';

import { ConfigModule, ConfigService } from '@nestjs/config';

import { APP_FILTER, APP_GUARD } from '@nestjs/core';

import { MailerModule } from '@nestjs-modules/mailer';

import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';



import configuration from './config/configuration';



import { AllExceptionsFilter } from './common/filters/http-exception.filter';

import { AppController } from './app.controller';



import { AuthModule } from './auth/auth.module';

import { AttendanceModule } from './attendance/attendance.module';

import { CampusModule } from './campus/campus.module';

import { RepositoryBindingsModule } from './infrastructure/prisma/repository-bindings.module';

import { StorageModule } from './storage/storage.module';

import { StudentsModule } from './students/students.module';

import { UsersModule } from './users/users.module';



@Module({

  imports: [

    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),

    ThrottlerModule.forRoot([

      {

        name: 'default',

        ttl: 60_000,

        limit: 240,

      },

    ]),

    MailerModule.forRootAsync({

      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (cfg: ConfigService) => ({

        transport: {

          host: cfg.get<string>('mailer.host'),

          port: cfg.get<number>('mailer.port'),

          secure: cfg.get<boolean>('mailer.secure'),

          auth:

            cfg.get<string>('mailer.user') && cfg.get<string>('mailer.password')

              ? {

                  user: cfg.get<string>('mailer.user') as string,

                  pass: cfg.get<string>('mailer.password') as string,

                }

              : undefined,

        },

        defaults: {

          from: cfg.get<string>('mailer.from'),

        },

      }),

    }),

    RepositoryBindingsModule,

    AuthModule,

    CampusModule,

    StudentsModule,

    UsersModule,

    AttendanceModule,

    StorageModule,

  ],

  controllers: [AppController],

  providers: [

    { provide: APP_GUARD, useClass: ThrottlerGuard },

    { provide: APP_FILTER, useClass: AllExceptionsFilter },

  ],

})

export class AppModule {}

