const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware"); // multer config, adjust path as needed

const {
    createPrompt,
    updatePrompt,
    getAllPrompts,
    getPromptById,
    deletePrompt,
    incrementViewCount,
    addRating
} = require("../controllers/promptController");

router.post("/", upload.single("previewImage"), createPrompt);
router.get("/", getAllPrompts); // supports ?categoryId=&status=&tag=&authorUid=&search=&page=&limit=
router.get("/:id", getPromptById);
router.post("/update-prompt", upload.single("previewImage"), updatePrompt);
router.post("/delete-prompt", deletePrompt);
router.post("/view", incrementViewCount);
router.post("/rate", addRating);

module.exports = router;