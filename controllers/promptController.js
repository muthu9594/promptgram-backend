const promptService = require("../services/promptService");

/**
 * POST /prompts
 * Create a new prompt. Preview image is required.
 */
const createPrompt = async (req, res) => {
    try {
        const result = await promptService.createPrompt(req.body, req.file);

        res.status(200).json({
            success: true,
            message: "Prompt created successfully",
            result
        });
    } catch (error) {
        console.error("Create prompt error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create prompt",
            error: error.message
        });
    }
};

/**
 * PATCH /prompts/:id
 * Update an existing prompt. Preview image is optional.
 */
const updatePrompt = async (req, res) => {
    try {
        const { id } = req.body;
        const result = await promptService.updatePrompt(id, req.body, req.file);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Prompt not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Prompt updated successfully",
            result
        });
    } catch (error) {
        console.error("Update prompt error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update prompt",
            error: error.message
        });
    }
};

/**
 * GET /prompts?categoryId=&status=&tag=&authorUid=&search=&page=&limit=
 * Get all prompts with optional filters + pagination.
 */
const getAllPrompts = async (req, res) => {
    try {
        const { categoryId, status, tag, authorUid, search, page, limit } = req.query;

        const result = await promptService.getAllPrompts(
            { categoryId, status, tag, authorUid, search },
            { page, limit }
        );

        res.status(200).json({
            success: true,
            result
        });
    } catch (error) {
        console.error("Get all prompts error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch prompts",
            error: error.message
        });
    }
};

/**
 * GET /prompts/:id
 * Get a single prompt by its _id.
 */
const getPromptById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await promptService.getPromptById(id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Prompt not found"
            });
        }

        res.status(200).json({
            success: true,
            result
        });
    } catch (error) {
        console.error("Get prompt by id error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch prompt",
            error: error.message
        });
    }
};

/**
 * DELETE /prompts/:id
 * Delete a prompt and its preview image from Cloudinary.
 */
const deletePrompt = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await promptService.deletePrompt(id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Prompt not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Prompt deleted successfully",
            result
        });
    } catch (error) {
        console.error("Delete prompt error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete prompt",
            error: error.message
        });
    }
};

/**
 * PATCH /prompts/:id/view
 * Increment a prompt's viewCount by 1. Call this whenever a user opens a prompt's detail page.
 */
const incrementViewCount = async (req, res) => {
    try {
        const { id } = req.body;
        const result = await promptService.incrementViewCount(id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Prompt not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "View count incremented",
            result
        });
    } catch (error) {
        console.error("Increment view count error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to increment view count",
            error: error.message
        });
    }
};

/**
 * POST /prompts/:id/rate
 * Body: { rating }  (e.g. 1-5)
 * Adds a rating and recalculates avgRating/ratingCount.
 * NOTE: pair this with the ratings collection/service to prevent
 * the same user from rating a prompt more than once.
 */
const addRating = async (req, res) => {
    try {
        const { id } = req.body;
        const { rating } = req.body;

        if (rating === undefined || Number(rating) < 1 || Number(rating) > 5) {
            return res.status(400).json({
                success: false,
                message: "rating must be a number between 1 and 5"
            });
        }

        const result = await promptService.addRating(id, Number(rating));

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Prompt not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Rating added successfully",
            result
        });
    } catch (error) {
        console.error("Add rating error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to add rating",
            error: error.message
        });
    }
};

module.exports = {
    createPrompt,
    updatePrompt,
    getAllPrompts,
    getPromptById,
    deletePrompt,
    incrementViewCount,
    addRating
};