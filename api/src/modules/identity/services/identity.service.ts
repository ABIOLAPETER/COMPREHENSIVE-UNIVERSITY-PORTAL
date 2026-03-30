import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { AuthError, BadRequestError, ConflictError, NotFoundError, ValidationError } from "../../../shared/errors/AppError";
import { env } from "../../../config/env";
import mongoose from "mongoose";
import { UserModel, Role } from "../models/identity.models";
import { CounterService } from "../../student/services/counter.service";
import { generateMatricNumber } from "../../../shared/utils/generateMatricNumber";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "../../../shared/utils/token";
import { User } from "../models/identity.models";
import { RefreshToken } from "../models/refresh-token.model";
import Student from "../../student/models/student.model";
import { accountActivationDto, AuthResponse, LoginDto, RefreshTokenDto, SignupDto } from "../dtos/identity.dto";
import { validateAccountActivation } from "../../../shared/utils/validate";
import { DatabaseSync } from "node:sqlite";
import { AdmissionModel, EntryType } from "../../Admission/models/admission.models";
import { FacultyModel } from "../../faculty/models/faculty.model";
import { DepartmentModel } from "../../department/models/department.model";

export class AuthService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly REFRESH_TOKEN_TTL = env.REFRESH_TOKEN_TTL;

  private static async issueTokens(params: {
    userId: string;
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
  private static async cleanupRevokedTokens(userId: string) {
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

  static async studentAccountActivation(data: accountActivationDto): Promise<AuthResponse> {
    const { jambRegNo, email, password } = data;

    if (!jambRegNo || !email || !password) {
      throw new ValidationError("Missing required fields");
    }

    validateAccountActivation(data);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

      const admittedStudent = await AdmissionModel.findOne({
        jambRegNo,
      }).session(session);

      if (!admittedStudent) {
        throw new NotFoundError("No admission record found");
      }

      if (admittedStudent.isActivated) {
        throw new ConflictError("Account already activated");
      }

      const existingUser = await UserModel.findOne({ email }).session(session);
      if (existingUser) {
        throw new ConflictError("Email is already registered");
      }


      const department = await DepartmentModel
        .findOne({ name: admittedStudent.department })
        .select("code")
        .session(session);

      if (!department) throw new NotFoundError("Department not found");

      const faculty = await FacultyModel
        .findOne({ name: admittedStudent.faculty })
        .select("code")
        .session(session);

      if (!faculty) throw new NotFoundError("Faculty not found");

      const sequence = await CounterService.generateSequence(
        new Date().getFullYear(),
        session
      );

      const matricNumber = generateMatricNumber(
        faculty.code,
        department.code,
        new Date().getFullYear(),
        sequence
      );

      const level = admittedStudent.entryType === EntryType.DE ? 200 : 100;
      const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

      const [user] = await UserModel.create([{
        email,
        lastName: admittedStudent.lastName,
        firstName: admittedStudent.firstName,
        passwordHash,
        isEmailVerified: false,
        role: Role.STUDENT,
      }], { session });

      await Student.create([{
        lastName: admittedStudent.lastName,
        firstName: admittedStudent.firstName,
        department: department._id,
        faculty: faculty._id,
        user: user._id,
        matricNumber,
        level,
        admissionType: admittedStudent.entryType
      }], { session });

      admittedStudent.isActivated = true;
      // admittedStudent.activatedAt = new Date();
      await admittedStudent.save({ session });

      await session.commitTransaction();
      const tokens = await this.issueTokens({
        userId: user._id.toString(),
        role: user.role,
      });


      return {
        id: user._id,
        email: user.email,
        role: user.role,
        tokens,
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async changePassword(
  oldPassword: string,
  newPassword: string,
  userId: string
): Promise<string> {

  if(!userId || !oldPassword || !newPassword){
    throw new BadRequestError("Missing required fields")
  }
  const user = await UserModel.findById(userId);
  if (!user) throw new NotFoundError("User not found");

  const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isPasswordValid) throw new AuthError("Current password is incorrect");

  const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

  await UserModel.findByIdAndUpdate(userId, { passwordHash });

  // Revoke all refresh tokens — force re-login on all devices
  await RefreshToken.updateMany(
    { userId, revoked: false },
    { $set: { revoked: true } }
  );

  return "Password changed successfully";
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

    await this.cleanupRevokedTokens(user._id.toString());

    const tokens = await this.issueTokens({ userId: user._id.toString(), role: user.role });

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

    const newtokens = await this.issueTokens({ userId: user._id.toString(), role: user.role });
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
    await this.cleanupRevokedTokens(user._id.toString());

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
  static async logoutAll(userId: string): Promise<{ message: string }> {
  await RefreshToken.updateMany(
    { userId, revoked: false },
    { $set: { revoked: true } }
  );

  return { message: "Logged out from all devices successfully" };
}

  static async getUsers(): Promise<User[]> {
    const users = await UserModel.find().select("email role firstName lastName");
    return users;
  }

}