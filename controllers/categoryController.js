const categoryService = require("../services/categoryService");

/**
 * POST /categories
 * Create or update a category (upsert). Image file is optional
 * (iconUrl can be a plain emoji/string instead).
 */
const createCategory = async (req, res) => {
    try {
        const result = await categoryService.createCategory(req.body, req.file);

        res.status(200).json({
            success: true,
            message: "Category created/updated successfully",
            result
        });
    } catch (error) {
        console.error("Create category error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create/update category",
            error: error.message
        });
    }
};

/**
 * PATCH /categories/:id
 * Update an existing category. Image file is optional.
 */
const updateCategory = async (req, res) => {
    try {
        const { id } = req.body;
        const result = await categoryService.updateCategory(id, req.body, req.file);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            result
        });
    } catch (error) {
        console.error("Update category error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update category",
            error: error.message
        });
    }
};

/**
 * GET /categories
 * Get all categories, sorted by sortOrder.
 */
const getAllCategories = async (req, res) => {
    try {
        const result = await categoryService.getAllCategories();

        res.status(200).json({
            success: true,
            result
        });
    } catch (error) {
        console.error("Get all categories error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch categories",
            error: error.message
        });
    }
};

/**
 * GET /categories/:id
 * Get a single category by its _id.
 */
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await categoryService.getCategoryById(id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        res.status(200).json({
            success: true,
            result
        });
    } catch (error) {
        console.error("Get category by id error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch category",
            error: error.message
        });
    }
};

/**
 * DELETE /categories/:id
 * Delete a category and its associated icon image, if one was uploaded.
 */
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.body;
        const result = await categoryService.deleteCategory(id);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Category deleted successfully",
            result
        });
    } catch (error) {
        console.error("Delete category error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete category",
            error: error.message
        });
    }
};

/**
 * PATCH /categories/reorder
 * Bulk-update sortOrder for multiple categories.
 * Body: [{ id: "portraits", sortOrder: 1 }, { id: "vintage", sortOrder: 2 }, ...]
 */
const reorderCategories = async (req, res) => {
    try {
        const orderList = req.body;

        if (!Array.isArray(orderList) || orderList.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Request body must be a non-empty array of { id, sortOrder }"
            });
        }

        const result = await categoryService.reorderCategories(orderList);

        res.status(200).json({
            success: true,
            message: "Categories reordered successfully",
            result
        });
    } catch (error) {
        console.error("Reorder categories error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to reorder categories",
            error: error.message
        });
    }
};

module.exports = {
    createCategory,
    updateCategory,
    getAllCategories,
    getCategoryById,
    deleteCategory,
    reorderCategories
};