
const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");

const {
    createBanner,
    updateBanner,
    getAllBanners,
    getActiveBanners,
    getBannerById,
    deleteBanner,
    toggleBannerStatus,
    reorderBanners
} = require("../controllers/bannerController");

router.get("/active", getActiveBanners);
router.post("/reorder", reorderBanners);

router.post("/", upload.single("image"), createBanner);
router.get("/", getAllBanners);
router.get("/:id", getBannerById);
router.post("/update-banner", upload.single("image"), updateBanner);
router.post("/delete-banner", deleteBanner);
router.post("/toggle", toggleBannerStatus);

module.exports = router;