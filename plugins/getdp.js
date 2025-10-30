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
        let name = "";
        let bio = "No about info available";
        let number = "N/A";

        // 1️⃣ If it's a group
        if (from.endsWith('@g.us')) {
            const groupMetadata = await conn.groupMetadata(from);
            name = groupMetadata.subject || "Group";
            bio = `Group with ${groupMetadata.participants.length} members`;

            try {
                ppUrl = await conn.profilePictureUrl(from, 'image');
            } catch {
                ppUrl = 'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png';
            }

        } else {
            // 2️⃣ Individual user
            let userJid = mek.message?.extendedTextMessage?.contextInfo?.participant || from;

            // Try to get saved contact name
            let contactName = "";
            try {
                const contacts = await conn.fetchContacts([userJid]);
                if (contacts && contacts.length > 0) {
                    contactName = contacts[0].name || contacts[0].notify || "";
                }
            } catch {}

            // Check if user exists on WhatsApp
            const [user] = await conn.onWhatsApp(userJid).catch(() => []);
            if (!user?.exists) return reply("❌ That contact is not registered on WhatsApp.");

            // Get profile picture
            try {
                ppUrl = await conn.profilePictureUrl(userJid, 'image');
            } catch {
                ppUrl = 'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png';
            }

            // Set name and number
            name = contactName || user?.notify || user?.name || mek.pushName || userJid.split('@')[0];
            number = `+${userJid.replace(/@.+/, '')}`; // Extract number

            // Fetch about/status
            try {
                const status = await conn.fetchStatus(userJid);
                if (status?.status) bio = status.status;
            } catch {}
        }

        // 3️⃣ Send result
        const caption = `*  PROFILE INFO\n\n📛 *Name:* ${name}\n📞 *Number:* ${number}\n💬 *About:* ${bio}\n\n> © Powered by 𝗥𝗔𝗡𝗨𝗠𝗜𝗧𝗛𝗔-𝗫-𝗠𝗗 🌛`.trim();

        await conn.sendMessage(from, {
            image: { url: ppUrl },
            caption
        }, { quoted: fakevCard });

    } catch (e) {
        console.error("getdp command error:", e);
        reply(`❌ Error: ${e.message || "Failed to get profile"}`);
    }
});
