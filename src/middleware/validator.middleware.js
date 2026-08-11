import { validationResult } from "express-validator";
import { ApiError } from "../utils/apiError.js";

export const validate = (req, resp, next) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) return next();

    const extractedErrors = [];
    errors.array().map((err) =>
        extractedErrors.push({
            [err.path]: err.msg,
        }),
    );
    throw new ApiError(422, "Input data is not valid", extractedErrors);
};
