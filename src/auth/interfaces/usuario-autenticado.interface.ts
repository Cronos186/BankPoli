import { RolUsuario } from '../../auth/entities/usuario.entity';

/** Contenido del token JWT emitido por la API. */
export interface JwtPayload {
  /** Identificador del usuario en el nucleo transaccional. */
  sub: string;
  usuario: string;
  nombre: string;
  rol: RolUsuario;
  cuentaPrincipal: string | null;
  /** Emisor del token. */
  iss?: string;
  /** Audiencia del token. */
  aud?: string;
  /** Fecha de expedicion (segundos UNIX). */
  iat?: number;
  /** Fecha de expiracion (segundos UNIX). */
  exp?: number;
}

/**
 * Vista del usuario autenticado disponible en los controladores.
 * Es la proyeccion del token, sin credenciales ni datos sensibles.
 */
export interface UsuarioAutenticado {
  id: string;
  usuario: string;
  nombre: string;
  rol: RolUsuario;
  cuentaPrincipal: string | null;
}
