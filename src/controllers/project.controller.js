import { User } from "../models/user.model.js";
import { Project } from "../models/project.model.js";
import { ProjectMember } from "../models/projectMember.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { Mongoose } from "mongoose";
import { UserRolesEnum } from "../utils/constants.js";

const getProjects = asyncHandler(async (req, resp) => {
    const projects = await ProjectMember.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(req.user._id),
            },
        },
        {
            $lookup: {
                from: "projects",
                localField: "project",
                foreignField: "_id",
                as: "projects",
                pipeline: [
                    {
                        $lookup: {
                            from: "projectmembers",
                            localField: "_id",
                            foreignField: "project",
                            as: "projectMembers",
                        },
                    },
                    {
                        $addFields: {
                            members: {
                                $size: "$projectMembers",
                            },
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$projects",
        },
        {
            $project: {
                project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    members: 1,
                    createdAt: 1,
                    createdBy: 1,
                },
                role: 1,
                _id: 0,
            },
        },
    ]);

    return resp
        .status(200)
        .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

const getProjectById = asyncHandler(async (req, resp) => {
    //test
});

const createProject = asyncHandler(async (req, reps) => {
    const { name, description } = req.body;

    const project = await Project.create({
        name: name,
        description: description,
        createdBy: new mongoose.Types.ObjectId(req.user._id),
    });

    await ProjectMember.create({
        user: new mongoose.Types.ObjectId(req.user._id),
        project: new mongoose.Types.ObjectId(project._id),
        role: UserRolesEnum.PROJECT_ADMIN,
    });

    return resp
        .status(201)
        .json(new ApiResponse(201, project, "Project created successfully"));
});

const updateProject = asyncHandler(async (req, resp) => {
    const { name, description } = req.body;
    const { projectId } = req.params;

    const project = await Project.findByIdAndUpdate(
        projectId,
        {
            name,
            description,
        },
        {
            returnDocument: after,
        },
    );

    if (!project) throw new ApiError(404, "Project not found!");

    return resp
        .status(200)
        .json(new ApiResponse(200, project, "Project updated successfully"));
});

const deleteProject = asyncHandler(async (req, resp) => {
    const { projectId } = req.params;

    const projectMember = await ProjectMember.findOne({
        project: projectId,
        user: req.user._id,
    });

    if (!projectMember)
        throw new ApiError(403, "You are not a member of this project");

    if (
        projectMember.role !== UserRolesEnum.ADMIN &&
        projectMember.role !== UserRolesEnum.PROJECT_ADMIN
    )
        throw new ApiError(
            403,
            "Only Admins and Project Admins can delete the project",
        );

    const project = await Project.findByIdAndDelete(projectId);

    if (!project) throw new ApiError(404, "Project not found!");
    return resp
        .status(200)
        .json(new ApiResponse(200, project, "Project deleted successfully"));
});

const addMemebersToProject = asyncHandler(async (req, resp) => {});

const deleteMember = asyncHandler(async (req, resp) => {});

const getProjectMembers = asyncHandler(async (req, resp) => {});

const updateMemberRole = asyncHandler(async (req, resp) => {});

export {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    addMemebersToProject,
    deleteMember,
    getProjectMembers,
    updateMemberRole,
};
