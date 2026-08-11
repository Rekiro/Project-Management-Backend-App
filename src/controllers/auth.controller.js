import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendEmail, emailVerificationMailgenContent } from "../utils/mail.js";

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

export { registerUser };
