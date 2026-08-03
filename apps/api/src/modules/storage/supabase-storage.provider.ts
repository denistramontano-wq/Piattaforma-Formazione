import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { StorageProvider, UploadedObject } from './storage.provider';

/**
 * Salva i file nello storage di Supabase (piano gratuito, spazio permanente — a differenza
 * del piano gratuito Render che non offre dischi persistenti). Usato in produzione quando
 * SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY sono impostate — vedi storage.module.ts.
 * Richiede un bucket pubblico già creato su Supabase (nome in SUPABASE_STORAGE_BUCKET).
 */
export class SupabaseStorageProvider implements StorageProvider {
  private readonly client: SupabaseClient;
  private readonly bucket: string;

  constructor(url: string, serviceRoleKey: string, bucket: string) {
    this.client = createClient(url, serviceRoleKey);
    this.bucket = bucket;
  }

  async upload({ buffer, filename, mimeType }: UploadedObject): Promise<string> {
    const { error } = await this.client.storage.from(this.bucket).upload(filename, buffer, {
      contentType: mimeType,
      upsert: false,
    });
    if (error) {
      throw new Error(`Caricamento su Supabase Storage fallito: ${error.message}`);
    }
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(filename);
    return data.publicUrl;
  }
}
