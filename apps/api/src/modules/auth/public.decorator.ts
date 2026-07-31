import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Esclude una rotta dall'AuthGuard globale (es. /health). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
