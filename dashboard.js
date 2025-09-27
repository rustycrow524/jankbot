const express = require('express');

module.exports = function startDashboard(client) {
    const app = express();
    const port = process.env.PORT || 3000;

    app.get('/', (req, res) => {
        if (!client.user) return res.send("🤖 Bot is starting...");
        res.send(`
            <h1>🤖 ${client.user.tag} is online!</h1>
            <p>Connected to ${client.guilds.cache.size} servers.</p>
        `);
    });

    app.listen(port, () => {
        console.log(`🌐 Dashboard running on http://localhost:${port}`);
    });
};
