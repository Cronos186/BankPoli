import { SetMetadata } from '@nestjs/common';
import { RolUsuario } from '../../auth/entities/usuario.entity';

export const ROLES_KEY = 'roles';

/**
 * Declara los roles autorizados para ejecutar un recurso.
 * Es interpretado por RolesGuard.
 */
export const Roles = (...roles: RolUsuario[]) => SetMetadata(ROLES_KEY, roles);
