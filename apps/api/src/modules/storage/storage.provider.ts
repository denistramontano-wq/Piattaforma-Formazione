export interface UploadedObject {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export interface StorageProvider {
  /** Salva il file e restituisce l'URL pubblico da cui è raggiungibile. */
  upload(object: UploadedObject): Promise<string>;
}
