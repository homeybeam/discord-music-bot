require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const { Player } = require('discord-player');
const {
    SoundCloudExtractor,
    SpotifyExtractor,
    VimeoExtractor,
    ReverbnationExtractor,
    AppleMusicExtractor,
    AttachmentExtractor
} = require('@discord-player/extractor');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

const player = new Player(client);

// Register individual extractors
(async () => {
    await player.extractors.register(SoundCloudExtractor);
    await player.extractors.register(SpotifyExtractor);
    await player.extractors.register(VimeoExtractor);
    await player.extractors.register(ReverbnationExtractor);
    await player.extractors.register(AppleMusicExtractor);
    await player.extractors.register(AttachmentExtractor);
})();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const prefix = "!";
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (!message.content.startsWith(prefix)) return;

    const queue = player.nodes.get(message.guild.id);

    if (command === 'play') {
        const song = args.join(" ");
        if (!song) return message.reply("Please provide a song name or URL.");

        try {
            const queue = player.nodes.create(message.guild, {
                metadata: {
                    channel: message.channel
                }
            });

            await queue.connect(message.member.voice.channel);
            await queue.play(song);

            message.reply(`🎶 Playing: ${song}`);
        } catch (error) {
            console.error(error);
            message.reply("Something went wrong while trying to play the song.");
        }
    }

    if (command === 'pause') {
        if (!queue || !queue.node.isPlaying()) return message.reply("No music is currently playing.");
        queue.node.pause();
        message.reply("⏸️ Paused the music.");
    }

    if (command === 'resume') {
        if (!queue || queue.node.isPlaying()) return message.reply("Music is already playing.");
        queue.node.resume();
        message.reply("▶️ Resumed the music.");
    }

    if (command === 'skip') {
        if (!queue || !queue.node.isPlaying()) return message.reply("No music is currently playing.");
        queue.node.skip();
        message.reply("⏭️ Skipped the current track.");
    }

    if (command === 'queue') {
        if (!queue || !queue.tracks.toArray().length) return message.reply("The queue is empty.");
        const tracks = queue.tracks.toArray().map((track, i) => `${i + 1}. ${track.title}`);
        message.reply(`📃 Current Queue:
${tracks.join('\n')}`);
    }
});

client.login(process.env.BOT_TOKEN);
