
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { Player } = require("discord-player");
const { SpotifyExtractor } = require("@discord-player/extractor");
const express = require("express");

// Create a minimal Express server
const app = express();
const PORT = process.env.PORT || 3000;

// Keep-alive route
app.get("/", (req, res) => {
  res.send("Bot is alive!");
});

// Start Express server
app.listen(PORT, () => {
  console.log(`Keep-alive server running on port ${PORT}`);
});

// Discord bot setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

const player = new Player(client);

// Register extractors (like Spotify)
player.extractors.register(SpotifyExtractor, {});

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!")) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "play") {
    if (!args.length) return message.reply("You need to provide a song name or URL!");
    const query = args.join(" ");

    const channel = message.member?.voice?.channel;
    if (!channel) return message.reply("Join a voice channel first!");

    const { track } = await player.play(channel, query, {
      nodeOptions: {
        metadata: message,
      },
    });

    message.reply(`🎶 Now playing: **${track.title}**`);
  }

  if (command === "skip") {
    const queue = player.nodes.get(message.guild.id);
    if (!queue) return message.reply("No song is playing.");
    queue.node.skip();
    message.reply("⏭️ Skipped!");
  }

  if (command === "stop") {
    const queue = player.nodes.get(message.guild.id);
    if (!queue) return message.reply("Nothing to stop.");
    queue.node.stop();
    message.reply("⏹️ Stopped playback.");
  }
});

client.login(process.env.DISCORD_TOKEN);
