const config = require('../config')
const { cmd, commands } = require('../command')
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('../lib/functions')

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
    pattern: "ginfo",
    react: "🥏",
    alias: ["groupinfo"],
    desc: "Get group informations.",
    category: "group",
    use: '.ginfo',
    filename: __filename
},
async (conn, mek, m, { from, quoted, isGroup, sender, participants, reply, isBotAdmins, isAdmins, isDev }) => {
    try {
        const msr = (await fetchJson('https://raw.githubusercontent.com/KNIGHT-MD-V1/DARK-KNIGHT-XMD/refs/heads/main/MSG/mreply.json')).replyMsg

        if (!isGroup) return reply(msr.only_gp)
        if (!isAdmins && !isDev) return reply(msr.you_adm)
        if (!isBotAdmins) return reply(msr.give_adm)

        const ppUrls = [
            'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
            'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
            'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
        ];

        let ppUrl;
        try {
            ppUrl = await conn.profilePictureUrl(from, 'image');
        } catch {
            ppUrl = ppUrls[Math.floor(Math.random() * ppUrls.length)];
        }

        const metadata = await conn.groupMetadata(from);
        const groupAdmins = participants.filter(p => p.admin);
        const listAdmin = groupAdmins.length
            ? groupAdmins.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n')
            : "No admins found";

        // Handle missing owner safely
        const owner = metadata.owner
            ? `@${metadata.owner.split('@')[0]}`
            : "Not available";

        const gdata = `*「 Group Information 」*\n
*Group Name:* ${metadata.subject}
*Group ID:* ${metadata.id}
*Participant Count:* ${metadata.size}
*Group Creator:* ${owner}
*Group Description:* ${metadata.desc?.toString() || 'No description'}\n
*Group Admins:*\n${listAdmin}\n
> © Powered by 𝗥𝗔𝗡𝗨𝗠𝗜𝗧𝗛𝗔-𝗫-𝗠𝗗 🌛`;

        await conn.sendMessage(from, {
            image: { url: ppUrl },
            caption: gdata,
            mentions: participants.map(v => v.id)
        }, { quoted: fakevCard });

    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.log(e);
        reply(`❌ *Error Occurred !!*\n\n${e.message}`);
    }
});
