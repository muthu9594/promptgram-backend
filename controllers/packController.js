const packService = require("../services/packService");

/**
 * POST /packs
 * Create or update a pack (upsert). Cover image is required.
 */
const createPack = async (req, res) => {
    try {
        const result = await packService.createPack(req.body, req.file);

        res.status(200).json({
            success: true,
            message: "Pack created/updated successfully",
            result
        });
    } catch (error) {
        console.error("Create pack error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create/update pack",
            error: error.message
        });
    }
};

/**
 * PATCH /packs/:id
 * Update an existing pack. Cover image is optional.
 */
const updatePack = async (req, res) => {
    try {
        const { id } = req.body;
        const result = await packService.updatePack(id, req.body, req.file);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Pack not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Pack updated successfully",
            result
        });
    } catch (error) {
        console.error("Update pack error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update pack",
            error: error.message
        });
    }
};

/**
 * GET /packs
 * Get all packs.
 */
const getAllPacks = async (req, res) => {
    try {
        const result = await packService.getAllPacks();

        res.status(200).json({
            success: true,
            result
        });
    } catch (error) {
        console.error("Get all packs error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch packs",
            error: error.message
        });
    }
};

/**
 * GET /packs/featured
 * Get only featured packs.
 */
const getFeaturedPacks = async (req, res) => {
    try {
        const result = await packService.getFeaturedPacks();

        res.status(200).json({
            success: true,
            result
        });
    } catch (error) {
        console.error("Get featured packs error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch featured packs",
            error: error.message
        });
    }
};

/**
 * GET /packs/:id
 * Get a single pack by its _id.
 */
const getPackById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await packService.getPackById(id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Pack not found"
            });
        }

        res.status(200).json({
            success: true,
            result
        });
    } catch (error) {
        console.error("Get pack by id error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch pack",
            error: error.message
        });
    }
};

/**
 * DELETE /packs/:id
 * Delete a pack and its cover image from Cloudinary.
 */
const deletePack = async (req, res) => {
    try {
        const { id } = req.body;
        const result = await packService.deletePack(id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Pack not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Pack deleted successfully",
            result
        });
    } catch (error) {
        console.error("Delete pack error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete pack",
            error: error.message
        });
    }
};

/**
 * PATCH /packs/:id/toggle-featured
 * Flip a pack's isFeatured status.
 */
const toggleFeatured = async (req, res) => {
    try {
        const { id } = req.body;
        const result = await packService.toggleFeatured(id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Pack not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Pack featured status toggled successfully",
            result
        });
    } catch (error) {
        console.error("Toggle featured error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to toggle featured status",
            error: error.message
        });
    }
};

/**
 * PATCH /packs/:id/prompts/add
 * Body: { promptId }
 * Adds a promptId to the pack's promptIds array (no duplicates).
 */
const addPromptToPack = async (req, res) => {
    try {
        const { id } = req.body;
        const { promptId } = req.body;

        const result = await packService.addPromptToPack(id, promptId);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Pack not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Prompt added to pack successfully",
            result
        });
    } catch (error) {
        console.error("Add prompt to pack error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to add prompt to pack",
            error: error.message
        });
    }
};

/**
 * PATCH /packs/:id/prompts/remove
 * Body: { promptId }
 * Removes a promptId from the pack's promptIds array.
 */
const removePromptFromPack = async (req, res) => {
    try {
        const { id } = req.body;
        const { promptId } = req.body;

        const result = await packService.removePromptFromPack(id, promptId);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Pack not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Prompt removed from pack successfully",
            result
        });
    } catch (error) {
        console.error("Remove prompt from pack error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to remove prompt from pack",
            error: error.message
        });
    }
};

module.exports = {
    createPack,
    updatePack,
    getAllPacks,
    getFeaturedPacks,
    getPackById,
    deletePack,
    toggleFeatured,
    addPromptToPack,
    removePromptFromPack
};