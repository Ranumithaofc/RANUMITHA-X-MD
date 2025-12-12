const config = require('../config');
const { cmd } = require('../command');

// Auto-detecting chinfo command (paste into your command registration area)
cmd({
  pattern: "chinfo",
  react: "📡",
  desc: "Auto chinfo (tries multiple methods)",
  filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
  try {
    if (!args[0]) return reply("Use: .chinfo <channel_jid_or_link>");

    let jid = args[0];
    if (jid.includes("whatsapp.com/channel/")) jid = jid.split("channel/")[1];

    // candidate method names (in order)
    const candidates = [
      "newsletterMetadataV2",
      "newsletterMetadata",
      "getNewsletter",
      "newsletterGet",
      "fetchNewsletter",
      "getNewsletterMetadata",
      "newsletterInfo"
    ];

    let data = null, used = null;
    for (const fn of candidates) {
      if (typeof conn[fn] === "function") {
        try {
          data = await conn[fn](jid);
          used = fn;
          break;
        } catch (e) {
          console.log(`${fn} failed:`, e && e.message ? e.message : e);
        }
      }
    }

    if (!data) {
      return reply(
        `❌ Could not fetch Channel metadata. No supported newsletter method found on conn.\n\n` +
        `Run console.log(Object.keys(conn)) and paste output here, or update your Baileys/fork.`
      );
    }

    const pic = data.picture?.url || data.picture?.directPath || data.profilePicUrl || "https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png";
    const name = data.name || data.title || "N/A";
    const owner = data.owner || data.creator || "";
    const subs = data.subscribers ?? data.followers ?? "N/A";
    const desc = data.description || data.desc || "No description";

    const txt = `*📡 Channel Info (via ${used})*\n\n` +
                `*Name:* ${name}\n` +
                `*Link:* https://whatsapp.com/channel/${jid}\n` +
                `*JID:* ${jid}\n` +
                `*Owner:* ${owner ? '@' + owner.split('@')[0] : 'N/A'}\n` +
                `*Followers:* ${typeof subs === 'number' ? subs.toLocaleString() : subs}\n` +
                `*Description:* ${desc}`;

    await conn.sendMessage(from, { image: { url: pic }, caption: txt, mentions: owner ? [owner] : [] }, { quoted: m });
  } catch (err) {
    console.log("chinfo auto error:", err);
    reply("❌ Error: " + (err && err.message ? err.message : String(err)));
  }
});
