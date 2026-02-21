import app from "./app";
import { env } from "./config/env";
import { InternalServerError } from "./shared/errors/AppError";
import { connectDB } from "./config/Database";
import { logger } from "./shared/utils/logger";

const startServer = app.listen(env.PORT, () => {
    logger.info(`University Portal API is running on http://localhost:${env.PORT}`);
});

const bootstrap = async () => {
    try {
        // Connect to the database
        connectDB()
        startServer.on("listening", () => {
            logger.info(`Server is listening on port ${env.PORT}`);
        });
    } catch (error) {
        logger.error("Failed to start the application:", error);
        throw new InternalServerError("Application startup failed");
    }
};
bootstrap();


