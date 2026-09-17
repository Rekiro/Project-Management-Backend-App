import { ProjectMember } from "../models/projectMember.model";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { UserRolesEnum } from "../utils/constants";
import mongoose from "mongoose";

export const verifyProjectAdmin = asyncHandler(async (req, resp, next) => {
    const projectId = req.body.projectId || req.params.projectId;

    const projectMember = await ProjectMember.findOne({
        user: new mongoose.Types.ObjectId(req.user._id),
        project: new mongoose.Types.ObjectId(projectId)
    });

    if (!projectMember)
        throw new ApiError(403, "You need to be a member of this project to perform this operation");

    if (projectMember.role !== UserRolesEnum.PROJECT_ADMIN && projectMember.role !== UserRolesEnum.ADMIN)
        throw new ApiError(403, "You need to be a project admin or admin to perform this operation");

    next();
});