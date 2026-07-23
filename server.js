const express = require('express');
const PushNotifications = require('@pusher/push-notifications-server');

const app = express();
const PORT = process.env.PORT || 8080; 

const beamsClient = new PushNotifications({
    instanceId: "a788f65a-0208-4c79-b746-29b4e456fe27",
    secretKey: process.env.PUSHER_SECRET_KEY
});

// Matches the internal path forwarded by the DigitalOcean App routing engine
app.get('/api/beams-auth', (req, res) => {
    const userId = req.query.user_id;

    if (!userId) {
        return res.status(400).json({ error: "Missing user_id parameter." });
    }

    try {
        const beamsToken = beamsClient.generateToken(userId);
        // Clean JSON return payload with zero CORS overrides needed
        return res.json(beamsToken);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Add this route block right above your app.listen() block inside server.js
app.get('/api/beams-sdk.js', async (req, res) => {
    try {
        // Fetch the raw script content directly from your verified Pusher CDN location
        const response = await fetch("https://js.pusher.com/beams/2.1.0/push-notifications-cdn.js");
        const scriptText = await response.text();
        
        // Instruct the browser to execute it natively as standard JavaScript
        res.setHeader("Content-Type", "application/javascript");
        return res.send(scriptText);
    } catch (err) {
        return res.status(500).send(`failed to load pusher sdk stream: ${err.message}`);
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Unified App routing microservice listening on port ${PORT}`);
});
