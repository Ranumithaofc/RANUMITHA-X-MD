const { cmd } = require('../command');
const { getBuffer } = require('../lib/functions');

// Fake ChatGPT vCard
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
    pattern: "getdp",
    alias: ["targetdp", "getpp", "getprofile"],
    react: "🖼️",
    desc: "Get the WhatsApp profile picture, name, number, and about of the person or group",
    category: "utility",
    use: '.getdp',
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        let ppUrl;
        let caption = "";

        // 1️⃣ If it's a group
        if (from.endsWith('@g.us')) {
            const groupMetadata = await conn.groupMetadata(from);
            const name = groupMetadata.subject || "Group";
            const bio = `Group with ${groupMetadata.participants.length} members`;

            try {
                ppUrl = await conn.profilePictureUrl(from, 'image');
            } catch {
                ppUrl = 'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png';
            }

            caption = `* 👥GROUP INFO\n\n📛 *Name:* ${name}\n💬 *About:* ${bio}\n\n> © Powered by 𝗥𝗔𝗡𝗨𝗠𝗜𝗧𝗛𝗔-𝗫-𝗠𝗗 🌛`;

        } else {
            // 2️⃣ Individual chat (inbox)
            const userJid = from;

            try {
                ppUrl = await conn.profilePictureUrl(userJid, 'image');
            } catch {
                ppUrl = 'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png';
            }

            const number = `+${userJid.replace(/@.+/, '')}`;
            caption = `* 👤CONTACT INFO\n\n📞 *Number:* ${number}\n\n> © Powered by 𝗥𝗔𝗡𝗨𝗠𝗜𝗧𝗛𝗔-𝗫-𝗠𝗗 🌛`;
        }

        // Send profile picture with caption
        await conn.sendMessage(from, {
            image: { url: ppUrl },
            caption
        }, { quoted: fakevCard });

    } catch (e) {
        console.error("getdp command error:", e);
        reply(`❌ Error: ${e.message || "Failed to get profile"}`);
    }
});
