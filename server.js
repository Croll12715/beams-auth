const express = require('express');
const PushNotifications = require('@pusher/push-notifications-server');

const app = express();
// Enable JSON body parsing so your backend can read incoming request payloads
app.use(express.json());

const PORT = process.env.PORT || 8080; 

// Initializing the official Server SDK client securely
const beamsClient = new PushNotifications({
    instanceId: process.env.PUSHER_INSTANCE_ID,
    secretKey: process.env.PUSHER_SECRET_KEY
});

/**
 * 1. THE AUTHENTICATION ENDPOINT (Used by the frontend Web SDK)
 */
app.get('/api/beams-auth', (req, res) => {
    const userId = req.query.user_id;
    if (!userId) return res.status(400).json({ error: "Missing user_id parameter." });

    try {
        const beamsToken = beamsClient.generateToken(userId);
        return res.json(beamsToken);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Unified production authentication & alert publishing engine listening on port ${PORT}`);
});
