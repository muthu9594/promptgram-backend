require("dotenv").config();

const express = require("express");

const uploadRoutes = require("./routes/uploadRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const favouriteRoutes = require("./routes/favouriteRoutes");
const packRoutes = require("./routes/packRoutes");
const promptRoutes = require("./routes/promptRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const userRoutes = require("./routes/userRoutes");
const homeRoutes = require("./routes/homeRoutes");

const app = express();

app.use(express.json());

app.use("/api/upload", uploadRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/favourite", favouriteRoutes);
app.use("/api/pack", packRoutes);
app.use("/api/prompt", promptRoutes);
app.use("/api/rating", ratingRoutes);
app.use("/api/user", userRoutes);
app.use("/api/home", homeRoutes);

// Central error handler — keeps a thrown error from ever crashing
// the whole function on Vercel (see Vercel's Express guide).
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error", error: err.message });
});

// Required for Vercel to detect and deploy this as a serverless function.
module.exports = app;

// Only start a real listening server when running locally (e.g. `node index.js`).
// On Vercel this file is never executed directly — Vercel imports `app` and
// calls it per-request instead, so app.listen() would be meaningless there.
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port: ${PORT}`);
    });
}