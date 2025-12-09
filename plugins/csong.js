const { cmd } = require("../command");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

// FIXED fake vCard (important for channels)
const fakevCard = {
  key: {
    fromMe: false,
    participant: "0@s.whatsapp.net",
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "RANUMITHA-X-MD",
      vcard: `BEGIN:VCARD
VERSION:3.0
FN:RANUMITHA-X-MD
ORG:Meta AI;
TEL;type=CELL;waid=0:0
END:VCARD`
    }
  }
};

cmd({
  pattern: "csong",
  alias: ["chsong", "channelplay"],
  react: "🎵",
  desc: "Send a YouTube song to a WhatsApp Channel (voice + details)",
  category: "channel",
  use: ".csong <song>/<channel jid>",
  filename: __filename,
}, async (conn, mek, m, { from, reply, q }) => {
  try {
    if (!q.includes("/"))
      return reply("⚠️ Use: .csong Shape of you/1203xxxx@newsletter");

    let [songName, channelJid] = q.split("/").map(a => a.trim());

    if (!channelJid.endsWith("@newsletter"))
      return reply("❌ Channel JID must end with @newsletter");

    // ---- API CALL ----
    const api = await fetch(
      `https://api.nekolabs.my.id/downloader/youtube/play/v1?q=${encodeURIComponent(songName)}`
    );
    const data = await api.json();

    if (!data.success) return reply("❌ Song not found.");

    const meta = data.result.metadata;
    const dl = data.result.downloadUrl;

    // ---- PREP TEMP ----
    const temp = path.join(__dirname, "../temp");
    if (!fs.existsSync(temp)) fs.mkdirSync(temp);

    const mp3 = path.join(temp, `${Date.now()}.mp3`);
    const opus = path.join(temp, `${Date.now()}.opus`);

    // ---- DOWNLOAD AUDIO ----
    const aud = await fetch(dl);
    fs.writeFileSync(mp3, Buffer.from(await aud.arrayBuffer()));

    // ---- CONVERT TO OPUS ----
    await new Promise((resolve, reject) => {
      ffmpeg(mp3)
        .audioCodec("libopus")
        .format("opus")
        .audioBitrate("64k")
        .save(opus)
        .on("end", resolve)
        .on("error", reject);
    });

    // ---- DOWNLOAD THUMB ----
    let imageBuffer = null;
    try {
      const im = await fetch(meta.cover);
      imageBuffer = Buffer.from(await im.arrayBuffer());
    } catch {}

    const caption = `🎶 *RANUMITHA-X-MD SONG SENDER*

🎧 *Title:* ${meta.title}
📀 *Channel:* ${meta.channel}
⏱ *Duration:* ${meta.duration}
🔗 *URL:* ${meta.url}`;

    // ---- SEND DETAILS TO CHANNEL ----
    await conn.sendMessage(
      channelJid,
      {
        image: imageBuffer,
        caption
      },
      {
        quoted: fakevCard,
        messageId: "newsletter"   // 🔥 IMPORTANT FIX
      }
    );

    // ---- SEND VOICE FILE ----
    await conn.sendMessage(
      channelJid,
      {
        audio: fs.readFileSync(opus),
        mimetype: "audio/ogg; codecs=opus",
        ptt: true
      },
      {
        quoted: fakevCard,
        messageId: "newsletter"   // 🔥 IMPORTANT FIX
      }
    );

    fs.unlinkSync(mp3);
    fs.unlinkSync(opus);

    reply("✅ *Song sent successfully to channel!*");

  } catch (err) {
    console.log("CSong ERROR:", err);
    reply("❌ Sending failed! Check console.");
  }
});
