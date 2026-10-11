import { Router } from "express";
import {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    addMemebersToProject,
    deleteMember,
    getProjectMembers,
    updateMemberRole,
} from "../controllers/project.controller.js";
import { validate } from "../middleware/validator.middleware.js";
import {
    createProjectValidator,
    addMemberToProjectValidator,
} from "../validators/index.js";
import {
    verifyJWT,
    validateProjectPermission,
} from "../middleware/auth.middleware.js";
import { AvailableUserRoles, UserRolesEnum } from "../utils/constants.js";

const router = Router();

router.use(verifyJWT);

router
    .route("/")
    .get(getProjects)
    .post(createProjectValidator(), validate, createProject);

router
    .route("/:projectId")
    .get(validateProjectPermission(AvailableUserRoles), getProjectById)
    .put(
        validateProjectPermission([
            UserRolesEnum.ADMIN,
            UserRolesEnum.PROJECT_ADMIN,
        ]),
        createProjectValidator(),
        validate,
        updateProject,
    )
    .delete(
        validateProjectPermission([
            UserRolesEnum.ADMIN,
            UserRolesEnum.PROJECT_ADMIN,
        ]),
        deleteProject,
    );

router
    .route("/:projectId/members")
    .get(getProjectMembers)
    .post(
        validateProjectPermission([
            UserRolesEnum.ADMIN,
            UserRolesEnum.PROJECT_ADMIN,
        ]),
        addMemberToProjectValidator(),
        validate,
        addMemebersToProject,
    );

router
    .route("/:projectId/members/:userId")
    .put(
        validateProjectPermission([
            UserRolesEnum.ADMIN,
            UserRolesEnum.PROJECT_ADMIN,
        ]),
        updateMemberRole,
    )
    .delete(
        validateProjectPermission([
            UserRolesEnum.ADMIN,
            UserRolesEnum.PROJECT_ADMIN,
        ]),
        deleteMember,
    );

export default router;
