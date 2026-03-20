import { Types } from "mongoose"
import { Role, User } from "../models/identity.models"

export type SignupDto = Pick<User, "email" | "lastName" | "firstName"> & { password: string}
export type LoginDto = {email: string, password: string}
export type RefreshTokenDto = {refreshToken: string}
export type AuthResponse = {
    id: Types.ObjectId;
    email: string;
    role: Role;
    tokens: {
        accessToken: string;
        refreshToken: string;
    }
}