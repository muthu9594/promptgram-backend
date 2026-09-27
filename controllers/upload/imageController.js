const { uploadImage } = require("../../services/imageService");

const upload = async (req, res) => {
    try {
        const result = await uploadImage(req.file);

        res.status(200).json({
            message: "Image uploaded successfully",
            image: result
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    upload
};