import { Router } from "express";
import {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    createSubTask,
    updateSubTask,
    deleteSubTask
} from "../controllers/task.controller.js";
import {validate} from "../middleware/validator.middleware.js"
import {createTaskValidator} from "../validators/index.js"
import {verifyJWT, validateProjectPermission} from "../middleware/auth.middleware.js";
import { AvailableUserRoles, UserRolesEnum } from "../utils/constants.js";
import {upload} from  "../middleware/multer.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/project-tasks/:projectId").get(validateProjectPermission(AvailableUserRoles), getTasks);

router.route("/:taskId").get(getTaskById);

router.route("/project-tasks/:projectId").post(validateProjectPermission(AvailableUserRoles), upload.array("attachment", 10), createTaskValidator(), validate, createTask);

export default router;