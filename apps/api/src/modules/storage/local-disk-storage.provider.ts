import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import type { StorageProvider, UploadedObject } from './storage.provider';

// process.cwd() (non __dirname) per restare stabile sia in dev (ts-node/tsc --watch,
// che compila in dist/) sia in produzione — altrimenti la cartella verrebbe ricreata
// dentro dist/ e persa a ogni build (nest-cli.json ha deleteOutDir: true).
export const UPLOADS_DIR = join(process.cwd(), 'uploads');

/**
 * Salva i file su disco locale, servito staticamente da main.ts sotto /uploads/.
 * Usato di default in sviluppo. In produzione richiede un disco persistente
 * (vedi render.yaml) — altrimenti i file vengono persi ad ogni deploy: in quel
 * caso conviene SupabaseStorageProvider (vedi storage.module.ts).
 */
export class LocalDiskStorageProvider implements StorageProvider {
  async upload({ buffer, filename }: UploadedObject): Promise<string> {
    const filePath = join(UPLOADS_DIR, filename);
    const dir = dirname(filePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(filePath, buffer);

    const publicOrigin = process.env.API_PUBLIC_URL ?? 'http://localhost:3001';
    return `${publicOrigin}/uploads/${filename}`;
  }
}
