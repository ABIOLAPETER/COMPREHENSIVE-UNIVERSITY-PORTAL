import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { AuthError, BadRequestError, ConflictError } from "../../../shared/errors/AppError";
import { env } from "../../../config/env";
import mongoose from "mongoose";
import { UserModel, Role } from "../models/identity.models";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "../../../shared/utils/token";
import { User } from "../models/identity.models";
import { RefreshToken } from "../models/refresh-token.model";
import Student from "../../student/models/student.model";
import { AuthResponse, LoginDto, RefreshTokenDto, SignupDto } from "../dtos/identity.dto";

export class AuthService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly REFRESH_TOKEN_TTL = env.REFRESH_TOKEN_TTL;

  private static async issueTokens(params: {
    userId: Types.ObjectId;
    role: Role;
    deviceInfo?: { ip?: string; userAgent?: string };

  }) {
    const { userId, role, deviceInfo } = params;

    const accessToken = generateAccessToken({ userId: userId.toString(), role });
    const refreshToken = generateRefreshToken();
    const hashedRefreshToken = hashToken(refreshToken);

    await RefreshToken.create({
      userId,
      token: hashedRefreshToken,
      expiresAt: new Date(Date.now() + this.REFRESH_TOKEN_TTL),
      deviceInfo
    });

    return { accessToken, refreshToken };
  }

  // ── PRIVATE: keep only the most recent revoked token per user for audit ────
  private static async cleanupRevokedTokens(userId: Types.ObjectId) {
    const lastRevoked = await RefreshToken.findOne({ userId, revoked: true })
      .sort({ updatedAt: -1 })
      .select("_id");

    if (!lastRevoked) return;

    await RefreshToken.deleteMany({
      userId,
      revoked: true,
      _id: { $ne: lastRevoked._id },
    });
  }


  // HEALTH CHECK

  static healthCheck(): string {
    return "The comprehensive university portal is working"
  }

  static async signup(data: SignupDto): Promise<AuthResponse> {
    const { email, password, lastName, firstName } = data;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      throw new ConflictError("Email is already registered");
    }

    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
      const [user] = await UserModel.create([{
        email,
        lastName,
        firstName,
        passwordHash,
        isEmailVerified: false,
        role: Role.STUDENT,
      }], { session });

      const [newStudent] = await Student.create([{
        lastName,
        firstName,
        user: user._id,
      }], { session });

      if (!newStudent) {
        throw new BadRequestError("Could not create student");
      }
      await session.commitTransaction()
      const tokens = await this.issueTokens({ userId: user._id, role: user.role });
      return {
        id: user._id,
        email: user.email,
        role: user.role,
        tokens,
      };
    } catch (error) {
      await session.abortTransaction()
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async login(data: LoginDto): Promise<AuthResponse> {
    const { email, password } = data;

    const user = await UserModel.findOne({ email }).select("+passwordHash");
    if (!user) {
      throw new AuthError("Invalid email or password");
    }

    if (!user.role) {
      throw new AuthError("User has no assigned role");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthError("Invalid email or password");
    }

    await RefreshToken.updateMany(
      { userId: user._id, revoked: false },
      { $set: { revoked: true } }
    );

    await this.cleanupRevokedTokens(user._id);

    const tokens = await this.issueTokens({ userId: user._id, role: user.role });

    return {
      id: user._id,
      email: user.email,
      role: user.role,
      tokens,
    }
  }

  static async refreshTokens(data: RefreshTokenDto) {
    const { refreshToken } = data;

    const hashedToken = hashToken(refreshToken);

    const storedToken = await RefreshToken.findOne({
      token: hashedToken,
      revoked: false,
    });

    if (!storedToken) {
      throw new AuthError("Refresh token not found or already revoked");
    }

    if (storedToken.expiresAt < new Date()) {
      throw new AuthError("Refresh token expired");
    }

    const user = await UserModel.findById(storedToken.userId);
    if (!user) {
      throw new AuthError("User not found");
    }

    if (!user.role) {
      throw new AuthError("User has no assigned role");
    }

    const newtokens = await this.issueTokens({ userId: user._id, role: user.role });
    const newHashedToken = await hashToken(newtokens.refreshToken)
    await RefreshToken.updateOne(
      { _id: storedToken._id },
      {
        $set: {
          revoked: true,
          replacedByToken: newHashedToken // hash of the new token
        }
      }
    );
    await this.cleanupRevokedTokens(user._id);

    return newtokens
  }

  static async logout(refreshToken: string): Promise<{ message: string }> {
    const hashedToken = hashToken(refreshToken);

    if (!hashedToken || hashedToken.length === 0) {
      throw new AuthError("Invalid refresh token");
    }

    const storedToken = await RefreshToken.findOne({
      token: hashedToken,
      revoked: false,
    });

    if (!storedToken) {
      throw new AuthError("Refresh token not found or already revoked");
    }

    storedToken.revoked = true;
    await storedToken.save();

    return { message: "Logged out successfully" };
  }

  static async getUsers(): Promise<User[]> {
    const users = await UserModel.find().select("email role firstName lastName");
    return users;
  }
}