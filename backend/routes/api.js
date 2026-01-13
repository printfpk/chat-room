const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'API is running' });
});

// Example API endpoint
router.get('/video-details', (req, res) => {
    res.json({
        title: "Big Buck Bunny",
        duration: "09:56",
        description: "Big Buck Bunny tells the story of a giant rabbit with a heart bigger than himself."
    });
});

module.exports = router;
