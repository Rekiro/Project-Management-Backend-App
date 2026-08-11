import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// const healthCheck = async (req, resp) => {
//     try {
//         const user = await getUserFromDB();
//         resp.status(200).json(
//             new ApiResponse(200, null, "Server is up and running"),
//         );
//     } catch (error) {
//         next(error);
//     }
// };

const healthCheck = asyncHandler(async (req, resp, next) => {
    resp.status(200).json(
        new ApiResponse(200, null, "Server is up and running"),
    );
});

export { healthCheck };
