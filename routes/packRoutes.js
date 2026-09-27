const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware"); 

const {
    createPack,
    updatePack,
    getAllPacks,
    getFeaturedPacks,
    getPackById,
    deletePack,
    toggleFeatured,
    addPromptToPack,
    removePromptFromPack
} = require("../controllers/packController");

// Static route first, before "/:id", so it isn't shadowed
router.get("/featured", getFeaturedPacks);

router.post("/", upload.single("coverImage"), createPack);
router.get("/", getAllPacks);
router.get("/:id", getPackById);
router.post("/update-pack", upload.single("coverImage"), updatePack);
router.post("/delete-pack", deletePack);
router.post("/toggle-featured", toggleFeatured);
router.post("/prompts/add", addPromptToPack);
router.post("/prompts/remove", removePromptFromPack);

module.exports = router;
