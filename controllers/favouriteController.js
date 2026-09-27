const favoriteService = require("../services/favouriteService");

/**
 * POST /favorites
 * Body: { uid, promptId }
 * Adds a favorite (idempotent).
 */
const addFavorite = async (req, res) => {
    try {
        const { uid, promptId } = req.body;
        const result = await favoriteService.addFavorite(uid, promptId);

        res.status(200).json({
            success: true,
            message: "Favorite added successfully",
            result
        });
    } catch (error) {
        console.error("Add favorite error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to add favorite",
            error: error.message
        });
    }
};

/**
 * DELETE /favorites
 * Body: { uid, promptId }
 * (Using body instead of params here since this is a composite key, not a single :id)
 */
const removeFavorite = async (req, res) => {
    try {
        const { uid, promptId } = req.body;
        const result = await favoriteService.removeFavorite(uid, promptId);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Favorite not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Favorite removed successfully",
            result
        });
    } catch (error) {
        console.error("Remove favorite error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to remove favorite",
            error: error.message
        });
    }
};

/**
 * PATCH /favorites/toggle
 * Body: { uid, promptId }
 * Adds if not favorited, removes if already favorited.
 * Returns { favorited: true/false } for the frontend to update its UI state.
 */
const toggleFavorite = async (req, res) => {
    try {
        const { uid, promptId } = req.body;
        const result = await favoriteService.toggleFavorite(uid, promptId);

        res.status(200).json({
            success: true,
            message: "Favorite toggled successfully",
            result
        });
    } catch (error) {
        console.error("Toggle favorite error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to toggle favorite",
            error: error.message
        });
    }
};

/**
 * GET /favorites/check?uid=xxx&promptId=yyy
 * Returns whether a specific uid+promptId pair is favorited.
 */
const checkFavorite = async (req, res) => {
    try {
        const { uid, promptId } = req.body;
        const favorited = await favoriteService.isFavorited(uid, promptId);

        res.status(200).json({
            success: true,
            result: { favorited }
        });
    } catch (error) {
        console.error("Check favorite error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to check favorite",
            error: error.message
        });
    }
};

/**
 * GET /favorites/user/:uid
 * Get all favorites for a given user.
 */
const getFavoritesByUser = async (req, res) => {
    try {
        const { uid } = req.params;
        const result = await favoriteService.getFavoritesByUser(uid);

        res.status(200).json({
            success: true,
            result
        });
    } catch (error) {
        console.error("Get favorites by user error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch user's favorites",
            error: error.message
        });
    }
};

/**
 * GET /favorites/prompt/:promptId
 * Get all favorites for a given prompt (e.g. list of users who liked it).
 */
const getFavoritesByPrompt = async (req, res) => {
    try {
        const { promptId } = req.params;
        const result = await favoriteService.getFavoritesByPrompt(promptId);

        res.status(200).json({
            success: true,
            result
        });
    } catch (error) {
        console.error("Get favorites by prompt error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch prompt's favorites",
            error: error.message
        });
    }
};

/**
 * GET /favorites/prompt/:promptId/count
 * Get the favorite count for a given prompt.
 */
const countFavoritesByPrompt = async (req, res) => {
    try {
        const { promptId } = req.params;
        const count = await favoriteService.countFavoritesByPrompt(promptId);

        res.status(200).json({
            success: true,
            result: { promptId, count }
        });
    } catch (error) {
        console.error("Count favorites by prompt error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to count favorites",
            error: error.message
        });
    }
};

module.exports = {
    addFavorite,
    removeFavorite,
    toggleFavorite,
    checkFavorite,
    getFavoritesByUser,
    getFavoritesByPrompt,
    countFavoritesByPrompt
};