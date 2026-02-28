import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { AuthError,  ConflictError, NotFoundError} from "../../../shared/errors/AppError";
import { UserModel, Role } from "../models/identity.models";
import {
    generateAccessToken,
    generateRefreshToken,
    hashToken,
} from "../../../shared/utils/token";
import { RefreshToken } from "../models/refresh-token.model";
import Student from "../../student/models/student.model";


export class AuthService {
    private static readonly SALT_ROUNDS = 12;
    private static readonly REFRESH_TOKEN_TTL =
        7 * 24 * 60 * 60 * 1000; // 7 days

    private static async issueTokens(params: {
        userId: Types.ObjectId;
        role: Role;
    }) {
        const { userId, role } = params;

        const accessToken = generateAccessToken({
            userId: userId.toString(),
            role
        });

        const refreshToken = generateRefreshToken();
        const hashedRefreshToken = hashToken(refreshToken);

        await RefreshToken.create({
            userId,
            token: hashedRefreshToken,
            expiresAt: new Date(
                Date.now() + this.REFRESH_TOKEN_TTL
            ),
        });

        return {
            accessToken,
            refreshToken,
        };
    }


    private static async cleanupRevokedTokens(
        userId: Types.ObjectId,
    ) {
        const lastRevoked = await RefreshToken.findOne({
            userId,
            revoked: true,
        })
            .sort({ updatedAt: -1 })
            .select("_id");

        if (!lastRevoked) return;

        await RefreshToken.deleteMany({
            userId,
            revoked: true,
            _id: { $ne: lastRevoked._id },
        });
    }


    static async signup(data: {
        email: string;
        password: string;
        lastName: string;
        firstName: string;
    }) {
        const { email, password, lastName, firstName } = data;

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            throw new ConflictError("Email is already registered");
        }

        const passwordHash = await bcrypt.hash(
            password,
            this.SALT_ROUNDS
        );

        const user = await UserModel.create({
            email,
            lastName,
            firstName,
            passwordHash,
            isEmailVerified: false,
            role: Role.STUDENT,
        });
        
        const newStudent = await Student.create({
            lastName,
            firstName,
            user: user._id
        })

        return this.issueTokens({
            userId: user._id,
            role: user.role,
        });
    }


    static async login(data: {
        email: string;
        password: string;
    }) {
        const { email, password } = data;
        const user = await UserModel.findOne({ email }).select(
            "+passwordHash"
        );
        if (!user) {
            throw new AuthError("Invalid email or password");
        }
        if (!user.role) {
            throw new AuthError("User has no assigned role");
        }
        const isPasswordValid = await bcrypt.compare(
            password,
            user.passwordHash
        );
        if (!isPasswordValid) {
            throw new AuthError("Invalid email or password");
        }

        // 🔒 REVOKE ALL EXISTING REFRESH TOKENS
        await RefreshToken.updateMany(
            {
                userId: user._id,
                revoked: false,
            },
            {
                $set: { revoked: true },
            }
        );

        await this.cleanupRevokedTokens(user._id);

        const tokens = await this.issueTokens({
            userId: user._id,
            role: user.role,
        });

        return{
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                tokens,
            }
        }
    }


    static async refreshTokens(data: {
        refreshToken: string;
    }) {
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
        await RefreshToken.updateOne(
            { _id: storedToken._id },
            { $set: { revoked: true } }
        );
        return this.issueTokens({
            userId: user._id,
            role: user.role,
        });
    }

    static async logout(refreshToken: string) {
        const hashedToken  = hashToken(refreshToken);

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

    static async getUsers(){
        const users = await UserModel.find().populate("email", "role")
        if (users.length === 0){
            throw new NotFoundError("Users not found")
        }

        return users
    }
}
