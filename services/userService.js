const connectDB = require("../config/db");

/**
 * Create a user profile (typically called right after signup/first login,
 * using the auth provider's uid as _id). Upsert so repeated calls from
 * the client (e.g. on every login) don't throw or duplicate.
 */
const createUser = async (uid, userData) => {
    if (!uid) throw new Error("uid is required");

    const db = await connectDB();

    const existing = await db.collection("users").findOne({ _id: uid });
    if (existing) return existing; // don't overwrite an existing profile on repeat login

    const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

    const user = {
        _id: uid,
        displayName: userData.displayName || "",
        email: userData.email || "",
        photoUrl: userData.photoUrl || "",
        credits: 0,
        isCreator: false,
        isPremium: false,
        isPro: false,
        image_ai_usage: {
            count: 0,
            date: today
        },
        createdAt: new Date()
    };

    await db.collection("users").insertOne(user);
    return user;
};

/**
 * Update a user's editable profile fields (displayName, photoUrl, etc.)
 * Flags (isPremium/isPro/isCreator) and credits are handled by their own
 * dedicated methods below, to avoid a client accidentally granting itself premium.
 */
const updateUser = async (uid, userData) => {
    const db = await connectDB();

    const existing = await db.collection("users").findOne({ _id: uid });
    if (!existing) return null;

    const updateData = { updatedAt: new Date() };

    if (userData.displayName !== undefined) updateData.displayName = userData.displayName;
    if (userData.email !== undefined) updateData.email = userData.email;
    if (userData.photoUrl !== undefined) updateData.photoUrl = userData.photoUrl;

    await db.collection("users").updateOne(
        { _id: uid },
        { $set: updateData }
    );

    return db.collection("users").findOne({ _id: uid });
};

/**
 * Get a single user by uid.
 */
const getUserById = async (uid) => {
    const db = await connectDB();
    return db.collection("users").findOne({ _id: uid });
};

/**
 * Get all users with pagination (admin view).
 */
const getAllUsers = async (pagination = {}) => {
    const db = await connectDB();

    const page = Math.max(Number(pagination.page) || 1, 1);
    const limit = Math.max(Number(pagination.limit) || 20, 1);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        db.collection("users")
            .find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray(),
        db.collection("users").countDocuments()
    ]);

    return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

/**
 * Delete a user profile.
 * NOTE: this only removes the Mongo document — it does NOT delete the
 * underlying auth account (Firebase/Auth0/etc). Handle that separately
 * if you need full account deletion.
 */
const deleteUser = async (uid) => {
    const db = await connectDB();

    const user = await db.collection("users").findOne({ _id: uid });
    if (!user) return null;

    await db.collection("users").deleteOne({ _id: uid });
    return user;
};

/**
 * Adjust a user's credit balance by a delta (positive to add, negative to spend).
 * Uses $inc for safe concurrent updates. Throws if the resulting balance
 * would go negative, unless allowNegative is explicitly passed as true.
 */
const updateCredits = async (uid, delta, allowNegative = false) => {
    const db = await connectDB();

    const user = await db.collection("users").findOne({ _id: uid });
    if (!user) return null;

    const newBalance = user.credits + delta;
    if (!allowNegative && newBalance < 0) {
        throw new Error("Insufficient credits");
    }

    const result = await db.collection("users").findOneAndUpdate(
        { _id: uid },
        { $inc: { credits: delta }, $set: { updatedAt: new Date() } },
        { returnDocument: "after" }
    );

    return result.value !== undefined ? result.value : result;
};

/**
 * Track a single AI image generation use.
 * Resets the count to 1 if it's a new calendar day, otherwise increments it.
 * Useful for enforcing a daily free-tier limit (e.g. "3 free generations/day").
 */
const trackImageAiUsage = async (uid) => {
    const db = await connectDB();

    const user = await db.collection("users").findOne({ _id: uid });
    if (!user) return null;

    const today = new Date().toISOString().split("T")[0];
    const isSameDay = user.image_ai_usage?.date === today;

    const newUsage = {
        count: isSameDay ? (user.image_ai_usage.count || 0) + 1 : 1,
        date: today
    };

    const result = await db.collection("users").findOneAndUpdate(
        { _id: uid },
        { $set: { image_ai_usage: newUsage, updatedAt: new Date() } },
        { returnDocument: "after" }
    );

    return result.value !== undefined ? result.value : result;
};

/**
 * Update membership/role flags (isPremium, isPro, isCreator).
 * Kept separate from updateUser so this can be gated behind admin
 * auth or a payment-webhook handler, not a plain profile edit.
 */
const setUserFlags = async (uid, flags) => {
    const db = await connectDB();

    const existing = await db.collection("users").findOne({ _id: uid });
    if (!existing) return null;

    const updateData = { updatedAt: new Date() };
    if (flags.isPremium !== undefined) updateData.isPremium = !!flags.isPremium;
    if (flags.isPro !== undefined) updateData.isPro = !!flags.isPro;
    if (flags.isCreator !== undefined) updateData.isCreator = !!flags.isCreator;

    const result = await db.collection("users").findOneAndUpdate(
        { _id: uid },
        { $set: updateData },
        { returnDocument: "after" }
    );

    return result.value !== undefined ? result.value : result;
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