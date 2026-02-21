export class AppError extends Error {
    
    statusCode: number
    isOperational: boolean

    constructor(message: string, statusCode = 500) {
        super(message)
        this.statusCode = statusCode
        this.isOperational = true

        Error.captureStackTrace(this, this.constructor)
    }

}

export class ForbiddenError extends AppError {
    constructor(message: string = "Forbidden") {
        super(message, 403)
    }
}

export class ValidationError extends AppError {
    constructor(message: string = "Validation Error") {
        super(message, 400)
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = "Not Found") {
        super(message, 404)
    }
}

export class AuthError extends AppError {
    constructor(message: string = "Authentication Error") {
        super(message, 401)
    }   
}

export class InternalServerError extends AppError {
    constructor(message: string = "Internal Server Error") {
        super(message, 500)
    }   
}

export class ConflictError extends AppError {
    constructor(message: string = "Resource already exists") {
        super(message, 409)
    }
}

export class BadRequestError extends AppError {
    constructor(message: string = "Bad Request") {
        super(message, 400)
    }   
}