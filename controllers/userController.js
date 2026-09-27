const userService = require("../services/userService");

/**
 * POST /users
 * Body: { uid, displayName, email, photoUrl }
 * Create a user profile (typically right after signup/first login).
 */
const createUser = async (req, res) => {
    try {
        const { uid, ...userData } = req.body;
        const result = await userService.createUser(uid, userData);

        res.status(200).json({
            success: true,
            message: "User created successfully",
            result
        });
    } catch (error) {
        console.error("Create user error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create user",
            error: error.message
        });
    }
};

/**
 * PATCH /users/:uid
 * Update editable profile fields (displayName, email, photoUrl).
 */
const updateUser = async (req, res) => {
    try {
        const { uid } = req.body;
        const result = await userService.updateUser(uid, req.body);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            result
        });
    } catch (error) {
        console.error("Update user error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update user",
            error: error.message
        });
    }
};

/**
 * GET /users/:uid
 * Get a single user by uid.
 */
const getUserById = async (req, res) => {
    try {
        const { uid } = req.params;
        const result = await userService.getUserById(uid);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            result
        });
    } catch (error) {
        console.error("Get user by id error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch user",
            error: error.message
        });
    }
};

/**
 * GET /users?page=&limit=
 * Get all users with pagination (admin view).
 */
const getAllUsers = async (req, res) => {
    try {
        const { page, limit } = req.query;
        const result = await userService.getAllUsers({ page, limit });

        res.status(200).json({
            success: true,
            result
        });
    } catch (error) {
        console.error("Get all users error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch users",
            error: error.message
        });
    }
};

/**
 * DELETE /users/:uid
 * Delete a user profile (does not delete the underlying auth account).
 */
const deleteUser = async (req, res) => {
    try {
        const { uid } = req.body;
        const result = await userService.deleteUser(uid);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "User deleted successfully",
            result
        });
    } catch (error) {
        console.error("Delete user error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete user",
            error: error.message
        });
    }
};

/**
 * PATCH /users/:uid/credits
 * Body: { delta }  (e.g. -1 to spend a credit, +10 to add credits after purchase)
 */
const updateCredits = async (req, res) => {
    try {
        const { delta,uid } = req.body;

        if (delta === undefined || isNaN(Number(delta))) {
            return res.status(400).json({
                success: false,
                message: "delta must be a number"
            });
        }

        const result = await userService.updateCredits(uid, Number(delta));

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Credits updated successfully",
            result
        });
    } catch (error) {
        console.error("Update credits error:", error);

        const status = error.message === "Insufficient credits" ? 400 : 500;
        res.status(status).json({
            success: false,
            message: error.message === "Insufficient credits" ? "Insufficient credits" : "Failed to update credits",
            error: error.message
        });
    }
};

/**
 * PATCH /users/:uid/image-ai-usage
 * Increments today's AI image usage count (resets automatically on a new day).
 */
const trackImageAiUsage = async (req, res) => {
    try {
        const { uid } = req.body;
        const result = await userService.trackImageAiUsage(uid);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Usage tracked successfully",
            result
        });
    } catch (error) {
        console.error("Track image AI usage error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to track usage",
            error: error.message
        });
    }
};

/**
 * PATCH /users/:uid/flags
 * Body: { isPremium, isPro, isCreator }  (any subset)
 * Intended to be called from admin routes or payment webhooks, not directly by end users.
 */
const setUserFlags = async (req, res) => {
    try {
        const { isPremium, isPro, isCreator,uid } = req.body;

        const result = await userService.setUserFlags(uid, { isPremium, isPro, isCreator });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "User flags updated successfully",
            result
        });
    } catch (error) {
        console.error("Set user flags error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update user flags",
            error: error.message
        });
    }
};

module.exports = {
    createUser,
    updateUser,
    getUserById,
    getAllUsers,
    deleteUser,
    updateCredits,
    trackImageAiUsage,
    setUserFlags
};