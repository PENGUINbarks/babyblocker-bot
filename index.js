// ✅ BabyBlocker Bot — Final Version
const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// ⏱️ CONFIGURATION
const MIN_AGE_DAYS = 3;
const PORT = 3000;
const SELF_PING_URL = "https://babyblocker.onrender.com/"; // <--- Replace this with your Render.com URL

// 🌐 EXPRESS SERVER FOR UPTIME
const app = express();
app.get("/", (req, res) => res.send("✅ BabyBlocker is running"));
app.listen(PORT, () => console.log("🌍 Web server running on port", PORT));

// 🔁 SELF-PINGING TO PREVENT SLEEP
const ping = () => {
  console.log("📡 Attempting to ping...");
  fetch(SELF_PING_URL)
    .then(() => console.log("🔁 Self-pinged ✅"))
    .catch(err => console.error("❌ Ping error:", err));
};
setInterval(ping, 270000); // Every 4.5 minutes
ping(); // First ping right away

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

  console.log(`👤 ${member.user.tag} joined | Account age: ${rounded} days`);

  const unverifiedRole = member.guild.roles.cache.find(role => role.name === "Unverified");

  // Add Unverified role on join
  if (unverifiedRole) {
    try {
      await member.roles.add(unverifiedRole);
      console.log(`🟡 Added Unverified role to ${member.user.tag}`);
    } catch (err) {
      console.warn(`⚠️ Could not add Unverified role: ${err.message}`);
    }
  }

  // Kick if account too new
  if (ageInDays < MIN_AGE_DAYS) {
    try {
      await member.send(`🚫 Your account is too new. Please try again after ${MIN_AGE_DAYS} days.`);
    } catch (err) {
      console.warn(`⚠️ Could not DM ${member.user.tag}: ${err.message}`);
    }

    setTimeout(async () => {
      try {
        await member.kick("Account too new");
        console.log(`❌ Kicked ${member.user.tag}`);
      } catch (err) {
        console.error(`🚫 Kick failed: ${err.message}`);
      }
    }, 2000);
  } else {
    // Remove Unverified role if verified
    if (unverifiedRole) {
      try {
        await member.roles.remove(unverifiedRole);
        console.log(`✅ Removed Unverified role from ${member.user.tag}`);
      } catch (err) {
        console.warn(`⚠️ Could not remove Unverified role: ${err.message}`);
      }
    }
  }
});

// 🧠 LOGIN BOT
client.login(process.env.BOT_TOKEN);

// 🛡️ CRASH PROTECTION
process.on("unhandledRejection", err => console.error("❗ Unhandled Rejection:", err));
process.on("uncaughtException", err => console.error("❗ Uncaught Exception:", err));
