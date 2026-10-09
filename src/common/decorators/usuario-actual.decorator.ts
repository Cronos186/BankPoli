import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UsuarioAutenticado } from '../../auth/interfaces/usuario-autenticado.interface';

/**
 * Inyecta en el controlador el usuario autenticado a partir del token JWT.
 * Uso: `@UsuarioActual() usuario: UsuarioAutenticado`
 */
export const UsuarioActual = createParamDecorator((_data: unknown, ctx: ExecutionContext): UsuarioAutenticado => {
  const request = ctx.switchToHttp().getRequest<{ user: UsuarioAutenticado }>();
  return request.user;
});
