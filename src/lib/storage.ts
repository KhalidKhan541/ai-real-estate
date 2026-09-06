import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { nanoid } from "nanoid";

export interface StorageConfig {
  provider: "local" | "s3";
  local?: {
    uploadDir: string;
    baseUrl: string;
  };
  s3?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
  };
}

export interface UploadOptions {
  folder?: string;
  allowedTypes?: string[];
  maxSize?: number;
  resize?: {
    width?: number;
    height?: number;
    fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  };
  quality?: number;
}

export interface UploadResult {
  url: string;
  key: string;
  filename: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

const DEFAULT_CONFIG: StorageConfig = {
  provider: "local",
  local: {
    uploadDir: "./public/uploads",
    baseUrl: "/uploads",
  },
};

class LocalStorage {
  private uploadDir: string;
  private baseUrl: string;

  constructor(config: StorageConfig["local"]) {
    this.uploadDir = config?.uploadDir || "./public/uploads";
    this.baseUrl = config?.baseUrl || "/uploads";
  }

  private async ensureDir(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private getFilePath(key: string): string {
    return path.join(this.uploadDir, key);
  }

  async upload(
    file: Buffer | File,
    key: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const dirPath = path.dirname(this.getFilePath(key));
    await this.ensureDir(dirPath);

    let buffer: Buffer;
    if (file instanceof File) {
      buffer = Buffer.from(await file.arrayBuffer());
    } else {
      buffer = file;
    }

    let processedBuffer = buffer;
    let metadata: ImageMetadata | null = null;

    if (options?.resize) {
      const sharpInstance = sharp(buffer);
      const resizeOptions: sharp.ResizeOptions = {};

      if (options.resize.width) resizeOptions.width = options.resize.width;
      if (options.resize.height) resizeOptions.height = options.resize.height;
      if (options.resize.fit) resizeOptions.fit = options.resize.fit;

      processedBuffer = await sharpInstance
        .resize(resizeOptions)
        .toBuffer();

      const info = await sharp(processedBuffer).metadata();
      metadata = {
        width: info.width || 0,
        height: info.height || 0,
        format: info.format || "unknown",
        size: processedBuffer.length,
      };
    } else if (options?.quality) {
      processedBuffer = await sharp(buffer)
        .jpeg({ quality: options.quality })
        .toBuffer();
    }

    const filePath = this.getFilePath(key);
    await fs.writeFile(filePath, processedBuffer);

    return {
      url: `${this.baseUrl}/${key}`,
      key,
      filename: path.basename(key),
      size: processedBuffer.length,
      mimeType: this.getMimeType(key),
      width: metadata?.width,
      height: metadata?.height,
    };
  }

  async delete(key: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(key);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    return `${this.baseUrl}/${key}`;
  }

  async getMetadata(key: string): Promise<ImageMetadata | null> {
    try {
      const filePath = this.getFilePath(key);
      const info = await sharp(filePath).metadata();
      return {
        width: info.width || 0,
        height: info.height || 0,
        format: info.format || "unknown",
        size: (await fs.stat(filePath)).size,
      };
    } catch {
      return null;
    }
  }

  async listFiles(prefix: string): Promise<string[]> {
    const dirPath = path.join(this.uploadDir, prefix);
    try {
      const files = await fs.readdir(dirPath);
      return files.map((file) => path.join(prefix, file));
    } catch {
      return [];
    }
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
    return mimeTypes[ext] || "application/octet-stream";
  }
}

class ImageProcessor {
  static async processImage(
    buffer: Buffer,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: "jpeg" | "png" | "webp";
    } = {}
  ): Promise<Buffer> {
    const sharpInstance = sharp(buffer);

    if (options.width || options.height) {
      sharpInstance.resize({
        width: options.width,
        height: options.height,
        fit: "cover",
      });
    }

    switch (options.format) {
      case "png":
        sharpInstance.png({ quality: options.quality || 80 });
        break;
      case "webp":
        sharpInstance.webp({ quality: options.quality || 80 });
        break;
      default:
        sharpInstance.jpeg({ quality: options.quality || 80 });
    }

    return sharpInstance.toBuffer();
  }

  static async createThumbnail(
    buffer: Buffer,
    size: number = 200
  ): Promise<Buffer> {
    return sharp(buffer)
      .resize(size, size, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toBuffer();
  }

  static async getMetadata(buffer: Buffer): Promise<ImageMetadata> {
    const info = await sharp(buffer).metadata();
    return {
      width: info.width || 0,
      height: info.height || 0,
      format: info.format || "unknown",
      size: buffer.length,
    };
  }

  static async generateVariants(
    buffer: Buffer,
    sizes: Array<{ width: number; height: number; suffix: string }>
  ): Promise<Map<string, Buffer>> {
    const variants = new Map<string, Buffer>();

    for (const { width, height, suffix } of sizes) {
      const resized = await sharp(buffer)
        .resize(width, height, { fit: "cover" })
        .jpeg({ quality: 80 })
        .toBuffer();
      variants.set(suffix, resized);
    }

    return variants;
  }
}

let storageInstance: LocalStorage | null = null;

export function getStorage(config?: StorageConfig): LocalStorage {
  if (!storageInstance) {
    storageInstance = new LocalStorage(config?.local);
  }
  return storageInstance;
}

export function generateStorageKey(
  folder: string,
  filename: string,
  prefix?: string
): string {
  const id = nanoid(12);
  const ext = path.extname(filename);
  const baseName = path.basename(filename, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-");

  return prefix
    ? `${prefix}/${folder}/${id}-${baseName}${ext}`
    : `${folder}/${id}-${baseName}${ext}`;
}

export async function uploadPropertyImage(
  file: Buffer | File,
  propertyId: string,
  options?: UploadOptions
): Promise<UploadResult> {
  const storage = getStorage();
  const filename = file instanceof File ? file.name : "image.jpg";
  const key = generateStorageKey("properties", filename, propertyId);

  return storage.upload(file, key, {
    resize: { width: 1200, height: 800, fit: "cover" },
    quality: 85,
    ...options,
  });
}

export async function uploadAgentAvatar(
  file: Buffer | File,
  agentId: string
): Promise<UploadResult> {
  const storage = getStorage();
  const filename = file instanceof File ? file.name : "avatar.jpg";
  const key = generateStorageKey("agents", filename, agentId);

  return storage.upload(file, key, {
    resize: { width: 400, height: 400, fit: "cover" },
    quality: 90,
  });
}

export async function uploadDocument(
  file: Buffer | File,
  type: string,
  filename: string
): Promise<UploadResult> {
  const storage = getStorage();
  const key = generateStorageKey("documents", filename, type);

  return storage.upload(file, key, {
    allowedTypes: [".pdf", ".doc", ".docx"],
    maxSize: 10 * 1024 * 1024,
  });
}

export const storage = getStorage();
export { ImageProcessor };
export default storage;
