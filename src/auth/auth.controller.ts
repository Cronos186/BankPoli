import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { UsuarioActual } from '../common/decorators/usuario-actual.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto, UsuarioAutenticadoDto } from './dto/login-response.dto';
import { UsuarioAutenticado } from './interfaces/usuario-autenticado.interface';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autenticar un usuario y generar el token JWT',
    description:
      'Valida las credenciales contra el nucleo transaccional y devuelve un token JWT que debe enviarse en el encabezado Authorization de los servicios protegidos.',
  })
  @ApiOkResponse({ description: 'Autenticación exitosa.', type: LoginResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Credenciales inválidas.',
    type: ErrorResponseDto,
    example: { statusCode: 401, message: 'Usuario o contraseña incorrectos.', codigo: 'CREDENCIALES_INVALIDAS' },
  })
  login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  @Get('perfil')
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Consultar los datos del usuario autenticado',
    description:
      'Devuelve la información contenida en el token, útil para que los canales digitales validen la sesión.',
  })
  @ApiOkResponse({ description: 'Datos del usuario autenticado.', type: UsuarioAutenticadoDto })
  perfil(@UsuarioActual() usuario: UsuarioAutenticado): UsuarioAutenticadoDto {
    return {
      id: usuario.id,
      usuario: usuario.usuario,
      nombre: usuario.nombre,
      rol: usuario.rol,
      cuentaPrincipal: usuario.cuentaPrincipal,
    };
  }
}
