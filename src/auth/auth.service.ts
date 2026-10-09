import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtConfig } from '../config/configuration';
import { CredencialesInvalidasError } from '../legacy/legacy-errors';
import { LegacyAdapterService } from '../transferencias/legacy-adapter.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto, UsuarioAutenticadoDto } from './dto/login-response.dto';
import { JwtPayload } from './interfaces/usuario-autenticado.interface';

/**
 * Servicio de autenticacion.
 *
 * Valida las credenciales contra el nucleo transaccional (a traves del Legacy
 * Wrapper) y emite el token JWT que habilita el consumo de los servicios
 * protegidos. No conoce como el core almacena los usuarios ni sus contrasenas.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwt: JwtConfig;

  constructor(
    private readonly adapter: LegacyAdapterService,
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.jwt = configService.getOrThrow<JwtConfig>('jwt');
  }

  /**
   * Autentica un usuario y genera su token de acceso.
   * Devuelve siempre el mismo error ante usuario inexistente, usuario inactivo
   * o contrasena incorrecta, para no revelar la existencia de cuentas.
   */
  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const usuario = await this.adapter.autenticarUsuario(dto.usuario, dto.contrasena);

    if (!usuario || !usuario.activo) {
      this.logger.warn(`Intento de autenticacion fallido para el usuario "${dto.usuario}".`);
      throw new CredencialesInvalidasError();
    }

    const payload: JwtPayload = {
      sub: usuario.id,
      usuario: usuario.usuario,
      nombre: usuario.nombre,
      rol: usuario.rol,
      cuentaPrincipal: usuario.cuentaPrincipal,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.jwt.secret,
      expiresIn: this.jwt.expiresInSeconds,
      issuer: this.jwt.issuer,
      audience: this.jwt.audience,
      algorithm: 'HS256',
    });

    this.logger.log(`Autenticacion exitosa del usuario "${usuario.usuario}" con rol ${usuario.rol}.`);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.jwt.expiresInSeconds,
      usuario: UsuarioAutenticadoDto.desde(usuario),
    };
  }
}
