const { cmd } = require("../command");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

// Fake vCard for quoting
const fakevCard = {
  key: {
    fromMe: false,
    participant: "0@s.whatsapp.net",
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "© Mr Hiruka",
      vcard: `BEGIN:VCARD
VERSION:3.0
FN:Ranumitha-X-MD
ORG:Meta AI;
TEL;type=CELL;type=VOICE;waid=0:0
END:VCARD`
    }
  }
};

cmd({
  pattern: "csong",
  alias: ["chsong", "channelplay"],
  react: "🍁",
  desc: "Send a YouTube song to a WhatsApp Channel (voice + details)",
  category: "channel",
  use: ".csong <song name>/<channel JID>",
  filename: __filename,
}, async (conn, mek, m, { from, reply, q }) => {
  try {

    // Validate input
    if (!q || !q.includes("/")) {
      return reply("⚠️ Use format:\n\n.csong Shape of You/1203630xxxxx@newsletter");
    }

    const [songName, channelJid] = q.split("/").map(x => x.trim());

    if (!channelJid.endsWith("@newsletter")) {
      return reply("❌ Invalid channel JID • Must end with @newsletter");
    }

    // Make temp folder if missing
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    // API Call
    const apiUrl = `https://api.nekolabs.my.id/downloader/youtube/play/v1?q=${encodeURIComponent(songName)}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data?.success || !data?.result?.downloadUrl) {
      return reply("❌ Song not found or API error.");
    }

    const meta = data.result.metadata;
    const dlUrl = data.result.downloadUrl;

    // Download thumbnail
    let imageBuffer = null;
    try {
      const img = await fetch(meta.cover);
      imageBuffer = Buffer.from(await img.arrayBuffer());
    } catch { imageBuffer = null; }

    // Caption message
    const caption = `🎶 *RANUMITHA-X-MD SONG SENDER* 🎶

🎧 *Title:* ${meta.title}
📀 *Channel:* ${meta.channel}
⏱ *Duration:* ${meta.duration}
🔗 *URL:* ${meta.url}

> © Powered by 𝗥𝗔𝗡𝗨𝗠𝗜𝗧𝗛𝗔-𝗫-𝗠𝗗 🌛`;

    // Send details to channel
    await conn.sendMessage(channelJid, {
      image: imageBuffer,
      caption
    }, { quoted: fakevCard });

    // Download MP3
    const mp3File = path.join(tempDir, `${Date.now()}.mp3`);
    const opusFile = path.join(tempDir, `${Date.now()}.opus`);

    const audioReq = await fetch(dlUrl);
    const audioBuf = Buffer.from(await audioReq.arrayBuffer());
    fs.writeFileSync(mp3File, audioBuf);

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

    const voice = fs.readFileSync(opusFile);

    // Send voice note to channel
    await conn.sendMessage(channelJid, {
      audio: voice,
      mimetype: "audio/ogg; codecs=opus",
      ptt: true,
    }, { quoted: fakevCard });

    // Clean temp
    fs.unlinkSync(mp3File);
    fs.unlinkSync(opusFile);

    reply(`✅ *Song sent successfully!*  
🎧 *${meta.title}*  
📩 *Channel:* ${channelJid}`);

  } catch (err) {
    console.log("CSong Error:", err);
    reply("⚠️ Error sending song! Check logs.");
  }
});
