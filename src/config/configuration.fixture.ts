import { AppConfiguration } from './configuration';

/**
 * Configuracion usada por las pruebas cuando no se cargan variables de entorno.
 * Evita que las pruebas unitarias dependan de la existencia del archivo .env.
 */
export function configuracionDePruebas(overrides: Partial<AppConfiguration> = {}): AppConfiguration {
  const base: AppConfiguration = {
    nodeEnv: 'test',
    port: 3000,
    corsOrigins: ['*'],
    jwt: {
      secret: 'secreto-de-pruebas-suficientemente-largo',
      expiresInSeconds: 3600,
      issuer: 'bankpoli-api',
      audience: 'bankpoli-canales-digitales',
    },
    database: {
      driver: 'memory',
      host: 'localhost',
      port: 5433,
      user: 'bankpoli',
      password: 'bankpoli',
      database: 'bankpoli',
      schema: 'legacy',
      ssl: false,
      poolMax: 5,
    },
  };

  return { ...base, ...overrides };
}
