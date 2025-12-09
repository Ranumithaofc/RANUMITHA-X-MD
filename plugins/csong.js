const { cmd } = require("../command");
const fetch = require("node-fetch");

cmd({
  pattern: "csong",
  alias: ["cs", "channelsong"],
  react: "🎧",
  desc: "Search YouTube Channel Songs & Download",
  category: "download",
  use: ".csong <channel/song name>",
  filename: __filename,
},

async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) return reply("⚠️ Please enter channel or song name.");

    // API call
    const apiUrl = `https://api.nekolabs.my.id/search/youtube?q=${encodeURIComponent(q)}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data?.success || !data?.result?.length) {
      return reply("❌ No songs found.");
    }

    const results = data.result.slice(0, 10); 

    let listText = `🎧 *YouTube Songs Found*\n\n🔍 *Search:* ${q}\n\n👇 *Reply with number to download*\n\n`;

    results.forEach((song, i) => {
      listText += `${i + 1}. *${song.title}*\n   ⏱ ${song.duration}\n   📺 ${song.author}\n\n`;
    });

    const sent = await conn.sendMessage(from, { text: listText });
    const messageID = sent.key.id;

    // Listener
    conn.ev.on("messages.upsert", async (msgUp) => {
      try {
        const msg = msgUp.messages[0];
        if (!msg.message) return;

        const txt = msg.message.conversation || msg.message.extendedTextMessage?.text;

        const isReply = msg?.message?.extendedTextMessage?.contextInfo?.stanzaId === messageID;
        if (!isReply) return;

        const index = Number(txt.trim()) - 1;
        if (isNaN(index) || !results[index]) {
          return reply("❌ Invalid number.");
        }

        const selected = results[index];

        await conn.sendMessage(from, {
          react: { text: "⬇️", key: msg.key },
        });

        // Download Audio
        const dlApi = `https://api.nekolabs.my.id/downloader/youtube/play/v1?q=${encodeURIComponent(selected.url)}`;
        const dlRes = await fetch(dlApi);
        const dlData = await dlRes.json();

        if (!dlData?.success) return reply("❌ Failed to download audio.");

        await conn.sendMessage(
          from,
          {
            audio: { url: dlData.result.downloadUrl },
            mimetype: "audio/mpeg",
            fileName: `${selected.title}.mp3`,
          },
          { quoted: mek }
        );

        await conn.sendMessage(from, {
          react: { text: "✔️", key: msg.key },
        });

      } catch (e) {
        console.error(e);
      }
    });

  } catch (err) {
    console.error(err);
    return reply("⚠️ Error while searching songs.");
  }
});
