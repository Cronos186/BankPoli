import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtConfig } from '../../config/configuration';
import { JwtPayload, UsuarioAutenticado } from '../interfaces/usuario-autenticado.interface';

/**
 * Estrategia de validacion del token JWT.
 *
 * Verifica firma, vigencia, emisor y audiencia, y proyecta el contenido del
 * token al objeto de usuario disponible en los controladores. El token es
 * autocontenido: la validacion no consulta el nucleo transaccional.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const jwt = configService.getOrThrow<JwtConfig>('jwt');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwt.secret,
      issuer: jwt.issuer,
      audience: jwt.audience,
      algorithms: ['HS256'],
    });
  }

  validate(payload: JwtPayload): UsuarioAutenticado {
    return {
      id: payload.sub,
      usuario: payload.usuario,
      nombre: payload.nombre,
      rol: payload.rol,
      cuentaPrincipal: payload.cuentaPrincipal ?? null,
    };
  }
}
