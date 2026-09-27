const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");

const {
    createCategory,
    updateCategory,
    getAllCategories,
    getCategoryById,
    deleteCategory,
    reorderCategories
} = require("../controllers/categoryController");

// Static route first, before "/:id", so it isn't shadowed
router.post("/reorder", reorderCategories);

router.post("/", upload.single("icon"), createCategory);
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);
router.post("/update-category", upload.single("icon"), updateCategory);
router.post("/delete-category", deleteCategory);

module.exports = router;