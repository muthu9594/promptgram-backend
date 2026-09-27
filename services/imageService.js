// const cloudinary = require("../config/cloudinary");

// const uploadImage = async (file) => {
//     try {
//         const result = await cloudinary.uploader.upload(file.path, {
//             folder: "myapp"
//         });

//         return result;
//     } catch (error) {
//         throw new Error(`Image upload failed: ${error.message}`);
//     }
// };

// module.exports = {
//     uploadImage
// };


const cloudinary = require("../config/cloudinary");

const uploadImage = (file) => {
    return new Promise((resolve, reject) => {

        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "banners"
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        stream.end(file.buffer);
    });
};

module.exports = {
    uploadImage
};