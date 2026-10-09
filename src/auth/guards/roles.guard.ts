import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { RolUsuario } from '../entities/usuario.entity';
import { UsuarioAutenticado } from '../interfaces/usuario-autenticado.interface';

/**
 * Guard global de autorizacion basada en roles.
 *
 * Si el recurso no declara @Roles(...), la solicitud solo requiere estar
 * autenticada. Cuando se declaran roles, el rol del token debe estar incluido.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<RolUsuario[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!rolesRequeridos || rolesRequeridos.length === 0) {
      return true;
    }

    const peticion = context.switchToHttp().getRequest<{ user?: UsuarioAutenticado }>();
    const usuario = peticion.user;

    if (!usuario?.rol || !rolesRequeridos.includes(usuario.rol)) {
      throw new ForbiddenException('El usuario autenticado no tiene permisos para realizar esta operación.');
    }

    return true;
  }
}
