const connectDB = require("../config/db");

/**
 * Build the composite _id: "{uid}_{promptId}" — same pattern as favorites.
 * This guarantees one rating per user per prompt (upsert instead of duplicate inserts).
 */
const buildRatingId = (uid, promptId) => `${uid}_${promptId}`;

/**
 * Recalculate a prompt's avgRating + ratingCount from scratch by aggregating
 * all its rating documents. This is safer than incremental math (+1/-1 style)
 * because it stays correct even when a user changes or deletes their rating,
 * not just when new ratings are added.
 */
const recalculatePromptRating = async (promptId) => {
    const db = await connectDB();

    const [stats] = await db.collection("ratings").aggregate([
        { $match: { promptId } },
        {
            $group: {
                _id: "$promptId",
                avgRating: { $avg: "$stars" },
                ratingCount: { $sum: 1 }
            }
        }
    ]).toArray();

    const avgRating = stats ? Number(stats.avgRating.toFixed(2)) : 0;
    const ratingCount = stats ? stats.ratingCount : 0;

    await db.collection("prompts").updateOne(
        { _id: promptId },
        { $set: { avgRating, ratingCount, updatedAt: new Date() } }
    );

    return { avgRating, ratingCount };
};

/**
 * Submit or update a rating (upsert — one rating per user per prompt).
 * If the user already rated this prompt, their stars/comment are overwritten
 * and the prompt's avgRating is recalculated to reflect the change.
 */
const submitRating = async (uid, promptId, stars, comment = null) => {
    if (!uid) throw new Error("uid is required");
    if (!promptId) throw new Error("promptId is required");
    if (stars === undefined || stars < 1 || stars > 5) {
        throw new Error("stars must be a number between 1 and 5");
    }

    const db = await connectDB();
    const _id = buildRatingId(uid, promptId);

    const existing = await db.collection("ratings").findOne({ _id });

    const now = new Date();

    await db.collection("ratings").updateOne(
        { _id },
        {
            $set: {
                uid,
                promptId,
                stars: Number(stars),
                comment,
                updatedAt: now
            },
            $setOnInsert: { createdAt: now }
        },
        { upsert: true }
    );

    const { avgRating, ratingCount } = await recalculatePromptRating(promptId);

    const rating = await db.collection("ratings").findOne({ _id });

    return {
        rating,
        isNewRating: !existing,
        promptStats: { avgRating, ratingCount }
    };
};

/**
 * Delete a rating and recalculate the prompt's avgRating/ratingCount.
 */
const deleteRating = async (uid, promptId) => {
    if (!uid) throw new Error("uid is required");
    if (!promptId) throw new Error("promptId is required");

    const db = await connectDB();
    const _id = buildRatingId(uid, promptId);

    const rating = await db.collection("ratings").findOne({ _id });
    if (!rating) return null;

    await db.collection("ratings").deleteOne({ _id });

    const promptStats = await recalculatePromptRating(promptId);

    return { rating, promptStats };
};

/**
 * Get a specific user's rating for a specific prompt (e.g. to pre-fill
 * a star-rating widget with "you already rated this 4 stars").
 */
const getRatingByUser = async (uid, promptId) => {
    if (!uid) throw new Error("uid is required");
    if (!promptId) throw new Error("promptId is required");

    const db = await connectDB();
    return db.collection("ratings").findOne({ _id: buildRatingId(uid, promptId) });
};

/**
 * Get all ratings for a given prompt (e.g. to display reviews/comments), most recent first.
 */
const getRatingsByPrompt = async (promptId) => {
    if (!promptId) throw new Error("promptId is required");

    const db = await connectDB();
    return db.collection("ratings")
        .find({ promptId })
        .sort({ createdAt: -1 })
        .toArray();
};

/**
 * Get all ratings a given user has submitted.
 */
const getRatingsByUser = async (uid) => {
    if (!uid) throw new Error("uid is required");

    const db = await connectDB();
    return db.collection("ratings")
        .find({ uid })
        .sort({ createdAt: -1 })
        .toArray();
};

module.exports = {
    submitRating,
    deleteRating,
    getRatingByUser,
    getRatingsByPrompt,
    getRatingsByUser,
    recalculatePromptRating
};