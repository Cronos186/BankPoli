import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtConfig } from '../config/configuration';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * Modulo de autenticacion y gestion de identidad.
 *
 * Publica el servicio de login, la estrategia JWT y los guards que la API
 * aplica de forma global.
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwt = configService.getOrThrow<JwtConfig>('jwt');
        return {
          secret: jwt.secret,
          signOptions: {
            expiresIn: jwt.expiresInSeconds,
            issuer: jwt.issuer,
            audience: jwt.audience,
            algorithm: 'HS256',
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
