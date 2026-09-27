const express = require("express");
const router = express.Router();

const {
    addFavorite,
    removeFavorite,
    toggleFavorite,
    checkFavorite,
    getFavoritesByUser,
    getFavoritesByPrompt,
    countFavoritesByPrompt
} = require("../controllers/favouriteController");

// Static/specific routes first, before dynamic ones
router.post("/check", checkFavorite);                          // ?uid=xxx&promptId=yyy
router.post("/toggle", toggleFavorite);                       // body: { uid, promptId }
router.get("/user/:uid", getFavoritesByUser);
router.get("/prompt/:promptId", getFavoritesByPrompt);
router.get("/prompt/:promptId/count", countFavoritesByPrompt);

router.post("/", addFavorite);                                 // body: { uid, promptId }
router.post("/delete-favourite", removeFavorite);                            // body: { uid, promptId }

module.exports = router;