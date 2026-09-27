const connectDB = require("../config/db");
const { uploadImage, deleteImage } = require("./imageService");

/**
 * Create or update a category (upsert).
 * iconUrl can be:
 *   - a plain string/emoji sent in the body (e.g. "👤"), OR
 *   - an uploaded image file, which takes priority over the body value if both are sent.
 */
const createCategory = async (categoryData, file) => {
    const db = await connectDB();

    if (!categoryData._id) {
        throw new Error("Category _id is required");
    }
    if (!categoryData.name) {
        throw new Error("Category name is required");
    }

    const existing = await db.collection("categories").findOne({ _id: categoryData._id });

    let iconUrl = categoryData.iconUrl; // fallback: plain string/emoji
    let iconPublicId = existing?.iconPublicId || null;

    if (file) {
        const image = await uploadImage(file); // reuses banners' uploadImage; consider a separate folder if needed
        iconUrl = image.secure_url;
        iconPublicId = image.public_id;
    }

    const category = {
        _id: categoryData._id,
        id: categoryData._id, 
        name: categoryData.name,
        iconUrl,
        iconPublicId,
        sortOrder: Number(categoryData.sortOrder)
    };

    const now = new Date();

    const result = await db.collection("categories").updateOne(
        { _id: category._id },
        {
            $set: { ...category, updatedAt: now },
            $setOnInsert: { createdAt: now }
        },
        { upsert: true }
    );

    // Clean up old icon image only if a new file was actually uploaded
    if (file && existing?.iconPublicId) {
        try {
            await deleteImage(existing.iconPublicId);
        } catch (err) {
            console.error("Failed to delete old category icon:", err.message);
        }
    }

    return result;
};

/**
 * Update an existing category. Image file is optional.
 */
const updateCategory = async (id, categoryData, file) => {
    const db = await connectDB();

    const existing = await db.collection("categories").findOne({ _id: id });
    if (!existing) return null;

    const updateData = { updatedAt: new Date() };

    if (categoryData.name !== undefined) {
        updateData.name = categoryData.name;
    }
    if (categoryData.sortOrder !== undefined) {
        updateData.sortOrder = Number(categoryData.sortOrder);
    }
    if (categoryData.iconUrl !== undefined && !file) {
        // plain string/emoji update, no new image
        updateData.iconUrl = categoryData.iconUrl;
    }

    if (file) {
        const image = await uploadImage(file);
        updateData.iconUrl = image.secure_url;
        updateData.iconPublicId = image.public_id;
    }

    await db.collection("categories").updateOne(
        { _id: id },
        { $set: updateData }
    );

    if (file && existing.iconPublicId) {
        try {
            await deleteImage(existing.iconPublicId);
        } catch (err) {
            console.error("Failed to delete old category icon:", err.message);
        }
    }

    return db.collection("categories").findOne({ _id: id });
};

/**
 * Get all categories, sorted by sortOrder.
 */
const getAllCategories = async () => {
    const db = await connectDB();
    return db.collection("categories").find().sort({ sortOrder: 1 }).toArray();
};

/**
 * Get a single category by its _id.
 */
const getCategoryById = async (id) => {
    const db = await connectDB();
    return db.collection("categories").findOne({ _id: id });
};

/**
 * Delete a category and its associated icon image (if it was an uploaded file, not an emoji/plain string).
 */
const deleteCategory = async (id) => {
    const db = await connectDB();

    const category = await db.collection("categories").findOne({ _id: id });
    if (!category) return null;

    if (category.iconPublicId) {
        try {
            await deleteImage(category.iconPublicId);
        } catch (err) {
            console.error("Cloudinary deletion failed:", err.message);
        }
    }

    await db.collection("categories").deleteOne({ _id: id });
    return category;
};

/**
 * Bulk-update sortOrder for multiple categories at once.
 * orderList: [{ id: "portraits", sortOrder: 1 }, { id: "vintage", sortOrder: 2 }, ...]
 */
const reorderCategories = async (orderList) => {
    const db = await connectDB();

    const bulkOps = orderList.map(({ id, sortOrder }) => ({
        updateOne: {
            filter: { _id: id },
            update: { $set: { sortOrder: Number(sortOrder), updatedAt: new Date() } }
        }
    }));

    return db.collection("categories").bulkWrite(bulkOps);
};

module.exports = {
    createCategory,
    updateCategory,
    getAllCategories,
    getCategoryById,
    deleteCategory,
    reorderCategories
};