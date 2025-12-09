const { cmd } = require("../command");
const fetch = require("node-fetch");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

cmd({
  pattern: "csong",
  alias: ["chsong", "sendchannel"],
  react: "🎧",
  desc: "Send a song directly to a WhatsApp channel/jid",
  category: "download",
  use: ".csong <jid> <song name>",
  filename: __filename,
},

async (conn, mek, m, { from, q, reply }) => {
  try {

    if (!q) return reply("⚠️ Usage:\n.csong <jid> <song name>");

    const args = q.split(" ");
    const targetJid = args.shift(); // First part = JID
    const query = args.join(" ");

    if (!targetJid.includes("@")) {
      return reply("❌ Invalid JID! Example:\n.csong 12036302xxx@g.us Alone");
    }

    if (!query) return reply("⚠️ Please enter a song name.");

    // SEARCH SONG
    const apiUrl = `https://api.nekolabs.my.id/downloader/youtube/play/v1?q=${encodeURIComponent(query)}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data?.success) return reply("❌ Song not found.");

    const meta = data.result.metadata;
    const downloadUrl = data.result.downloadUrl;

    // Thumbnail download
    let thumb = null;
    try {
      const t = await fetch(meta.cover);
      thumb = Buffer.from(await t.arrayBuffer());
    } catch { }

    // Send Song Info to Channel
    const infoMsg = `
🎶 *New Song Received!* 🎶

📌 *Title:* ${meta.title}
📡 *Channel:* ${meta.channel}
⏱ *Duration:* ${meta.duration}

🔗 *URL:* ${meta.url}

Uploaded by: *Ranumitha-X-MD*
`;

    await conn.sendMessage(targetJid, {
      image: thumb,
      caption: infoMsg
    });

    // Convert to PTT (Voice Note)
    const tempMp3 = path.join(__dirname, "../temp/" + Date.now() + ".mp3");
    const tempOpus = path.join(__dirname, "../temp/" + Date.now() + ".opus");

    const audioRes = await fetch(downloadUrl);
    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
    fs.writeFileSync(tempMp3, audioBuffer);

    await new Promise((resolve, reject) => {
      ffmpeg(tempMp3)
        .audioCodec("libopus")
        .format("opus")
        .audioBitrate("64k")
        .save(tempOpus)
        .on("end", resolve)
        .on("error", reject);
    });

    const voiceBuffer = fs.readFileSync(tempOpus);

    // Send audio as Voice Note
    await conn.sendMessage(targetJid, {
      audio: voiceBuffer,
      ptt: true,
      mimetype: "audio/ogg; codecs=opus"
    });

    fs.unlinkSync(tempMp3);
    fs.unlinkSync(tempOpus);

    reply("✔️ Successfully sent song to the channel!");

  } catch (err) {
    console.error(err);
    reply("⚠️ Error sending song.");
  }
});
