const express = require("express");
const router = express.Router();

const {
    createUser,
    updateUser,
    getUserById,
    getAllUsers,
    deleteUser,
    updateCredits,
    trackImageAiUsage,
    setUserFlags
} = require("../controllers/userController");

router.post("/", createUser);              // body: { uid, displayName, email, photoUrl }
router.get("/", getAllUsers);              // ?page=&limit=
router.get("/:uid", getUserById);
router.post("/update-user", updateUser);
router.post("/delete-user", deleteUser);
router.post("/credits", updateCredits);           // body: { delta }
router.post("/image-ai-usage", trackImageAiUsage);
router.post("/flags", setUserFlags);              // body: { isPremium, isPro, isCreator }

module.exports = router;