require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const { Player } = require("discord-player");
const { DefaultExtractors } = require("@discord-player/extractor");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const player = new Player(client);

(async () => {
    await player.extractors.loadMulti(DefaultExtractors);
})();

client.once("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
    if (!message.guild || message.author.bot) return;

    const args = message.content.trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === "!play") {
        if (!args[0]) return message.channel.send("Please provide a song name or URL.");
        const query = args.join(" ");
        const res = await player.search(query, {
            requestedBy: message.author
        });

        if (!res || !res.tracks.length) return message.channel.send("No results found.");

        const queue = await player.nodes.create(message.guild, {
            metadata: {
                channel: message.channel
            }
        });

        try {
            if (!queue.connection) await queue.connect(message.member.voice.channel);
        } catch {
            player.nodes.delete(message.guild.id);
            return message.channel.send("Could not join your voice channel!");
        }

        queue.addTrack(res.tracks[0]);
        if (!queue.node.isPlaying()) await queue.node.play();
        message.channel.send(`🎶 Now playing **${res.tracks[0].title}**`);
    }

    if (command === "!skip") {
        const queue = player.nodes.get(message.guild.id);
        if (!queue || !queue.node.isPlaying()) return message.channel.send("Nothing is playing.");
        queue.node.skip();
        message.channel.send("⏭ Skipped.");
    }

    if (command === "!stop") {
        const queue = player.nodes.get(message.guild.id);
        if (!queue) return message.channel.send("Nothing to stop.");
        queue.delete();
        message.channel.send("⏹️ Stopped and disconnected.");
    }

    if (command === "!pause") {
        const queue = player.nodes.get(message.guild.id);
        if (!queue || !queue.node.isPlaying()) return message.channel.send("Nothing is playing.");
        queue.node.pause();
        message.channel.send("⏸ Paused.");
    }

    if (command === "!resume") {
        const queue = player.nodes.get(message.guild.id);
        if (!queue || queue.node.isPlaying()) return message.channel.send("Nothing is paused.");
        queue.node.resume();
        message.channel.send("▶️ Resumed.");
    }

    if (command === "!queue") {
        const queue = player.nodes.get(message.guild.id);
        if (!queue || !queue.tracks.size) return message.channel.send("Queue is empty.");
        const tracks = queue.tracks.toArray().slice(0, 5).map((track, i) => `${i + 1}. ${track.title}`);
        message.channel.send(`🎶 **Current Queue**:
${tracks.join("\n")}`);
    }

    if (command === "!help") {
        message.channel.send(`📜 **Available Commands:**\n
- \`!play [song name or URL]\`
- \`!skip\`
- \`!stop\`
- \`!pause\`
- \`!resume\`
- \`!queue\`
- \`!help\``);
    }
});

client.login(process.env.TOKEN);