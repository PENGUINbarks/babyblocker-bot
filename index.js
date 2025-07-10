import { Client, GatewayIntentBits } from 'discord.js';
import express from 'express';
import fetch from 'node-fetch';

// ✅ CONFIG
const MIN_AGE_DAYS = 3;
const PORT = process.env.PORT || 3000;
const SELF_PING_URL = "https://babyblocker-bot-1.onrender.com/"; // REPLACE WITH YOUR FINAL RENDER URL

// 🌐 EXPRESS SERVER
const app = express();
app.get("/", (req, res) => res.send("✅ BabyBlocker is alive"));
app.listen(PORT, () => console.log("🌍 Web server running on port", PORT));

// 🔁 SELF-PING to prevent Render sleeping
setInterval(async () => {
  console.log("📡 Attempting to ping...");
  try {
    await fetch(SELF_PING_URL);
    console.log("🔁 Self-pinged ✅");
  } catch (err) {
    console.error("❌ Ping error:", err.message);
  }
}, 270000); // every 4.5 minutes

// 🤖 DISCORD BOT SETUP
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('guildMemberAdd', async member => {
  const createdAt = member.user.createdAt;
  const now = new Date();
  const ageInDays = (now - createdAt) / (1000 * 60 * 60 * 24);
  const rounded = ageInDays.toFixed(2);

  const unverifiedRole = member.guild.roles.cache.find(role => role.name === "Unverified");
  const memberRole = member.guild.roles.cache.find(role => role.name === "Member");

  if (unverifiedRole && memberRole) {
    try {
      await member.roles.add(unverifiedRole);

      if (ageInDays >= MIN_AGE_DAYS) {
        await member.roles.remove(unverifiedRole);
        await member.roles.add(memberRole);
        await member.send("✅ Your account has been verified and you have been moved to the 'Member' role.");
      } else {
        await member.send(`❌ Your account is only ${rounded} days old. You must wait at least ${MIN_AGE_DAYS} days to access the server.`);
      }
    } catch (err) {
      console.error("❌ Error handling member join:", err);
    }
  } else {
    console.log("⚠️ Role 'Unverified' or 'Member' not found.");
  }
});

// 💥 Catch crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 Unhandled Rejection:', reason);
});

// 🔐 LOGIN TO DISCORD
client.login(process.env.BOT_TOKEN);
