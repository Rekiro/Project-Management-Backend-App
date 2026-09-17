import { User } from "../models/user.model.js";
import { Project } from "../models/project.model.js";
import { ProjectMember } from "../models/projectMember.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { UserRolesEnum, AvailableUserRoles } from "../utils/constants.js";

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
                as: "project",
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
            $unwind: "$project",
        },
        {
            $project: {
                _id: 0,
                role: 1,
                project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    members: 1,
                    createdAt: 1,
                    createdBy: 1
                }
            }
        }
    ]);

    return resp
        .status(200)
        .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

const getProjectById = asyncHandler(async (req, resp) => {
    const {projectId} = req.params;

    const project = await Project.findById(projectId);

    if (!project)
        throw new ApiError(404, `No project found for project Id: ${projectId}`);

    return resp.status(200).json(new ApiResponse(200, project, "Project fetched successfully"));
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
            returnDocument: "after",
        },
    );

    if (!project) throw new ApiError(404, "Project not found!");

    return resp
        .status(200)
        .json(new ApiResponse(200, project, "Project updated successfully"));
});

const deleteProject = asyncHandler(async (req, resp) => {
    const { projectId } = req.params;

    const project = await Project.findByIdAndDelete(projectId);

    if (!project) throw new ApiError(404, "Project not found!");
    return resp
        .status(200)
        .json(new ApiResponse(200, project, "Project deleted successfully"));
});

const addMemebersToProject = asyncHandler(async (req, resp) => {
    const {email, role} = req.body;
    const {projectId} = req.params;

    if (!AvailableUserRoles.includes(role))
        throw new ApiError (400, `User role ${role} is not a valid role`);

    const project = await Project.findById(projectId);
    if (!project)
        throw new ApiError(404, `Project does not exist for project Id: ${projectId}`);

    const user = await User.findOne({email});
    if (!user)
        throw new ApiError(404, `User does not exist for the given email`);

    const projectMember = await ProjectMember.create({
        user: new mongoose.Types.ObjectId(user._id),
        project: new mongoose.Types.ObjectId(projectId),
        role: role
    });

    return resp.status(201).json(new ApiResponse(201, projectMember, "Member added to the project successfully"));
});

const deleteMember = asyncHandler(async (req, resp) => {
    const {projectId, userId} = req.params;

    const projectMember = await ProjectMember.findOneAndDelete({
        user: new mongoose.Types.ObjectId(userId),
        project: new mongoose.Types.ObjectId(projectId)
    })

    if (!projectMember){ 
        throw new ApiError(404, "Project member not found");
    }

    return resp.status(200).json(new ApiResponse(200, projectMember, "Member deleted successfully"));

});

const getProjectMembers = asyncHandler(async (req, resp) => {
    const {projectId} = req.params;
    const project = await Project.findById(projectId);
    if (!project){
        throw new ApiError(404, "Project not found");
    }

    const projectMembers = await ProjectMember.aggregate([
        {
            $match: {
                project: new mongoose.Types.ObjectId(projectId)
            }
        }, 
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user",
                pipeline: [{
                    $project: {
                        _id: 1,
                        username: 1,
                        fullName: 1,
                        email: 1,
                        avatar: 1
                    }}
                ]
            }
        },
        {
            $addFields: {
                user: {
                    $arrayElemAt: ["$user", 0]
                }
            }
        },
        {
            $project: {
                project: 1,
                user: 1,
                role: 1,
                createdAt: 1,
                updatedAt: 1,
                _id: 0
            }
        }
    ]);

    return resp.status(200).json(new ApiResponse(200, projectMembers, "Project members fetched successfully"));
});

const updateMemberRole = asyncHandler(async (req, resp) => {
    const {newRole} = req.body;
    const {projectId, userId} = req.params;

    if (!AvailableUserRoles.includes(newRole))
        throw new ApiError (400, `User role ${newRole} is not a valid role`);

    let projectMember = await ProjectMember.findOne({
        project: new mongoose.Types.ObjectId(projectId),
        user : new mongoose.Types.ObjectId(userId)
    })

    if (!projectMember)
        throw new ApiError(404, "Project member not found");

    projectMember = await ProjectMember.findByIdAndUpdate(
        projectMember._id,
        {
            role: newRole
        },
        {returnDocument: "after"}
    );
    
    if (!projectMember) {
        throw new ApiError(404, "Project member not found");
    }

    return resp 
        .status(200)
        .json(
            new ApiResponse(
                200, 
                projectMember,
                "Project member role updated successfully"
            )
        );
});

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
