const connectDB = require("../config/db");

// Weights for the trending score. Tune these to change what "trending" favors.
// Favorites and ratings are stronger signals of quality than passive views,
// so they're weighted higher by default.
const TRENDING_WEIGHTS = {
    favCount: 3,
    ratingCount: 2,
    viewCount: 1
};

/**
 * Get active banners, sorted by sortOrder.
 */
const getActiveBanners = async (db) => {
    return db.collection("banners")
        .find({ isActive: true })
        .sort({ sortOrder: 1 })
        .toArray();
};

/**
 * Get all categories, sorted by sortOrder.
 */
const getAllCategories = async (db) => {
    return db.collection("categories")
        .find()
        .sort({ sortOrder: 1 })
        .toArray();
};

/**
 * Get top 20 trending prompts, ranked by a weighted combination of
 * favCount, ratingCount, and viewCount. Only approved prompts are eligible.
 */
const getTrendingPrompts = async (db, limit = 20) => {
    return db.collection("prompts").aggregate([
        { $match: { status: "approved" } },
        {
            $addFields: {
                trendingScore: {
                    $add: [
                        { $multiply: [{ $ifNull: ["$favCount", 0] }, TRENDING_WEIGHTS.favCount] },
                        { $multiply: [{ $ifNull: ["$ratingCount", 0] }, TRENDING_WEIGHTS.ratingCount] },
                        { $multiply: [{ $ifNull: ["$viewCount", 0] }, TRENDING_WEIGHTS.viewCount] }
                    ]
                }
            }
        },
        { $sort: { trendingScore: -1 } },
        { $limit: limit }
    ]).toArray();
};

/**
 * Get everything the home screen needs in one call.
 * Runs all three queries in parallel since they're independent of each other.
 */
const getHomeData = async () => {
    const db = await connectDB();

    const [banners, categories, trending] = await Promise.all([
        getActiveBanners(db),
        getAllCategories(db),
        getTrendingPrompts(db, 20)
    ]);

    return { banners, categories, trending };
};

module.exports = {
    getHomeData
};