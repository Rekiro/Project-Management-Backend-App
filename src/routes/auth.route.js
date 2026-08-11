import {Router} from "express";
import {registerUser} from "../controllers/auth.controller.js"
import { validate } from "../middleware/validator.middleware.js";
import {userRegisterValidator} from "../validators/index.js";

const router = Router();

// router.route("/register").post(userRegisterValidator(), validate, registerUser);
router.route("/register").post(userRegisterValidator());
router.route("/register").post(validate);
router.route("/register").post(registerUser);

export default router;