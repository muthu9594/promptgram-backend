// const connectDB = require("../config/db");
// const { uploadImage } = require("./imageService");

// const createBanner = async (bannerData,file) => {
//     const db = await connectDB();

//     if(!file){
//         throw new Error("Banner image is required");
//     }

//     const image = await uploadImage(file);

//     const banner = {
//         _id: bannerData._id,
//         imageUrl: image.secure_url,
//         imagePublicId: image.public_id,
//         isActive:  bannerData.isActive === "true" || bannerData.isActive === true,
//         sortOrder: Number(bannerData.sortOrder),
//         targetType: bannerData.targetType,
//         targetValue: bannerData.targetValue,
//         title: bannerData.title
//     };

//    const now = new Date();

// const result = await db.collection("banners").updateOne(
//     { _id: banner._id },
//     {
//         $set: { ...banner, updatedAt: now },
//         $setOnInsert: { createdAt: now }
//     },
//     { upsert: true }
// );
//     return result;
// };

// module.exports = {
//     createBanner
// };




const connectDB = require("../config/db");
const { uploadImage, deleteImage } = require("./imageService");

/**
 * Create or update a banner (upsert).
 * If a banner with the same _id already exists and a new image is uploaded,
 * the old Cloudinary image is deleted after the new one is saved.
 */
const createBanner = async (bannerData, file) => {
    const db = await connectDB();

    if (!bannerData._id) {
        throw new Error("Banner _id is required");
    }
    if (!file) {
        throw new Error("Banner image is required");
    }

    const existing = await db.collection("banners").findOne({ _id: bannerData._id });

    const image = await uploadImage(file);

    const banner = {
        _id: bannerData._id,
        imageUrl: image.secure_url,
        imagePublicId: image.public_id,
        isActive: bannerData.isActive === "true" || bannerData.isActive === true,
        sortOrder: Number(bannerData.sortOrder),
        targetType: bannerData.targetType,
        targetValue: bannerData.targetValue,
        title: bannerData.title
    };

    const now = new Date();

    const result = await db.collection("banners").updateOne(
        { _id: banner._id },
        {
            $set: { ...banner, updatedAt: now },
            $setOnInsert: { createdAt: now }
        },
        { upsert: true }
    );

    // Clean up old Cloudinary image if this was an update with a new image
    if (existing?.imagePublicId) {
        try {
            await deleteImage(existing.imagePublicId);
        } catch (err) {
            console.error("Failed to delete old Cloudinary image:", err.message);
        }
    }

    return result;
};

/**
 * Update an existing banner without requiring a new image.
 * Use this for admin edits (title, sortOrder, targetType, etc.)
 * where the image may or may not change.
 */
const updateBanner = async (id, bannerData, file) => {
    const db = await connectDB();

    const existing = await db.collection("banners").findOne({ _id: id });
    if (!existing) return null;

    const updateData = { updatedAt: new Date() };

    if (bannerData.isActive !== undefined) {
        updateData.isActive = bannerData.isActive === "true" || bannerData.isActive === true;
    }
    if (bannerData.sortOrder !== undefined) {
        updateData.sortOrder = Number(bannerData.sortOrder);
    }
    if (bannerData.targetType !== undefined) {
        updateData.targetType = bannerData.targetType;
    }
    if (bannerData.targetValue !== undefined) {
        updateData.targetValue = bannerData.targetValue;
    }
    if (bannerData.title !== undefined) {
        updateData.title = bannerData.title;
    }

    if (file) {
        const image = await uploadImage(file);
        updateData.imageUrl = image.secure_url;
        updateData.imagePublicId = image.public_id;
    }

    await db.collection("banners").updateOne(
        { _id: id },
        { $set: updateData }
    );

    // Clean up old Cloudinary image only after the new one is safely saved
    if (file && existing.imagePublicId) {
        try {
            await deleteImage(existing.imagePublicId);
        } catch (err) {
            console.error("Failed to delete old Cloudinary image:", err.message);
        }
    }

    return db.collection("banners").findOne({ _id: id });
};

/**
 * Get all banners (admin view — includes inactive), sorted by sortOrder.
 */
const getAllBanners = async () => {
    const db = await connectDB();
    return db.collection("banners").find().sort({ sortOrder: 1 }).toArray();
};

/**
 * Get only active banners, sorted by sortOrder.
 * This is what the public-facing app should call.
 */
const getActiveBanners = async () => {
    const db = await connectDB();
    return db.collection("banners")
        .find({ isActive: true })
        .sort({ sortOrder: 1 })
        .toArray();
};

/**
 * Get a single banner by its _id.
 */
const getBannerById = async (id) => {
    const db = await connectDB();
    return db.collection("banners").findOne({ _id: id });
};

/**
 * Delete a banner and its associated Cloudinary image.
 * If Cloudinary deletion fails, the error is logged but the
 * MongoDB deletion still proceeds (avoids undeletable banners
 * due to a flaky third-party API).
 */
const deleteBanner = async (id) => {
    const db = await connectDB();

    const banner = await db.collection("banners").findOne({ _id: id });
    if (!banner) return null;

    if (banner.imagePublicId) {
        try {
            await deleteImage(banner.imagePublicId);
        } catch (err) {
            console.error("Cloudinary deletion failed:", err.message);
        }
    }

    await db.collection("banners").deleteOne({ _id: id });
    return banner;
};

/**
 * Flip a banner's isActive status (quick on/off toggle for admin UI).
 */
const toggleBannerStatus = async (id) => {
    const db = await connectDB();

    const banner = await db.collection("banners").findOne({ _id: id });
    if (!banner) return null;

    const result = await db.collection("banners").findOneAndUpdate(
        { _id: id },
        { $set: { isActive: !banner.isActive, updatedAt: new Date() } },
        { returnDocument: "after" }
    );

    // Note: driver versions differ on return shape.
    // Newer drivers (v4+) return the document directly.
    // Older drivers (v3.x) return it under `.value`.
    return result.value !== undefined ? result.value : result;
};

/**
 * Bulk-update sortOrder for multiple banners at once (drag-and-drop reorder).
 * orderList: [{ id: "banner_1", sortOrder: 1 }, { id: "banner_2", sortOrder: 2 }, ...]
 */
const reorderBanners = async (orderList) => {
    const db = await connectDB();

    const bulkOps = orderList.map(({ id, sortOrder }) => ({
        updateOne: {
            filter: { _id: id },
            update: { $set: { sortOrder: Number(sortOrder), updatedAt: new Date() } }
        }
    }));

    return db.collection("banners").bulkWrite(bulkOps);
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