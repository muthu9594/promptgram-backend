const homeService = require("../services/homeService");

/**
 * GET /home
 * Returns everything the home screen needs in one call:
 * - active banners (sorted by sortOrder)
 * - all categories (sorted by sortOrder)
 * - top 20 trending prompts (weighted by favCount, ratingCount, viewCount)
 */
const getHomeData = async (req, res) => {
    try {
        const result = await homeService.getHomeData();

        res.status(200).json({
            success: true,
            result
        });
    } catch (error) {
        console.error("Get home data error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch home data",
            error: error.message
        });
    }
};

module.exports = {
    getHomeData
};