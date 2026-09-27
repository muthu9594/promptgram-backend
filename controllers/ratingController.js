const ratingService = require("../services/ratingService");

/**
 * POST /ratings
 * Body: { uid, promptId, stars, comment }
 * Submit or update a rating (upsert — one rating per user per prompt).
 * Recalculates the prompt's avgRating/ratingCount.
 */
const submitRating = async (req, res) => {
    try {
        const { uid, promptId, stars, comment } = req.body;
        const result = await ratingService.submitRating(uid, promptId, stars, comment);

        res.status(200).json({
            success: true,
            message: result.isNewRating ? "Rating submitted successfully" : "Rating updated successfully",
            result
        });
    } catch (error) {
        console.error("Submit rating error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to submit rating",
            error: error.message
        });
    }
};

/**
 * DELETE /ratings
 * Body: { uid, promptId }
 * (Using body instead of :id since this is a composite key, same pattern as favorites)
 */
const deleteRating = async (req, res) => {
    try {
        const { uid, promptId } = req.body;
        const result = await ratingService.deleteRating(uid, promptId);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Rating not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Rating deleted successfully",
            result
        });
    } catch (error) {
        console.error("Delete rating error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete rating",
            error: error.message
        });
    }
};

/**
 * GET /ratings/user/:uid/prompt/:promptId
 * Get a specific user's rating for a specific prompt.
 */
const getRatingByUser = async (req, res) => {
    try {
        const { uid, promptId } = req.params;
        const result = await ratingService.getRatingByUser(uid, promptId);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Rating not found"
            });
        }

        res.status(200).json({
            success: true,
            result
        });
    } catch (error) {
        console.error("Get rating by user error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch rating",
            error: error.message
        });
    }
};

/**
 * GET /ratings/prompt/:promptId
 * Get all ratings for a given prompt.
 */
const getRatingsByPrompt = async (req, res) => {
    try {
        const { promptId } = req.params;
        const result = await ratingService.getRatingsByPrompt(promptId);

        res.status(200).json({
            success: true,
            result
        });
    } catch (error) {
        console.error("Get ratings by prompt error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch prompt's ratings",
            error: error.message
        });
    }
};

/**
 * GET /ratings/user/:uid
 * Get all ratings a given user has submitted.
 */
const getRatingsByUser = async (req, res) => {
    try {
        const { uid } = req.params;
        const result = await ratingService.getRatingsByUser(uid);

        res.status(200).json({
            success: true,
            result
        });
    } catch (error) {
        console.error("Get ratings by user error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch user's ratings",
            error: error.message
        });
    }
};

module.exports = {
    submitRating,
    deleteRating,
    getRatingByUser,
    getRatingsByPrompt,
    getRatingsByUser
};