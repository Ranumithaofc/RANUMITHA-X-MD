const { cmd } = require("../command");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

cmd({
    pattern: "csong",
    alias: ["chsong", "channelplay"],
    desc: "Send a YouTube song to WhatsApp Channel",
    category: "channel",
    react: "🎵",
    use: ".csong <song>/<channelJID>",
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {

    try {

        // Validate input 
        if (!q || !q.includes("/"))
            return reply("⚠️ Use format:\n.csong Shape of You/12036xxxx@newsletter");

        const [songName, channelJid] = q.split("/").map(a => a.trim());

        if (!channelJid.endsWith("@newsletter"))
            return reply("❌ Channel JID must end with @newsletter");

        // API request
        const api = await fetch(
            `https://api.nekolabs.my.id/downloader/youtube/play/v1?q=${encodeURIComponent(songName)}`
        );
        const data = await api.json();

        if (!data?.success)
            return reply("❌ Song not found.");

        const meta = data.result.metadata;
        const dlURL = data.result.downloadUrl;

        // Prepare temp folder
        const tempFolder = path.join(__dirname, "../temp");
        if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder);

        const mp3File = path.join(tempFolder, `${Date.now()}.mp3`);
        const opusFile = path.join(tempFolder, `${Date.now()}.opus`);

        // Download MP3 
        const audioRes = await fetch(dlURL);
        fs.writeFileSync(mp3File, Buffer.from(await audioRes.arrayBuffer()));

        // Convert to OPUS 
        await new Promise((resolve, reject) => {
            ffmpeg(mp3File)
                .audioCodec("libopus")
                .format("opus")
                .audioBitrate("64k")
                .save(opusFile)
                .on("end", resolve)
                .on("error", reject);
        });

        // Download thumbnail 
        let imageBuffer = null;
        try {
            const img = await fetch(meta.cover);
            imageBuffer = Buffer.from(await img.arrayBuffer());
        } catch {}

        // Caption 
        const caption = `🎶 *RANUMITHA-X-MD SONG SENDER*

🎧 *Title:* ${meta.title}
📀 *Channel:* ${meta.channel}
⏱ *Duration:* ${meta.duration}
🔗 *URL:* ${meta.url}

© Powered by RANUMITHA-X-MD 🌛`;

        // SEND TO CHANNEL (IMPORTANT FIX → bizMessage)
        await conn.sendMessage(
            channelJid,
            {
                image: imageBuffer,
                caption: caption,
            },
            {
                bizMessage: true     // ✔ REQUIRED FOR CHANNELS
            }
        );

        // SEND VOICE NOTE 
        await conn.sendMessage(
            channelJid,
            {
                audio: fs.readFileSync(opusFile),
                mimetype: "audio/ogg; codecs=opus",
                ptt: true
            },
            {
                bizMessage: true     // ✔ REQUIRED
            }
        );

        // Cleanup 
        fs.unlinkSync(mp3File);
        fs.unlinkSync(opusFile);

        reply(`✅ *Song sent successfully!*  
🎧 ${meta.title}  
📩 Channel: ${channelJid}`);

    } catch (e) {
        console.log("CSong ERROR:", e);
        reply("❌ Error while sending song to channel!");
    }
});
