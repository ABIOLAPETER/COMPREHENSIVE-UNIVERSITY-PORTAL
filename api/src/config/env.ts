import dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(` Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  PORT: required("PORT"),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
  MONGO_URI: required("MONGO_URI"),
  JWT_SECRET: required("JWT_SECRET"),
  IDENTITY_SERVICE_URL: required("IDENTITY_SERVICE_URL"),
  // INTERNAL_SERVICE_SECRET: required("INTERNAL_SERVICE_SECRET"),
  CURRENT_SERVICE_NAME: required("CURRENT_SERVICE_NAME"),
  ADMIN_EMAIL: required("ADMIN_EMAIL"),
};
