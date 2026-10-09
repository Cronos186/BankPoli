import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

/** Parametros de ruta para consultar una cuenta. */
export class ConsultaSaldoParamsDto {
  @ApiProperty({
    description: 'Número de cuenta (10 dígitos).',
    example: '1000123456',
    pattern: '^\\d{10}$',
  })
  @IsString({ message: 'El número de cuenta debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El número de cuenta es obligatorio.' })
  @Matches(/^\d{10}$/, { message: 'El número de cuenta debe contener exactamente 10 dígitos.' })
  numero!: string;
}
