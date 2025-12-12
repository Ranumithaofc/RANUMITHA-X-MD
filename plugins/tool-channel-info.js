const config = require('../config');
const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');

// Fake vCard
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
FN:Meta
ORG:META AI;
TEL;type=CELL;type=VOICE;waid=94762095304:+94762095304
END:VCARD`
        }
    }
};

cmd({
    pattern: "chinfo",
    alias: ["channelinfo"],
    react: "📡",
    desc: "Get WhatsApp Channel Information.",
    category: "general",
    use: ".chinfo <channel_jid | link>",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {

        // Check user input
        if (!args[0])
            return reply(
                "📡 *Please enter a Channel JID or Channel Link!*\n\nExample:\n.chinfo 120363299999999999@newsletter\n.chinfo https://whatsapp.com/channel/ABC123"
            );

        // Convert link → JID
        let jid = args[0];
        if (jid.includes("whatsapp.com/channel/")) {
            jid = jid.split("channel/")[1];
        }

        // Fetch channel metadata
        const data = await conn.newsletterMetadata(jid);

        if (!data)
            return reply("❌ *Invalid channel!* Please check link or JID again.");

        // Channel profile picture fallback
        const pp = data?.picture
            ? data.picture
            : "https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png";

        // Channel Info Message
        const txt = `*📡 WhatsApp Channel Information*\n
🧿 *Channel Name:* ${data.name || "N/A"}
🔗 *Channel Link:* https://whatsapp.com/channel/${jid}
🆔 *Channel JID:* ${jid}
👤 *Owner:* @${(data.owner || "").split("@")[0]}
👥 *Followers:* ${data.subscribers?.toLocaleString() || "0"}
📄 *Description:* ${data.description || "No description"}\n
> © Powered by 𝗥𝗔𝗡𝗨𝗠𝗜𝗧𝗛𝗔-𝗫-𝗠𝗗 🌛`;

        // Send channel info
        await conn.sendMessage(from, {
            image: { url: pp },
            caption: txt,
            mentions: [data.owner]
        }, { quoted: fakevCard });

    } catch (e) {
        console.log(e);
        reply("❌ *Error Occurred!*\n\n" + e.message);
    }
});
