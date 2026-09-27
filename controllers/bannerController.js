const bannerService = require("../services/bannerService");

/**
 * POST /banners
 * Create or update a banner (upsert). Image file is required.
 */
const createBanner = async (req, res) => {
    try {
        const result = await bannerService.createBanner(req.body, req.file);

        res.status(200).json({
            success: true,
            message: "Banner created/updated successfully",
            result
        });
    } catch (error) {
        console.error("Create banner error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create/update banner",
            error: error.message
        });
    }
};

/**
 * PATCH /banners/:id
 * Update an existing banner. Image file is optional.
 */
const updateBanner = async (req, res) => {
    try {
        const { id } = req.body;
        const result = await bannerService.updateBanner(id, req.body, req.file);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Banner not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Banner updated successfully",
            result
        });
    } catch (error) {
        console.error("Update banner error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update banner",
            error: error.message
        });
    }
};

/**
 * GET /banners
 * Get all banners (admin view — includes inactive), sorted by sortOrder.
 */
const getAllBanners = async (req, res) => {
    try {
        const result = await bannerService.getAllBanners();

        res.status(200).json({
            success: true,
            result
        });
    } catch (error) {
        console.error("Get all banners error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch banners",
            error: error.message
        });
    }
};

/**
 * GET /banners/active
 * Get only active banners, sorted by sortOrder. Public/app-facing.
 */
const getActiveBanners = async (req, res) => {
    try {
        const result = await bannerService.getActiveBanners();

        res.status(200).json({
            success: true,
            result
        });
    } catch (error) {
        console.error("Get active banners error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch active banners",
            error: error.message
        });
    }
};

/**
 * GET /banners/:id
 * Get a single banner by its _id.
 */
const getBannerById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await bannerService.getBannerById(id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Banner not found"
            });
        }

        res.status(200).json({
            success: true,
            result
        });
    } catch (error) {
        console.error("Get banner by id error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch banner",
            error: error.message
        });
    }
};

/**
 * DELETE /banners/:id
 * Delete a banner and its associated Cloudinary image.
 */
const deleteBanner = async (req, res) => {
    try {
        const { id } = req.body;
        const result = await bannerService.deleteBanner(id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Banner not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Banner deleted successfully",
            result
        });
    } catch (error) {
        console.error("Delete banner error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete banner",
            error: error.message
        });
    }
};

/**
 * PATCH /banners/:id/toggle
 * Flip a banner's isActive status.
 */
const toggleBannerStatus = async (req, res) => {
    try {
        const { id } = req.body;
        const result = await bannerService.toggleBannerStatus(id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Banner not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Banner status toggled successfully",
            result
        });
    } catch (error) {
        console.error("Toggle banner status error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to toggle banner status",
            error: error.message
        });
    }
};

/**
 * PATCH /banners/reorder
 * Bulk-update sortOrder for multiple banners.
 * Body: [{ id: "banner_1", sortOrder: 1 }, { id: "banner_2", sortOrder: 2 }, ...]
 */
const reorderBanners = async (req, res) => {
    try {
        const orderList = req.body;

        if (!Array.isArray(orderList) || orderList.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Request body must be a non-empty array of { id, sortOrder }"
            });
        }

        const result = await bannerService.reorderBanners(orderList);

        res.status(200).json({
            success: true,
            message: "Banners reordered successfully",
            result
        });
    } catch (error) {
        console.error("Reorder banners error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to reorder banners",
            error: error.message
        });
    }
};

module.exports = {
    createBanner,
    updateBanner,
    getAllBanners,
    getActiveBanners,
    getBannerById,
    deleteBanner,
    toggleBannerStatus,
    reorderBanners
};