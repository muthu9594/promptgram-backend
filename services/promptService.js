const connectDB = require("../config/db");
const { uploadImage, deleteImage } = require("./imageService");

/**
 * Create a new prompt. Preview image is required (stored under placeholders.previewImageUrl).
 */
const createPrompt = async (promptData, file) => {
    const db = await connectDB();

    if (!promptData.id) {
        throw new Error("Prompt _id is required");
    }
    if (!promptData.title) {
        throw new Error("Prompt title is required");
    }
    if (!promptData.promptText) {
        throw new Error("promptText is required");
    }
    if (!file) {
        throw new Error("Preview image is required");
    }

    const existing = await db.collection("prompts").findOne({ id: promptData.id });

    const image = await uploadImage(file);

    // tags may arrive as a JSON string via multipart/form-data
    const tags = Array.isArray(promptData.tags)
        ? promptData.tags
        : JSON.parse(promptData.tags || "[]");

    const prompt = {
        _id: promptData.id,
        id: promptData.id, // kept for parity with existing Firestore-style "id" field
        title: promptData.title,
        description: promptData.description || "",
        authorName: promptData.authorName,
        authorUid: promptData.authorUid,
        categoryId: promptData.categoryId || "all",
        tags,
        status: promptData.status || "pending", // default to pending until reviewed/approved
        avgRating: 0,
        ratingCount: 0,
        favCount: 0,
        viewCount: 0,
        // placeholders: {
            previewImageUrl: image.secure_url,
            previewImagePublicId: image.public_id,
            promptText: promptData.promptText
        // }
    };

    const now = new Date();

    await db.collection("prompts").insertOne({
        ...prompt,
        createdAt: now,
        updatedAt: now
    });

    // Not expected on create since _id is generated per-request, but guard anyway
    if (existing?.previewImagePublicId) {
        try {
            await deleteImage(existing.previewImagePublicId);
        } catch (err) {
            console.error("Failed to delete old preview image:", err.message);
        }
    }

    return db.collection("prompts").findOne({ _id: prompt._id });
};

/**
 * Update an existing prompt. Preview image is optional.
 */
const updatePrompt = async (id, promptData, file) => {
    const db = await connectDB();

    const existing = await db.collection("prompts").findOne({ _id: id });
    if (!existing) return null;

    const updateData = { updatedAt: new Date() };

    if (promptData.title !== undefined) updateData.title = promptData.title;
    if (promptData.description !== undefined) updateData.description = promptData.description;
    if (promptData.authorName !== undefined) updateData.authorName = promptData.authorName;
    if (promptData.authorUid !== undefined) updateData.authorUid = promptData.authorUid;
    if (promptData.categoryId !== undefined) updateData.categoryId = promptData.categoryId;
    if (promptData.status !== undefined) updateData.status = promptData.status;

    if (promptData.tags !== undefined) {
        updateData.tags = Array.isArray(promptData.tags)
            ? promptData.tags
            : JSON.parse(promptData.tags || "[]");
    }

    if (promptData.promptText !== undefined && !file) {
        updateData["promptText"] = promptData.promptText;
    }

    if (file) {
        const image = await uploadImage(file);
        updateData["previewImageUrl"] = image.secure_url;
        updateData["previewImagePublicId"] = image.public_id;
        if (promptData.promptText !== undefined) {
            updateData["promptText"] = promptData.promptText;
        }
    }

    await db.collection("prompts").updateOne(
        { _id: id },
        { $set: updateData }
    );

    if (file && existing?.previewImagePublicId) {
        try {
            await deleteImage(existing.previewImagePublicId);
        } catch (err) {
            console.error("Failed to delete old preview image:", err.message);
        }
    }

    return db.collection("prompts").findOne({ _id: id });
};

/**
 * Get all prompts with optional filters + pagination.
 * filters: { categoryId, status, tag, authorUid, search }
 * pagination: { page = 1, limit = 20 }
 */
const getAllPrompts = async (filters = {}, pagination = {}) => {
    const db = await connectDB();

    const query = {};
    if (filters.categoryId) query.categoryId = filters.categoryId;
    if (filters.status) query.status = filters.status;
    if (filters.tag) query.tags = filters.tag;
    if (filters.authorUid) query.authorUid = filters.authorUid;
    if (filters.search) {
        query.title = { $regex: filters.search, $options: "i" };
    }

    const page = Math.max(Number(pagination.page) || 1, 1);
    const limit = Math.max(Number(pagination.limit) || 20, 1);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        db.collection("prompts")
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray(),
        db.collection("prompts").countDocuments(query)
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
 * Get a single prompt by its _id.
 */
const getPromptById = async (id) => {
    const db = await connectDB();
    return db.collection("prompts").findOne({ _id: id });
};

/**
 * Delete a prompt and its preview image from Cloudinary.
 */
const deletePrompt = async (id) => {
    const db = await connectDB();

    const prompt = await db.collection("prompts").findOne({ _id: id });
    if (!prompt) return null;

    if (prompt?.previewImagePublicId) {
        try {
            await deleteImage(prompt.previewImagePublicId);
        } catch (err) {
            console.error("Cloudinary deletion failed:", err.message);
        }
    }

    await db.collection("prompts").deleteOne({ _id: id });
    return prompt;
};

/**
 * Increment a prompt's viewCount by 1. Fire-and-forget friendly —
 * uses $inc so concurrent requests don't overwrite each other.
 */
const incrementViewCount = async (id) => {
    const db = await connectDB();

    const result = await db.collection("prompts").findOneAndUpdate(
        { _id: id },
        { $inc: { viewCount: 1 } },
        { returnDocument: "after" }
    );

    return result.value !== undefined ? result.value : result;
};

/**
 * Increment or decrement favCount by 1. Called from favoriteService
 * when a favorite is added/removed, so favCount stays in sync.
 * delta should be 1 (add) or -1 (remove).
 */
const updateFavCount = async (id, delta) => {
    const db = await connectDB();

    const result = await db.collection("prompts").findOneAndUpdate(
        { _id: id },
        { $inc: { favCount: delta } },
        { returnDocument: "after" }
    );

    return result.value !== undefined ? result.value : result;
};

/**
 * Add a new rating to a prompt and recalculate avgRating.
 * This assumes the caller (ratingService) has already validated
 * the rating value and prevented duplicate ratings from the same user.
 */
const addRating = async (id, ratingValue) => {
    const db = await connectDB();

    const prompt = await db.collection("prompts").findOne({ _id: id });
    if (!prompt) return null;

    const newRatingCount = prompt.ratingCount + 1;
    const newAvgRating =
        (prompt.avgRating * prompt.ratingCount + ratingValue) / newRatingCount;

    const result = await db.collection("prompts").findOneAndUpdate(
        { _id: id },
        {
            $set: {
                avgRating: Number(newAvgRating.toFixed(2)),
                ratingCount: newRatingCount,
                updatedAt: new Date()
            }
        },
        { returnDocument: "after" }
    );

    return result.value !== undefined ? result.value : result;
};

module.exports = {
    createPrompt,
    updatePrompt,
    getAllPrompts,
    getPromptById,
    deletePrompt,
    incrementViewCount,
    updateFavCount,
    addRating
};