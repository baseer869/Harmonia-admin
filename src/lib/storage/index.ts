/**
 * Storage abstraction (object/file storage).
 *
 * Provider-agnostic interface so modules depend on the contract, not on S3 /
 * GCS / local disk. Tenant-scoped keys keep tenant assets isolated.
 */
export interface StoredObject {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

export interface StorageProvider {
  put(key: string, data: Buffer | Blob, contentType: string): Promise<StoredObject>;
  get(key: string): Promise<StoredObject | null>;
  remove(key: string): Promise<void>;
  /** Build a tenant-scoped object key. */
  scopedKey(tenantId: string, path: string): string;
}

/** Placeholder provider — swap for a real implementation (S3/GCS/etc.). */
export const storage: StorageProvider = {
  async put() {
    throw new Error('storage.put not implemented');
  },
  async get() {
    throw new Error('storage.get not implemented');
  },
  async remove() {
    throw new Error('storage.remove not implemented');
  },
  scopedKey(tenantId, path) {
    return `tenants/${tenantId}/${path.replace(/^\/+/, '')}`;
  },
};
