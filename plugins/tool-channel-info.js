const config = require('../config');
const { cmd } = require('../command');

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
    use: ".chinfo <jid | link>",
    filename: __filename
},
async (conn, mek, m, { from, args, reply }) => {
    try {

        if (!args[0])
            return reply("📡 *Enter a Channel Link or JID!*\n\nExample:\n.chinfo https://whatsapp.com/channel/ABCDeF");

        // Convert link → JID
        let jid = args[0];
        if (jid.includes("whatsapp.com/channel/")) {
            jid = jid.split("channel/")[1];
        }

        // FIXED: use V2 API
        const data = await conn.newsletterMetadataV2(jid);

        if (!data)
            return reply("❌ *Invalid Channel! Check JID/Link again.*");

        const pp = data.picture || 
        "https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png";

        const txt = `*📡 WhatsApp Channel Information*\n
🧿 *Name:* ${data.name || "N/A"}
🔗 *Link:* https://whatsapp.com/channel/${jid}
🆔 *JID:* ${jid}
👤 *Owner:* @${(data.owner || "").split("@")[0]}
👥 *Followers:* ${data.subscribers ? data.subscribers.toLocaleString() : "0"}
📄 *Description:* ${data.description || "No description"}\n
> © Powered by 𝗥𝗔𝗡𝗨𝗠𝗜𝗧𝗛𝗔-𝗫-𝗠𝗗`;

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
