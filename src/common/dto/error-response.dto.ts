import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** DTO de documentacion para las respuestas de error de la API. */
export class ErrorResponseDto {
  @ApiProperty({ example: 400, description: 'Codigo HTTP del resultado.' })
  statusCode!: number;

  @ApiProperty({
    example: 'La cuenta de origen debe contener 10 dígitos.',
    description: 'Mensaje o lista de mensajes de validacion/negocio.',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message!: string | string[];

  @ApiPropertyOptional({ example: 'Bad Request', description: 'Nombre del codigo HTTP.' })
  error?: string;

  @ApiPropertyOptional({
    example: 'SALDO_INSUFICIENTE',
    description: 'Codigo de negocio estable, cuando aplica.',
  })
  codigo?: string;

  @ApiProperty({ example: '/api/v1/transferencias' })
  path!: string;

  @ApiProperty({ example: '2026-10-01T12:00:00.000Z' })
  timestamp!: string;
}
