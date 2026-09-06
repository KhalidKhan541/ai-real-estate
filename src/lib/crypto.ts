import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { nanoid } from "nanoid";

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "30d";
const API_KEY_PREFIX = "are_";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function generateRefreshToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyToken<T extends Record<string, unknown>>(
  token: string
): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch {
    return null;
  }
}

export function decodeToken<T extends Record<string, unknown>>(
  token: string
): T | null {
  try {
    return jwt.decode(token) as T;
  } catch {
    return null;
  }
}

export function generateApiKey(): {
  key: string;
  hashedKey: string;
  prefix: string;
} {
  const rawKey = nanoid(48);
  const key = `${API_KEY_PREFIX}${rawKey}`;
  const hashedKey = crypto.createHash("sha256").update(key).digest("hex");
  return { key, hashedKey, prefix: key.substring(0, 12) + "..." };
}

export function verifyApiKey(
  providedKey: string,
  storedHash: string
): boolean {
  const hashedKey = crypto.createHash("sha256").update(providedKey).digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(hashedKey, "hex"),
    Buffer.from(storedHash, "hex")
  );
}

export function generateTokenPair(userId: string, email: string): {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
  refreshTokenExpires: number;
} {
  const accessToken = generateToken({ sub: userId, email, type: "access" });
  const refreshToken = generateRefreshToken({ sub: userId, email, type: "refresh" });

  const accessDecoded = decodeToken<{ exp?: number }>(accessToken);
  const refreshDecoded = decodeToken<{ exp?: number }>(refreshToken);

  return {
    accessToken,
    refreshToken,
    accessTokenExpires: accessDecoded?.exp ? accessDecoded.exp * 1000 : Date.now() + 7 * 24 * 60 * 60 * 1000,
    refreshTokenExpires: refreshDecoded?.exp ? refreshDecoded.exp * 1000 : Date.now() + 30 * 24 * 60 * 60 * 1000,
  };
}

export function generateSessionId(): string {
  return nanoid(32);
}

export function hashData(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function encrypt(text: string, secret: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash("sha256").update(secret).digest();
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText: string, secret: string): string {
  const [ivHex, encrypted] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const key = crypto.createHash("sha256").update(secret).digest();
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export function generateOtpSecret(): string {
  return crypto.randomBytes(20).toString("hex");
}

export function createHmacSignature(
  data: string,
  secret: string
): string {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

export function verifyHmacSignature(
  data: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = createHmacSignature(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}

export function generateWebhookSignature(
  payload: string,
  secret: string
): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = createHmacSignature(signedPayload, secret);
  return `t=${timestamp},v1=${signature}`;
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  tolerance: number = 300
): boolean {
  const parts = signature.split(",").reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split("=");
    acc[key] = value;
    return acc;
  }, {});

  const timestamp = parseInt(parts.t, 10);
  const v1 = parts.v1;

  if (!timestamp || !v1) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > tolerance) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = createHmacSignature(signedPayload, secret);

  return crypto.timingSafeEqual(
    Buffer.from(v1, "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateStateParameter(): string {
  return nanoid(32);
}
