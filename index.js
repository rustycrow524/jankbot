// Require the necessary Discord.js classes
require('dotenv').config();
const { Client, Events, GatewayIntentBits, EmbedBuilder, PermissionsBitField, Partials } = require('discord.js');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

// Create a new client instance with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages
    ]
});

// When the client is ready, run this once
client.once('clientReady', c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const content = message.content; // 👈 This is what was missing

    if (content.startsWith(',ping')) {
        await message.reply('pong!');
    }

    else if (message.content.startsWith(',help')) {
        const helpEmbed = new EmbedBuilder()
            .setTitle("Commands")
            .setDescription("heres a list of commands")
            .addFields(
                {
                    name: "Misc",
                    value: ",help - you already know what this does\n,ping - pong!",
                    inline: false
                },
                {
                    name: "Emoji Commands",
                    value: ",steal - steals an emoji from a server. you can also rename it by typing the new name after the emoji",
                    inline: false
                },
            );
        message.channel.send({ embeds: [helpEmbed] });
    }

else if (content.startsWith(',steal')) {
    // Remove the command prefix part
    const argsString = content.slice(',steal'.length).trim();

    if (!argsString) {
        return message.reply('❌ Usage: `,steal <emoji> [new_name] [<emoji> [new_name] ...]`');
    }

    // Regex to find all emojis in the argsString
    const emojiRegexGlobal = /<(a?):(\w+):(\d+)>/g;

    // Extract emojis and their positions
    const emojis = [];
    let match;

    while ((match = emojiRegexGlobal.exec(argsString)) !== null) {
        emojis.push({
            full: match[0],
            animatedFlag: match[1],
            name: match[2],
            id: match[3],
            index: match.index
        });
    }

    if (emojis.length === 0) {
        return message.reply('❌ No valid emojis found.');
    }

    // Now extract optional names after each emoji based on positions

    const pairs = [];

    for (let i = 0; i < emojis.length; i++) {
        const currentEmoji = emojis[i];
        const start = currentEmoji.index + currentEmoji.full.length;
        const end = (i + 1 < emojis.length) ? emojis[i + 1].index : argsString.length;

        // Text between current emoji and next emoji (or end)
        const between = argsString.slice(start, end).trim();

        // Take first word as name if it exists
        const customName = between.split(/\s+/)[0] || null;

        pairs.push({
            emoji: currentEmoji.full,
            animatedFlag: currentEmoji.animatedFlag,
            originalName: currentEmoji.name,
            id: currentEmoji.id,
            customName: customName && customName.length > 0 ? customName : null
        });
    }

    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageEmojisAndStickers)) {
        return message.reply('❌ I need the **Manage Emojis and Stickers** permission to add emojis.');
    }

    const results = [];

    for (const { emoji, animatedFlag, originalName, id, customName } of pairs) {
        const isAnimated = animatedFlag === 'a';
        const ext = isAnimated ? 'gif' : 'png';
        const emojiURL = `https://cdn.discordapp.com/emojis/${id}.${ext}`;
        const finalName = customName || originalName;

        try {
            const response = await fetch(emojiURL);
            if (!response.ok) {
                results.push(`❌ Failed to fetch emoji: \`${originalName}\``);
                continue;
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            if (buffer.length > 256 * 1024) {
                results.push(`❌ Emoji too large: \`${originalName}\``);
                continue;
            }

            const createdEmoji = await message.guild.emojis.create({
                attachment: buffer,
                name: finalName
            });

            results.push(`✅ Added: <${isAnimated ? 'a' : ''}:${createdEmoji.name}:${createdEmoji.id}>`);
        } catch (err) {
            console.error(`Failed to steal emoji ${originalName}:`, err);
            results.push(`❌ Error adding \`${originalName}\`: ${err.message}`);
        }
    }

    return message.reply(results.join('\n'));
}
});

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);

// Start the dashboard web server
app.get('/', (req, res) => {
    if (!client.user) {
        return res.send("Bot is not ready yet.");
    }

    res.send(`
        <h1>🤖 ${client.user.tag} is online!</h1>
        <p>Connected to ${client.guilds.cache.size} servers.</p>
    `);
});

app.listen(port, () => {
    console.log(`🌐 Dashboard running on port ${port}`);
});
