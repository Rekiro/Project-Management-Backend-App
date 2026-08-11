import { Router } from "express";
import {
    getCurrentUser,
    login,
    logout,
    registerUser,
} from "../controllers/auth.controller.js";
import { validate } from "../middleware/validator.middleware.js";
import {
    userLoginValidator,
    userRegisterValidator,
} from "../validators/index.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// unsecure routes
router.route("/register").post(userRegisterValidator(), validate, registerUser);
router.route("/login").post(userLoginValidator(), validate, login);

// secure routes
router.route("/logout").post(verifyJWT, logout);
router.route("/current-user").post(verifyJWT, getCurrentUser);

export default router;
