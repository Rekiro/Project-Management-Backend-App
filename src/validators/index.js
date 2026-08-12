import { body } from "express-validator";

const userRegisterValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is invalid"),
        body("username")
            .trim()
            .notEmpty()
            .withMessage("Username is required")
            .isLowercase()
            .withMessage("Username must be in lowercase")
            .isLength({ min: 3 })
            .withMessage("Username must be at least 3 characters long"),
        body("password").trim().notEmpty().withMessage("Password is required"),
        body("fullName").optional().trim(),
    ];
};

const userLoginValidator = () => {
    return [
        body("email")
            .trim()
            .optional()
            .isEmail()
            .withMessage("Email is invalid"),
        body("username").trim().optional(),
        body("password").trim().notEmpty().withMessage("Password is required"),
    ];
};

const forgotPasswordValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is invalid"),
    ];
};

const resetPasswordValidator = () => {
    return [
        body("newPassword")
            .trim()
            .notEmpty()
            .withMessage("New password is required"),
        body("confirmPassword")
            .trim()
            .notEmpty()
            .withMessage("Confirm password is requried"),
    ];
};

const changeCurrentPasswordValidator = () => {
    return [
        body("newPassword")
            .trim()
            .notEmpty()
            .withMessage("New password is requried"),
        body("confirmPassword")
            .trim()
            .notEmpty()
            .withMessage("Confirm password is requried"),
        body("oldPassword")
            .trim()
            .notEmpty()
            .withMessage("Current password is requried"),
    ];
};
export {
    userRegisterValidator,
    userLoginValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
    changeCurrentPasswordValidator,
};
