/**
 * Configuracion central de la aplicacion.
 *
 * Toda la configuracion se lee desde variables de entorno y se expone a traves
 * de ConfigService con una estructura tipada, evitando que los servicios
 * dependan directamente de `process.env`.
 */

export type DbDriver = 'postgres' | 'memory';

export interface JwtConfig {
  /** Secreto usado para firmar y verificar los tokens JWT. */
  secret: string;
  /** Vigencia del token expresada en segundos. */
  expiresInSeconds: number;
  /** Emisor declarado en el token. */
  issuer: string;
  /** Audiencia declarada en el token. */
  audience: string;
}

export interface DatabaseConfig {
  /** Motor que implementa el nucleo transaccional simulado. */
  driver: DbDriver;
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  /** Esquema donde reside el nucleo legacy simulado. */
  schema: string;
  ssl: boolean;
  poolMax: number;
}

export interface AppConfiguration {
  nodeEnv: string;
  port: number;
  corsOrigins: string[];
  jwt: JwtConfig;
  database: DatabaseConfig;
}

const DEFAULT_DEV_JWT_SECRET = 'bankpoli-desarrollo-secreto-local-1234567890';
const DRIVERS_SOPORTADOS: DbDriver[] = ['postgres', 'memory'];

function parseNumber(value: string | undefined, fallback: number, nombre: string): number {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`La variable de entorno ${nombre} debe ser numerica (valor recibido: "${value}").`);
  }
  return parsed;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }
  return ['1', 'true', 'yes', 'si'].includes(value.trim().toLowerCase());
}

function parseOrigins(value: string | undefined): string[] {
  if (value === undefined || value.trim() === '' || value.trim() === '*') {
    return ['*'];
  }
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export default function configuration(): AppConfiguration {
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  const driver = (process.env.DB_DRIVER ?? 'postgres').trim().toLowerCase() as DbDriver;
  if (!DRIVERS_SOPORTADOS.includes(driver)) {
    throw new Error(`DB_DRIVER invalido: "${driver}". Valores admitidos: ${DRIVERS_SOPORTADOS.join(', ')}.`);
  }

  let jwtSecret = process.env.JWT_SECRET?.trim() ?? '';
  if (jwtSecret === '') {
    if (nodeEnv === 'production') {
      throw new Error('JWT_SECRET es obligatorio cuando NODE_ENV=production.');
    }
    jwtSecret = DEFAULT_DEV_JWT_SECRET;
  }

  return {
    nodeEnv,
    port: parseNumber(process.env.PORT, 3000, 'PORT'),
    corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
    jwt: {
      secret: jwtSecret,
      expiresInSeconds: parseNumber(process.env.JWT_EXPIRES_IN_SECONDS, 3600, 'JWT_EXPIRES_IN_SECONDS'),
      issuer: process.env.JWT_ISSUER ?? 'bankpoli-api',
      audience: process.env.JWT_AUDIENCE ?? 'bankpoli-canales-digitales',
    },
    database: {
      driver,
      host: process.env.DB_HOST ?? 'localhost',
      port: parseNumber(process.env.DB_PORT, 5433, 'DB_PORT'),
      user: process.env.DB_USER ?? 'bankpoli',
      password: process.env.DB_PASSWORD ?? 'bankpoli',
      database: process.env.DB_NAME ?? 'bankpoli',
      schema: process.env.DB_SCHEMA ?? 'legacy',
      ssl: parseBoolean(process.env.DB_SSL, false),
      poolMax: parseNumber(process.env.DB_POOL_MAX, 10, 'DB_POOL_MAX'),
    },
  };
}
