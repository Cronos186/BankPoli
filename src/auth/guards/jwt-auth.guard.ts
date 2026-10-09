import { ExecutionContext, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { UsuarioAutenticado } from '../interfaces/usuario-autenticado.interface';

/**
 * Guard global de autenticacion.
 *
 * La politica por defecto de la API es "denegar": toda solicitud debe presentar
 * un token JWT valido, salvo los recursos marcados con @Public().
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const esPublico = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (esPublico) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = UsuarioAutenticado>(err: unknown, user: unknown, info: unknown): TUser {
    if (err || !user) {
      if (err instanceof HttpException) {
        throw err;
      }
      // `info` incluye el motivo tecnico (expirado, malformado, etc.); se registra
      // por separado si se requiere auditoria, pero no se expone al consumidor.
      void info;
      throw new UnauthorizedException('Token de acceso ausente, inválido o expirado.');
    }
    return user as TUser;
  }
}
