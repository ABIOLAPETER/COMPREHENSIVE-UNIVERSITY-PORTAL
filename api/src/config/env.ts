import dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  PORT: process.env.PORT || "2003",
  NODE_ENV: process.env.NODE_ENV ?? "development",
  REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
  MONGO_URI: required("MONGO_URI"),
  JWT_SECRET: required("JWT_SECRET"),
REFRESH_TOKEN_TTL: Number(process.env.REFRESH_TOKEN_TTL) || 7 * 24 * 60 * 60 * 1000,
  PAYSTACK_SECRET_KEY: required("PAYSTACK_SECRET_KEY"),
    PAYSTACK_WEBHOOK_SECRET: required("PAYSTACK_WEBHOOK_SECRET")
  
};