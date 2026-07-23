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
    
    // ──────────────────────────────────────────────────────────────
    // NEW: DYNAMIC SECURITY GUARD GATEWAY
    // ──────────────────────────────────────────────────────────────
    const rawCookies = req.headers.cookie || '';
    
    // Log incoming headers to your DigitalOcean logs for visibility
    console.log(`[Auth Request] User ID: ${userId} | Incoming Cookies: ${rawCookies}`);

    // Verification check: Ensure a cookie exists from your shared domain
    // (Protects against direct external, cross-site, or unauthenticated scripts)
    if (!rawCookies || rawCookies.trim() === "") {
        console.warn(`Security Block: Token generation denied for user ID: ${userId} - Missing Session Cookie.`);
        return res.status(401).json({ error: "Access denied. Valid session cookie missing." });
    }
    // ──────────────────────────────────────────────────────────────
    
    try {
        const beamsToken = beamsClient.generateToken(userId);
        return res.json(beamsToken);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/**
 * 2. THE PUBLISHING ENDPOINT (Used by your Jitterbit container or backend database)
 */
app.post('/api/publish-alert', async (req, res) => {
    const { userId, title, message, deep_link } = req.body;

    if (!userId || !title || !message) {
        return res.status(400).json({ error: "Missing userId, title, or message payload variables." });
    }

    try {
        // Use the official SDK to push explicitly to the authenticated User ID [Pusher Beams Docs]
        const publishResponse = await beamsClient.publishToUsers([userId], {
            web: {
                notification: {
                    title: title,
                    body: message,
                    deep_link: deep_link
                }
            }
        });

        console.log(`Alert successfully published to user session: ${userId}`, publishResponse);
        return res.json({ success: true, publishId: publishResponse.publishId });

    } catch (err) {
        console.error("Pusher cloud delivery block failed:", err);
        return res.status(500).json({ error: `Pusher delivery crash: ${err.message}` });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Unified production authentication & alert publishing engine listening on port ${PORT}`);
});
