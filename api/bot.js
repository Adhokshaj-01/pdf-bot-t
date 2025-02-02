import { Telegraf } from "telegraf";
import fs from 'fs'
import {TOKEN} from '../src/config.js'
import {compress} from '../src/functions/compress.js'
import path from "path";
import fetch from "node-fetch";
import { fileURLToPath } from 'url';

// Use import.meta.url to replicate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bot = new Telegraf(TOKEN);

// Path for the user.json file
const clientDir = path.join(__dirname, 'client');
const userJsonPath = path.join(clientDir, 'user.json');

// Ensure the client directory and user.json file exist
if (!fs.existsSync(clientDir)) {
  fs.mkdirSync(clientDir);  // Create the client directory if it doesn't exist
}

if (!fs.existsSync(userJsonPath)) {
  fs.writeFileSync(userJsonPath, JSON.stringify([]));  // Create user.json if it doesn't exist
}

// Store the user's command temporarily
let userCommand = {};

const downloadDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir);
}

bot.start((ctx) => {
  const user = ctx.message.from;
  console.log('User Details 🔥 -', user);

  const username = ctx.message.from.username || ctx.message.from.first_name;
  ctx.reply(`
    Welcome, ${username}, 🤖 I'm your PDF bot ! 
    I can help you with:
    /compress : Compress a PDF 🔥
    - Send me any PDF, and I'll assist you with it!`);

  // Check if user exists in user.json and add if not
  const userId = ctx.message.from.id;
  addUserToJson(userId, username);
});

// Compress PDF command
bot.command('compress', (ctx) => {
  userCommand[ctx.from.id] = 'compress'; // Store user's command
  ctx.reply("Send me the PDF you want to compress, and I'll take care of the rest! 💥");
});

// Function to add user to the JSON file
function addUserToJson(userId, username) {
  const users = JSON.parse(fs.readFileSync(userJsonPath, 'utf8'));

  // Check if the user already exists
  const userExists = users.some(user => user.id === userId);

  if (!userExists) {
    // Add new user if not exists
    users.push({ id: userId, username: username });
    fs.writeFileSync(userJsonPath, JSON.stringify(users, null, 2)); // Save back to user.json
    console.log(`Added new user: ${username}`);
  } else {
    console.log(`User ${username} already exists.`);
  }
}

bot.on("document", async (ctx) => {
  const file = ctx.message.document;
  if (!file.mime_type?.includes("pdf")) {
    return ctx.reply("Please send a valid PDF file.");
  }

  const fileId = file.file_id;
  const fileUrl = await ctx.telegram.getFileLink(fileId);
  const inputPath = `./downloads/${file.file_name}`;

  const response = await fetch(fileUrl.href);
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(inputPath, Buffer.from(buffer));

  // Get the stored command for the user
  const command = userCommand[ctx.from.id];

  // Check command from user and process accordingly
  if (command === "compress") {
    // Compress the PDF
    ctx.reply("Processing your PDF...");
    const compressedFilePath = path.join(downloadDir, `compressed_${file.file_name}`);
    await compress(inputPath, compressedFilePath);
    ctx.replyWithDocument({ source: compressedFilePath }, { caption: "Here is your compressed PDF!" });
  } else {
    ctx.reply("Please send a valid command. Use /compress.");
  }
});

bot.launch();
console.log("Bot is running...");
