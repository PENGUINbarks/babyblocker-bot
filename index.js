const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// ✅ CONFIG
const MIN_AGE_DAYS = 3;
const PORT = process.env.PORT || 3000;
const SELF_PING_URL = "https://babyblocker.onrender.com/"; // <- Replace with your actual Render URL

// 🌐 EXPRESS SERVER
const app = express();

app.get("/", (req, res) => res.send("✅ BabyBlocker is alive"));

app.listen(PORT, () => console.log("🌍 Web server running on port", PORT));

// 🔁 SELF-PING to prevent sleeping
setInterval(() => {
  console.log("📡 Attempting to ping...");
  fetch(SELF_PING_URL)
    .then(() => console.log("🔁 Self-pinged ✅"))
    .catch(err => console.error("❌ Ping error:", err));
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
        await member.send(`❌ Your account is only ${rounded} days old. You need to wait until your account is at least ${MIN_AGE_DAYS} days old to access the server.`);
      }
    } catch (err) {
      console.error("❌ Error handling member join:", err);
    }
  } else {
    console.log("⚠️ Role 'Unverified' or 'Member' not found.");
  }
});

// 🚀 LOGIN TO DISCORD
client.login(process.env.BOT_TOKEN);
