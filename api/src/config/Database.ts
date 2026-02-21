import mongoose from "mongoose";
import {env} from "../config/env"
import { logger } from "../shared/utils/logger";
import { InternalServerError } from "../shared/errors/AppError";

export const connectDB = async () => {
    try{
        await mongoose.connect(env.MONGO_URI)
        logger.info("Database connected successfully");

    }catch (error){
        console.error("Database connection failed:", error);
        throw new InternalServerError("Failed to connect to the database");
    }
}