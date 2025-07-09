const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const fetch = require('node-fetch');

// ✅ CONFIG
const MIN_AGE_DAYS = 3;
const PORT = 3000;
const SELF_PING_URL = "https://your-bot-name.onrender.com/"; // <- Replace this with your Render URL

// 🌐 EXPRESS SERVER
const app = express();
app.get("/", (req, res) => res.send("✅ BabyBlocker is alive"));
app.listen(PORT, () => console.log("🌍 Web server running!"));

// 🔁 SELF-PING to prevent sleeping
setInterval(() => {
  fetch(SELF_PING_URL)
    .then(() => console.log("🔁 Self-pinged"))
    .catch(err => console.error("❌ Ping error:", err));
}, 270000); // every 4.5 mins

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

  // Replace 'Unverified' and 'Member' role names with your server's role names
  const unverifiedRole = member.guild.roles.cache.find(role => role.name === "Unverified");
  const memberRole = member.guild.roles.cache.find(role => role.name === "Member");

  if (unverifiedRole && memberRole) {
    try {
      // Assign Unverified role
      await member.roles.add(unverifiedRole);
      
      // Check if user is older than the required number of days (e.g., 3 days)
      if (ageInDays >= MIN_AGE_DAYS) {
        // Remove Unverified role and assign Member role
        await member.roles.remove(unverifiedRole);
        await member.roles.add(memberRole);
        
        // Optionally send a success message
        await member.send("✅ Your account has been verified and you have been moved to the 'Member' role.");
      } else {
        // Send message if user is not verified yet
        await member.send(`❌ Your account is less than ${MIN_AGE_DAYS} days old. You must be at least ${MIN_AGE_DAYS} days old to access the server.`);
      }
    } catch (err) {
      console.error('Error while assigning roles:', err);
    }
  }
});

// 🚀 LOGIN TO DISCORD
client.login(process.env.BOT_TOKEN);

