import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
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

type UploadObjectParams = {
  key: string;
  body: Buffer | Uint8Array | Blob | string;
  contentType?: string;
};

export async function uploadObject(params: UploadObjectParams) {
  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    });

    await r2Client.send(command);

    return {
      key: params.key,
      url: getObjectUrl(params.key),
      contentType: params.contentType,
    };
  } catch (error) {
    throw new Error(sanitizeErrorMessage(error));
  }
}

export function getObjectUrl(key: string) {
  return `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${key}`;
}

export async function deleteObject(key: string) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
  } catch (error) {
    throw new Error(sanitizeErrorMessage(error));
  }
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
    return `business/${businessId}/branding/${assetType}/${filename}`;
  },
  billReceipt(businessId: string, billId: string, filename: string) {
    return `bills/${businessId}/${billId}/receipts/${filename}`;
  },
};
