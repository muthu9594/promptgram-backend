const express = require("express");
const router = express.Router();

const {
    submitRating,
    deleteRating,
    getRatingByUser,
    getRatingsByPrompt,
    getRatingsByUser
} = require("../controllers/ratingController");

// Specific routes first, before generic ones
router.get("/user/:uid/prompt/:promptId", getRatingByUser);
router.get("/prompt/:promptId", getRatingsByPrompt);
router.get("/user/:uid", getRatingsByUser);

router.post("/", submitRating);      // body: { uid, promptId, stars, comment }
router.post("/delete-rating", deleteRating);    // body: { uid, promptId }

module.exports = router;