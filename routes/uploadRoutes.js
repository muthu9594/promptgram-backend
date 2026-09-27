const express = require("express");

const router = express.Router();

const upload = require("../middleware/uploadMiddleware");
const uploadController = require("../controllers/upload/imageController");

router.post(
    "/image",
    upload.single("image"),
    uploadController.upload
);

module.exports = router;