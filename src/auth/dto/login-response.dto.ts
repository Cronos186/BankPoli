import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RolUsuario, Usuario } from '../entities/usuario.entity';

/** Datos publicos del usuario autenticado (nunca incluye credenciales). */
export class UsuarioAutenticadoDto {
  @ApiProperty({ example: '3f1c9d1e-4a67-4a2e-9e0f-2b1f7c8d9a01' })
  id!: string;

  @ApiProperty({ example: 'cliente1' })
  usuario!: string;

  @ApiProperty({ example: 'Ana Maria Cliente' })
  nombre!: string;

  @ApiProperty({ enum: RolUsuario, example: RolUsuario.CLIENTE })
  rol!: RolUsuario;

  @ApiPropertyOptional({ example: '1000123456', nullable: true })
  cuentaPrincipal!: string | null;

  static desde(usuario: Usuario): UsuarioAutenticadoDto {
    return {
      id: usuario.id,
      usuario: usuario.usuario,
      nombre: usuario.nombre,
      rol: usuario.rol,
      cuentaPrincipal: usuario.cuentaPrincipal,
    };
  }
}

/** Respuesta del servicio de autenticacion. */
export class LoginResponseDto {
  @ApiProperty({
    description: 'Token JWT que debe enviarse en el encabezado Authorization como "Bearer <token>".',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.firma',
  })
  accessToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: string;

  @ApiProperty({ description: 'Vigencia del token en segundos.', example: 3600 })
  expiresIn!: number;

  @ApiProperty({ type: UsuarioAutenticadoDto })
  usuario!: UsuarioAutenticadoDto;
}
