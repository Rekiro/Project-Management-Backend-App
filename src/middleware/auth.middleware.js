import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import jwt from "jsonwebtoken";
import { ProjectMember } from "../models/projectMember.model.js";
import mongoose from "mongoose";

export const verifyJWT = asyncHandler(async (req, resp, next) => {
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!token) throw new ApiError(401, "Unauthorized request");

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
        );
        if (!user)
            throw new ApiError(401, "Access token is invalid or expired");
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, "Access token is invalid or expired");
    }
});

export const validateProjectPermission = (roles = []) => {
    return asyncHandler(async(req, resp, next) => {
        const projectId = req.params.projectId;
        
        if (!projectId)
            throw new ApiError(400, "projectId is missing");

        const projectMember = await ProjectMember.findOne({
            user: new mongoose.Types.ObjectId(req.user._id),
            project: new mongoose.Types.ObjectId(projectId)
        })

        if (!projectMember)
            throw new ApiError(400, "You are not a member of this project or the project doesn't exit");

        const assignedRole = projectMember?.role;
        req.user.role = assignedRole;
        
        if (!roles.includes(assignedRole))
            throw new ApiError(403, "You do not have permission to perform this operation");

        next();
    })
};