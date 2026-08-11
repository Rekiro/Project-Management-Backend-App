class ApiError extends Error {
    constructor(
        statusCode,
        message = "Unknown error occurred. Contact Support!",
        errors = [],
        stack = "",
    ) {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.success = false;
        this.errors = errors;

        if (stack.length === 0) {
            Error.captureStackTrace(this, this.constructor);
        } else {
            this.stack = stack;
        }
    }
}

export { ApiError };
