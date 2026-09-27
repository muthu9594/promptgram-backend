const connectDB = require("../config/db");

/**
 * Build the composite _id used by Firestore-style docs: "{uid}_{promptId}"
 * This makes add/remove/check operations naturally idempotent —
 * no duplicate favorites can exist for the same user+prompt pair.
 */
const buildFavoriteId = (uid, promptId) => `${uid}_${promptId}`;

/**
 * Add a favorite (idempotent — if it already exists, this just confirms it).
 */
const addFavorite = async (uid, promptId) => {
    if (!uid) throw new Error("uid is required");
    if (!promptId) throw new Error("promptId is required");

    const db = await connectDB();
    const _id = buildFavoriteId(uid, promptId);

    const favorite = {
        _id,
        uid,
        promptId,
        createdAt: new Date()
    };

    const result = await db.collection("favorites").updateOne(
        { _id },
        { $setOnInsert: favorite },
        { upsert: true }
    );

    return result;
};

/**
 * Remove a favorite.
 */
const removeFavorite = async (uid, promptId) => {
    if (!uid) throw new Error("uid is required");
    if (!promptId) throw new Error("promptId is required");

    const db = await connectDB();
    const _id = buildFavoriteId(uid, promptId);

    const favorite = await db.collection("favorites").findOne({ _id });
    if (!favorite) return null;

    await db.collection("favorites").deleteOne({ _id });
    return favorite;
};

/**
 * Toggle a favorite on/off — the typical behavior behind a heart/star icon.
 * Returns { favorited: true/false } so the frontend knows the new state.
 */
const toggleFavorite = async (uid, promptId) => {
    if (!uid) throw new Error("uid is required");
    if (!promptId) throw new Error("promptId is required");

    const db = await connectDB();
    const _id = buildFavoriteId(uid, promptId);

    const existing = await db.collection("favorites").findOne({ _id });

    if (existing) {
        await db.collection("favorites").deleteOne({ _id });
        return { favorited: false };
    }

    await db.collection("favorites").insertOne({
        _id,
        uid,
        promptId,
        createdAt: new Date()
    });
    return { favorited: true };
};

/**
 * Check whether a specific uid+promptId is favorited.
 */
const isFavorited = async (uid, promptId) => {
    if (!uid) throw new Error("uid is required");
    if (!promptId) throw new Error("promptId is required");

    const db = await connectDB();
    const _id = buildFavoriteId(uid, promptId);

    const favorite = await db.collection("favorites").findOne({ _id });
    return !!favorite;
};

/**
 * Get all favorites for a given user, most recent first.
 */
const getFavoritesByUser = async (uid) => {
    if (!uid) throw new Error("uid is required");

    const db = await connectDB();
    return db.collection("favorites")
        .find({ uid })
        .sort({ createdAt: -1 })
        .toArray();
};

/**
 * Get all users who favorited a given prompt (e.g. for a "X people liked this" count).
 */
const getFavoritesByPrompt = async (promptId) => {
    if (!promptId) throw new Error("promptId is required");

    const db = await connectDB();
    return db.collection("favorites")
        .find({ promptId })
        .sort({ createdAt: -1 })
        .toArray();
};

/**
 * Count how many favorites a prompt has.
 */
const countFavoritesByPrompt = async (promptId) => {
    if (!promptId) throw new Error("promptId is required");

    const db = await connectDB();
    return db.collection("favorites").countDocuments({ promptId });
};

module.exports = {
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorited,
    getFavoritesByUser,
    getFavoritesByPrompt,
    countFavoritesByPrompt
};