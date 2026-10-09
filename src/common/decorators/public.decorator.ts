import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca un recurso como publico, es decir, sin requerir token JWT.
 * La politica por defecto de la API es denegar: todo endpoint protegido
 * necesita autenticacion explicita.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
