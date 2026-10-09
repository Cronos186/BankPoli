import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** Credenciales enviadas por un canal digital para autenticarse. */
export class LoginDto {
  @ApiProperty({
    description: 'Nombre de usuario registrado en el nucleo transaccional.',
    example: 'cliente1',
    maxLength: 50,
  })
  @IsString({ message: 'El usuario debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El usuario es obligatorio.' })
  @MaxLength(50, { message: 'El usuario no puede superar los 50 caracteres.' })
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'El usuario solo puede contener letras, números, punto, guion y guion bajo.',
  })
  usuario!: string;

  @ApiProperty({
    description: 'Contraseña del usuario. Nunca se almacena ni se registra en la API.',
    example: 'Cliente123*',
    minLength: 8,
    maxLength: 72,
    format: 'password',
  })
  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @MaxLength(72, { message: 'La contraseña no puede superar los 72 caracteres.' })
  contrasena!: string;
}
