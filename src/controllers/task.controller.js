import { User } from "../models/user.model.js";
import { Project } from "../models/project.model.js";
import { Task } from "../models/task.model.js";
import { SubTask } from "../models/subtask.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import mongoose from "mongoose";
import { TaskStatusEnum } from "../utils/constants.js";

const getTasks = asyncHandler(async (req, resp) => {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, "Project not found");

    const tasks = await Task.find({
        project: new mongoose.Types.ObjectId(projectId),
    }).populate("assignedTo", "avatar username fullName email");

    return resp
        .status(200)
        .json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
});

const getTaskById = asyncHandler(async (req, resp) => {
    const { taskId } = req.params;

    const tasks = await Task.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(taskId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "assignedTo",
                foreignField: "_id",
                as: "assignedTo",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            fullName: 1,
                            email: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        {
            $lookup: {
                from: "subtasks",
                localField: "_id",
                foreignField: "task",
                as: "subTasks",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "createdBy",
                            foreignField: "_id",
                            as: "createdBy",
                            pipeline: [
                                {
                                    $project: {
                                        _id: 1,
                                        username: 1,
                                        fullName: 1,
                                        email: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            createdBy: {
                                $arrayElemAt: ["$createdBy", 0],
                            },
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                assignedTo: {
                    $arrayElemAt: ["$assignedTo", 0],
                },
            },
        },
    ]);

    if (!tasks || tasks.length === 0) throw new ApiError(404, "Task not found");

    return resp
        .status(200)
        .json(new ApiResponse(200, tasks[0], "Task fetched successfully"));
});

const createTask = asyncHandler(async (req, resp) => {
    const { title, description, assignedTo, status } = req.body;
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) throw new ApiError(404, "Project not found!");

    const existingTask = await Task.findOne({ project: projectId, title });
    if (existingTask) throw new ApiError(409, "A task with this title already exists in this project");

    const files = req.files || [];

    const attachments = files.map((file) => {
        return {
            url: `${process.env.SERVER_URL}/images/${file.filename}`,
            mimetype: file.mimetype,
            size: file.size,
        };
    });

    const task = await Task.create({
        title,
        description,
        project: new mongoose.Types.ObjectId(projectId),
        assignedTo: assignedTo
            ? new mongoose.Types.ObjectId(assignedTo)
            : undefined,
        status: status || TaskStatusEnum.TODO,
        assignedBy: new mongoose.Types.ObjectId(req.user._id),
        attachments,
    });

    return resp
        .status(201)
        .json(new ApiResponse(201, task, "Task created successfully"));
});

const updateTask = asyncHandler(async (req, resp) => {
    //test
});

const deleteTask = asyncHandler(async (req, resp) => {
    //test
});

const createSubTask = asyncHandler(async (req, resp) => {
    //test
});

const updateSubTask = asyncHandler(async (req, resp) => {
    //test
});

const deleteSubTask = asyncHandler(async (req, resp) => {
    //test
});

export {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    createSubTask,
    updateSubTask,
    deleteSubTask,
};
