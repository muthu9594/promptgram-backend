const connectDB = require("../config/db");
const { uploadImage, deleteImage } = require("./imageService");

/**
 * Create or update a pack (upsert). Cover image is required.
 * promptCount is always derived from promptIds.length — never trust a
 * client-sent count, since it can drift out of sync with the actual array.
 */
const createPack = async (packData, file) => {
    const db = await connectDB();

    if (!packData._id) {
        throw new Error("Pack _id is required");
    }
    if (!packData.title) {
        throw new Error("Pack title is required");
    }
    if (!file) {
        throw new Error("Pack cover image is required");
    }

    const existing = await db.collection("packs").findOne({ _id: packData._id });

    const image = await uploadImage(file);

    // promptIds may arrive as a JSON string (multipart/form-data can't send real arrays)
    const promptIds = Array.isArray(packData.promptIds)
        ? packData.promptIds
        : JSON.parse(packData.promptIds || "[]");

    const pack = {
        _id: packData._id,
        id: packData._id, // kept for parity with existing Firestore-style "id" field
        title: packData.title,
        coverImageUrl: image.secure_url,
        coverImagePublicId: image.public_id,
        isFeatured: packData.isFeatured === "true" || packData.isFeatured === true,
        promptIds,
        promptCount: promptIds.length
    };

    const now = new Date();

    const result = await db.collection("packs").updateOne(
        { _id: pack._id },
        {
            $set: { ...pack, updatedAt: now },
            $setOnInsert: { createdAt: now }
        },
        { upsert: true }
    );

    if (existing?.coverImagePublicId) {
        try {
            await deleteImage(existing.coverImagePublicId);
        } catch (err) {
            console.error("Failed to delete old pack cover image:", err.message);
        }
    }

    return result;
};

/**
 * Update an existing pack. Image file is optional.
 */
const updatePack = async (id, packData, file) => {
    const db = await connectDB();

    const existing = await db.collection("packs").findOne({ _id: id });
    if (!existing) return null;

    const updateData = { updatedAt: new Date() };

    if (packData.title !== undefined) {
        updateData.title = packData.title;
    }
    if (packData.isFeatured !== undefined) {
        updateData.isFeatured = packData.isFeatured === "true" || packData.isFeatured === true;
    }
    if (packData.promptIds !== undefined) {
        const promptIds = Array.isArray(packData.promptIds)
            ? packData.promptIds
            : JSON.parse(packData.promptIds || "[]");
        updateData.promptIds = promptIds;
        updateData.promptCount = promptIds.length;
    }

    if (file) {
        const image = await uploadImage(file);
        updateData.coverImageUrl = image.secure_url;
        updateData.coverImagePublicId = image.public_id;
    }

    await db.collection("packs").updateOne(
        { _id: id },
        { $set: updateData }
    );

    if (file && existing.coverImagePublicId) {
        try {
            await deleteImage(existing.coverImagePublicId);
        } catch (err) {
            console.error("Failed to delete old pack cover image:", err.message);
        }
    }

    return db.collection("packs").findOne({ _id: id });
};

/**
 * Get all packs.
 */
const getAllPacks = async () => {
    const db = await connectDB();
    return db.collection("packs").find().toArray();
};

/**
 * Get only featured packs (e.g. for a homepage "Featured" section).
 */
const getFeaturedPacks = async () => {
    const db = await connectDB();
    return db.collection("packs").find({ isFeatured: true }).toArray();
};

/**
 * Get a single pack by its _id.
 */
const getPackById = async (id) => {
    const db = await connectDB();
    return db.collection("packs").findOne({ _id: id });
};

/**
 * Delete a pack and its cover image from Cloudinary.
 */
const deletePack = async (id) => {
    const db = await connectDB();

    const pack = await db.collection("packs").findOne({ _id: id });
    if (!pack) return null;

    if (pack.coverImagePublicId) {
        try {
            await deleteImage(pack.coverImagePublicId);
        } catch (err) {
            console.error("Cloudinary deletion failed:", err.message);
        }
    }

    await db.collection("packs").deleteOne({ _id: id });
    return pack;
};

/**
 * Flip a pack's isFeatured status.
 */
const toggleFeatured = async (id) => {
    const db = await connectDB();

    const pack = await db.collection("packs").findOne({ _id: id });
    if (!pack) return null;

    const result = await db.collection("packs").findOneAndUpdate(
        { _id: id },
        { $set: { isFeatured: !pack.isFeatured, updatedAt: new Date() } },
        { returnDocument: "after" }
    );

    return result.value !== undefined ? result.value : result;
};

/**
 * Add a promptId to a pack (no-op if it's already present).
 * promptCount is recalculated automatically.
 */
const addPromptToPack = async (id, promptId) => {
    if (!promptId) throw new Error("promptId is required");

    const db = await connectDB();

    const pack = await db.collection("packs").findOne({ _id: id });
    if (!pack) return null;

    await db.collection("packs").updateOne(
        { _id: id },
        { $addToSet: { promptIds: promptId } } // $addToSet avoids duplicates
    );

    const updated = await db.collection("packs").findOne({ _id: id });

    await db.collection("packs").updateOne(
        { _id: id },
        { $set: { promptCount: updated.promptIds.length, updatedAt: new Date() } }
    );

    return db.collection("packs").findOne({ _id: id });
};

/**
 * Remove a promptId from a pack. promptCount is recalculated automatically.
 */
const removePromptFromPack = async (id, promptId) => {
    if (!promptId) throw new Error("promptId is required");

    const db = await connectDB();

    const pack = await db.collection("packs").findOne({ _id: id });
    if (!pack) return null;

    await db.collection("packs").updateOne(
        { _id: id },
        { $pull: { promptIds: promptId } }
    );

    const updated = await db.collection("packs").findOne({ _id: id });

    await db.collection("packs").updateOne(
        { _id: id },
        { $set: { promptCount: updated.promptIds.length, updatedAt: new Date() } }
    );

    return db.collection("packs").findOne({ _id: id });
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