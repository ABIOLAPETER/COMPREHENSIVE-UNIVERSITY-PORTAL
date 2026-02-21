import mongoose, { Schema, Types, Document } from "mongoose";

export interface RefreshTokenDocument extends Document {
  userId: Types.ObjectId;
  token: string; // hashed refresh token
  expiresAt: Date;
  revoked: boolean;
  replacedByToken?: string;
  deviceInfo?: {
    ip?: string;
    userAgent?: string;
  };
  createdAt: Date;
}

const RefreshTokenSchema = new Schema<RefreshTokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    token: {
      type: String,
      required: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    revoked: {
      type: Boolean,
      default: false,
      index: true,
    },

    replacedByToken: {
      type: String,
    },

    deviceInfo: {
      ip: String,
      userAgent: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

RefreshTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);


RefreshTokenSchema.index({ token: 1, revoked: 1 });
RefreshTokenSchema.index({ userId: 1, tenantId: 1 });

export const RefreshToken = mongoose.model<RefreshTokenDocument>(
  "RefreshToken",
  RefreshTokenSchema
);
