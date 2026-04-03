import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Readable } from "node:stream";
import { sanitizeErrorMessage } from "../utils/error-handler";

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

if (
  !R2_ENDPOINT ||
  !R2_ACCESS_KEY_ID ||
  !R2_SECRET_ACCESS_KEY ||
  !R2_BUCKET_NAME
) {
  throw new Error("R2 configuration is missing required environment variables");
}

const r2Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function getUploadSignedUrl(params: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}) {
  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: params.key,
      ContentType: params.contentType,
    });

    return await getSignedUrl(r2Client as any, command, {
      expiresIn: params.expiresInSeconds ?? 300,
    });
  } catch (error) {
    throw new Error(sanitizeErrorMessage(error));
  }
}

export async function getReadSignedUrl(key: string, expiresInSeconds = 300) {
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(r2Client as any, command, {
      expiresIn: expiresInSeconds,
    });
  } catch (error) {
    throw new Error(sanitizeErrorMessage(error));
  }
}

export async function getObjectFromR2(key: string) {
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    return await r2Client.send(command);
  } catch (error) {
    throw new Error(sanitizeErrorMessage(error));
  }
}

export async function readR2ObjectAsUint8Array(key: string) {
  const result = await getObjectFromR2(key);
  const body = result.Body;

  if (!body) {
    throw new Error("File not found");
  }

  const transformed = body as
    | { transformToByteArray?: () => Promise<Uint8Array> }
    | Readable;

  if ("transformToByteArray" in transformed) {
    const bytes = await transformed.transformToByteArray?.();
    if (bytes) return bytes;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of transformed as Readable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return new Uint8Array(Buffer.concat(chunks));
}

function safeFilename(filename: string) {
  const segments = filename.split(".");
  const ext = segments.length > 1 ? (segments.pop() ?? "") : "";
  const name = segments.join(".") || "file";
  const normalizedName = name
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  const normalizedExt = ext
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 10);
  const stamp = Date.now();
  return normalizedExt
    ? `${normalizedName}-${stamp}.${normalizedExt}`
    : `${normalizedName}-${stamp}`;
}

export const r2KeyBuilders = {
  avatar(userId: string, filename: string) {
    return `avatars/${userId}/${filename}`;
  },
  businessBranding(
    businessId: string,
    assetType: "logo" | "banner",
    filename: string,
  ) {
    return `business/${businessId}/branding/${assetType}/${safeFilename(filename)}`;
  },
  campaignAsset(
    businessId: string,
    campaignId: string,
    assetType: "logo" | "banner",
    filename: string,
  ) {
    return `business/${businessId}/campaigns/${campaignId}/${assetType}/${safeFilename(filename)}`;
  },
  billReceipt(businessId: string, billId: string, filename: string) {
    return `bills/${businessId}/${billId}/receipts/${filename}`;
  },
};

export function normalizeR2Key(src: string) {
  const trimmed = src.trim();
  if (!trimmed) return null;

  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return trimmed.replace(/^\/+/, "");
  }

  try {
    const parsed = new URL(trimmed);
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return parts.slice(1).join("/");
  } catch {
    return null;
  }
}
