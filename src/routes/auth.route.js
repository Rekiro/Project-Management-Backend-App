import { Router } from "express";
import {
    changeCurrentPassword,
    forgotPasswordRequest,
    getCurrentUser,
    login,
    logout,
    refreshAccessToken,
    registerUser,
    resendEmailVerification,
    resetForgotPassword,
    verifyEmail,
} from "../controllers/auth.controller.js";
import { validate } from "../middleware/validator.middleware.js";
import {
    changeCurrentPasswordValidator,
    forgotPasswordValidator,
    resetPasswordValidator,
    userLoginValidator,
    userRegisterValidator,
} from "../validators/index.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// unsecure routes
router.route("/register").post(userRegisterValidator(), validate, registerUser);
router.route("/login").post(userLoginValidator(), validate, login);
router.route("/verify-email/:verificationToken").get(verifyEmail);
router.route("/refresh-token").post(refreshAccessToken);
router
    .route("/forgot-password")
    .post(forgotPasswordValidator(), validate, forgotPasswordRequest);
router
    .route("/reset-password/:resetToken")
    .post(resetPasswordValidator(), validate, resetForgotPassword);

// secure routes
router.route("/logout").post(verifyJWT, logout);
router.route("/current-user").post(verifyJWT, getCurrentUser);
router
    .route("/resend-email-verification")
    .post(verifyJWT, resendEmailVerification);
router
    .route("/change-password")
    .post(
        verifyJWT,
        changeCurrentPasswordValidator(),
        validate,
        changeCurrentPassword,
    );

export default router;
