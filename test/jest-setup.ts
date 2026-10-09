/**
 * Entorno base para las pruebas automatizadas.
 *
 * Se ejecuta antes de importar cualquier modulo de la aplicacion, de modo que
 * las pruebas no dependan de la existencia del archivo .env ni de una base de
 * datos PostgreSQL disponible.
 */
process.env.NODE_ENV = 'test';
process.env.DB_DRIVER = 'memory';
process.env.JWT_SECRET = 'secreto-de-pruebas-suficientemente-largo-1234567890';
process.env.JWT_EXPIRES_IN_SECONDS = '3600';
