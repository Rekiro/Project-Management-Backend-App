import { Router } from "express";
import { login, registerUser } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validator.middleware.js";
import {
    userLoginValidator,
    userRegisterValidator,
} from "../validators/index.js";

const router = Router();

router.route("/register").post(userRegisterValidator(), validate, registerUser);
router.route("/login").post(userLoginValidator(), validate, login);

export default router;
