const config = require('../config');
const { cmd } = require('../command');

// Fake vCard (same as before)
const fakevCard = {
  key: { fromMe: false, participant: "0@s.whatsapp.net", remoteJid: "status@broadcast" },
  message: { contactMessage: { displayName: "© Mr Hiruka", vcard: `BEGIN:VCARD
VERSION:3.0
FN:Meta
ORG:META AI;
TEL;type=CELL;type=VOICE;waid=94762095304:+94762095304
END:VCARD` } }
};

cmd({
  pattern: "chinfo",
  alias: ["channelinfo"],
  react: "📡",
  desc: "Get WhatsApp Channel Information.",
  category: "general",
  use: ".chinfo <jid | link>",
  filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
  try {
    if (!args[0]) return reply("📡 *Enter a Channel Link or JID!*\n\nExample:\n.chinfo https://whatsapp.com/channel/ABCDeF");

    // Normalize input to JID (either raw jid or link)
    let jid = args[0];
    if (jid.includes("whatsapp.com/channel/")) jid = jid.split("channel/")[1];

    // Try multiple methods in safe order
    let data = null;
    // 1) if newsletterMetadataV2 exists, use it
    if (typeof conn.newsletterMetadataV2 === "function") {
      try { data = await conn.newsletterMetadataV2(jid); }
      catch (e) { console.log("newsletterMetadataV2 failed:", e?.message || e); }
    }

    // 2) fallback to older newsletterMetadata if available
    if (!data && typeof conn.newsletterMetadata === "function") {
      try { data = await conn.newsletterMetadata(jid); }
      catch (e) { console.log("newsletterMetadata failed:", e?.message || e); }
    }

    // 3) If still no data, try common alternate method names (some forks use different names)
    if (!data) {
      const altCandidates = ["getNewsletter", "newsletterGet", "fetchNewsletter", "newsletterInfo"];
      for (const fn of altCandidates) {
        if (typeof conn[fn] === "function") {
          try { data = await conn[fn](jid); break; }
          catch (e) { console.log(`${fn} failed:`, e?.message || e); }
        }
      }
    }

    // 4) final fallback: no supported method found — helpful error
    if (!data) {
      const installed = (conn && conn.constructor && conn.constructor.name) ? conn.constructor.name : "Baileys";
      return reply(
        `❌ *Could not fetch Channel metadata.*\n\n` +
        `Reason: your WhatsApp client (${installed}) doesn't expose a compatible "newsletter" metadata method.\n\n` +
        `What to do:\n` +
        `• Update your Baileys / WhatsApp library to the latest release.\n` +
        `• Or install a fork that supports channels (examples: @dannteam/baileys or baileys-pro) and retry.\n\n` +
        `If you want, send me the output of: \n\`console.log(Object.keys(conn))\` \nso I can tell which methods exist.`
      );
    }

    // Build response from data (attempt to cover different shape variants)
    const pic = data.picture || data.profilePicUrl || data.thumbnail || "https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png";
    const name = data.name || data.title || data.displayName || "N/A";
    const owner = data.owner || data.creator || data.admin || "";
    const subs = (typeof data.subscribers !== "undefined") ? data.subscribers :
                 (typeof data.followers !== "undefined") ? data.followers : null;
    const desc = data.description || data.desc || data.about || "No description";

    const txt = `*📡 WhatsApp Channel Information*\n\n` +
      `🧿 *Name:* ${name}\n` +
      `🔗 *Link:* https://whatsapp.com/channel/${jid}\n` +
      `🆔 *JID:* ${jid}\n` +
      `👤 *Owner:* ${owner ? "@" + owner.split("@")[0] : "N/A"}\n` +
      `👥 *Followers:* ${subs !== null ? Number(subs).toLocaleString() : "N/A"}\n` +
      `📄 *Description:* ${desc}\n\n` +
      `> © Powered by 𝗥𝗔𝗡𝗨𝗠𝗜𝗧𝗛𝗔-𝗫-𝗠𝗗 🌛`;

    // Mentions array only if owner looks like a JID
    const mentions = owner && owner.includes("@") ? [owner] : [];

    await conn.sendMessage(from, {
      image: { url: pic },
      caption: txt,
      mentions
    }, { quoted: fakevCard });

  } catch (e) {
    console.log("chinfo catch:", e);
    reply("❌ *Error Occurred!*\n\n" + (e && e.message ? e.message : String(e)));
  }
});
