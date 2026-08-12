import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
    sendEmail,
    emailVerificationMailgenContent,
    forgotPasswordMailgenContent,
} from "../utils/mail.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating Access Token",
        );
    }
};

const registerUser = asyncHandler(async (req, resp) => {
    const { username, email, password, fullName, role } = req.body;

    const existingUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existingUser) {
        throw new ApiError(
            409,
            "A user already exists with the same username or email",
        );
    }

    const user = await User.create({
        email,
        password,
        username,
        fullName,
        isEmailVerified: false,
    });

    const { unhashedToken, hashedToken, tokenExpiry } =
        user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;

    await user.save({ validateBeforeSave: false });

    await sendEmail({
        email: user?.email,
        subject: `Email verification mail for user: ${user.username}`,
        mailgenContent: emailVerificationMailgenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${unhashedToken}`,
        ),
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
    );

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user. Please contact support.",
        );
    }

    return resp
        .status(201)
        .json(
            new ApiResponse(
                201,
                createdUser,
                "User registered successfuly and email verification mail has been sent to your registered email Id.",
            ),
        );
});

const login = asyncHandler(async (req, resp) => {
    const { username, email, password } = req.body;

    if (!username && !email)
        throw new ApiError(400, "Username or email is required for login.");

    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user)
        throw new ApiError(
            400,
            "No user exists for the given username or email.",
        );

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid)
        throw new ApiError(400, "Input password is incorrect.");

    const { accessToken, refreshToken } =
        await generateAccessTokenAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return resp
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged in successfully",
            ),
        );
});

const logout = asyncHandler(async (req, resp) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: null,
            },
        },
        {
            new: true,
        },
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return resp
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, undefined, "User logged out successfully"));
});

const getCurrentUser = asyncHandler(async (req, resp) => {
    return resp
        .status(200)
        .json(
            new ApiResponse(200, req.user, "Current user fetched successfully"),
        );
});

const verifyEmail = asyncHandler(async (req, resp) => {
    const { verificationToken } = req.params;

    if (!verificationToken)
        throw new ApiError(400, "Email verification token is missing");

    const hashedToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: { $gt: Date.now() },
    });

    if (!user) throw new ApiError(400, "Token is invalid or expired");

    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;

    user.isEmailVerified = true;

    await user.save({ validateBeforeSave: false });

    return resp.status(200).json(
        new ApiResponse(
            200,
            {
                isEmailVerified: true,
            },
            "User's email has been verified successfully",
        ),
    );
});

const resendEmailVerification = asyncHandler(async (req, resp) => {
    const user = await User.findById(req.user?._id);

    if (!user) throw new ApiError(404, "User does not exist");
    if (user.isEmailVerified)
        throw new ApiError(409, "User's email is already verified");

    const { unhashedToken, hashedToken, tokenExpiry } =
        await user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;

    await user.save({ validateBeforeSave: false });

    await sendEmail({
        email: user?.email,
        subject: `Email verification mail for user: ${user.username}`,
        mailgenContent: emailVerificationMailgenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${unhashedToken}`,
        ),
    });

    return resp
        .status(200)
        .json(
            new ApiResponse(
                200,
                undefined,
                "Email has been resent to user's email Id",
            ),
        );
});

const refreshAccessToken = asyncHandler(async (req, resp) => {
    const incomingRefreshToken =
        req.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken)
        throw new ApiError(
            401,
            "Unauthorized request. Refresh token is missing.",
        );

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        );

        const user = await User.findById(decodedToken?._id);

        if (!user)
            throw new ApiError(401, "Refresh token is invalid or expired");
        if (incomingRefreshToken !== user?.refreshToken)
            throw new ApiError(401, "Refresh token is expired");

        const { accessToken, refreshToken: newRefreshToken } =
            await generateAccessTokenAndRefreshToken(user._id);

        user.refreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });

        const options = {
            httpOnly: true,
            secure: true,
        };

        return resp
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken,
                    },
                    "Access token has been refreshed successfully",
                ),
            );
    } catch (error) {
        throw new ApiError(401, "Refresh token is invalid or expired");
    }
});

const forgotPasswordRequest = asyncHandler(async (req, resp) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user)
        throw new ApiError(404, `There is no account for the email: ${email}`);

    const { hashedToken, unhashedToken, tokenExpiry } =
        await user.generateTemporaryToken();

    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExpiry = tokenExpiry;

    user.save({ validateBeforeSave: false });

    await sendEmail({
        email: user?.email,
        subject: `Forgot Password mail for user: ${user.username}`,
        mailgenContent: forgotPasswordMailgenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/auth/reset-password/${unhashedToken}`,
        ),
    });

    return resp
        .status(200)
        .json(
            new ApiResponse(
                200,
                undefined,
                "An email to reset your password has been sent to your email Id.",
            ),
        );
});

const resetForgotPassword = asyncHandler(async (req, resp) => {
    const { resetToken } = req.params;
    const { newPassword, confirmPassword } = req.body;

    const hashedResetToken = await crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    const user = await User.findOne({
        forgotPasswordToken: hashedResetToken,
        forgotPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) throw new ApiError(489, "Token is invalid or expired");

    if (newPassword !== confirmPassword)
        throw new ApiError(400, "Passwords do not match");

    user.password = newPassword;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    await user.save({ validateBeforeSave: false });

    return resp
        .status(200)
        .json(
            new ApiResponse(
                200,
                undefined,
                "Your password has been updated. Please login again.",
            ),
        );
});

const changeCurrentPassword = asyncHandler(async (req, resp) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    const user = await User.findById(req.user._id);

    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordValid)
        throw new ApiError(
            401,
            "Incorrect password. You must enter your old password to update your password.",
        );

    if (newPassword !== confirmPassword)
        throw new ApiError(400, "Passwords don't match. Please try again.");

    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    return resp
        .status(200)
        .json(
            new ApiResponse(
                200,
                undefined,
                "Password has been udpated successfully",
            ),
        );
});

export {
    registerUser,
    login,
    logout,
    getCurrentUser,
    verifyEmail,
    resendEmailVerification,
    refreshAccessToken,
    forgotPasswordRequest,
    resetForgotPassword,
    changeCurrentPassword,
};
