import TelegramBot from 'node-telegram-bot-api';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;

let bot: TelegramBot | null = null;

if (BOT_TOKEN) {
  bot = new TelegramBot(BOT_TOKEN, { polling: true });

  // Start command
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from?.first_name || 'User';
    
    const welcomeMessage = `🛍️ Welcome to TeleShop, ${firstName}!

Your premium e-commerce experience awaits. Browse products, manage your wallet, and track your purchases - all within Telegram!

✨ Features:
• 🛒 Browse & purchase products
• 💰 Digital wallet management  
• 📊 Transaction history
• 🔐 Secure payments

Tap the button below to start shopping!`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🚀 Open TeleShop',
            web_app: { url: WEBAPP_URL }
          }
        ],
        [
          { text: '🛍️ Store', callback_data: 'store' },
          { text: '💰 Wallet', callback_data: 'wallet' }
        ],
        [
          { text: '📞 Help', callback_data: 'help' }
        ]
      ]
    };

    bot?.sendMessage(chatId, welcomeMessage, {
      reply_markup: keyboard,
      parse_mode: 'HTML'
    });
  });

  // Store command
  bot.onText(/\/store/, (msg) => {
    const chatId = msg.chat.id;
    
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🛍️ Browse Products',
            web_app: { url: `${WEBAPP_URL}?tab=store` }
          }
        ]
      ]
    };

    bot.sendMessage(chatId, '🛍️ <b>Welcome to our Store!</b>\n\nDiscover amazing products at great prices. Tap below to start browsing!', {
      reply_markup: keyboard,
      parse_mode: 'HTML'
    });
  });

  // Wallet command
  bot.onText(/\/wallet/, (msg) => {
    const chatId = msg.chat.id;
    
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '💰 Open Wallet',
            web_app: { url: `${WEBAPP_URL}?tab=wallet` }
          }
        ]
      ]
    };

    bot.sendMessage(chatId, '💰 <b>Your Digital Wallet</b>\n\nManage your balance, add funds, and view transaction history.', {
      reply_markup: keyboard,
      parse_mode: 'HTML'
    });
  });

  // Admin command - restricted access to admin panel
  bot.onText(/\/admin/, (msg) => {
    const chatId = msg.chat.id;
    
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🔐 Admin Login',
            web_app: { url: `${WEBAPP_URL}/admin` }
          }
        ]
      ]
    };

    bot?.sendMessage(chatId, '🔐 <b>Admin Panel Access</b>\n\nAccess the admin dashboard to manage products, users, and system settings.\n\n⚠️ <i>This area is restricted to authorized administrators only.</i>', {
      reply_markup: keyboard,
      parse_mode: 'HTML'
    });
  });

  // Help command
  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    
    const helpMessage = `🆘 <b>TeleShop Help</b>

<b>Available Commands:</b>
/start - Welcome message & main menu
/store - Browse our product catalog
/wallet - Access your digital wallet
/admin - Admin panel access (restricted)
/help - Show this help message

<b>How to use:</b>
1️⃣ Tap any button to open the WebApp
2️⃣ Browse products and add to cart
3️⃣ Add funds to your wallet
4️⃣ Complete your purchase securely

<b>Need Support?</b>
Contact: @yoursupport
Email: support@teleshop.com

<b>Features:</b>
✅ Secure payments
✅ Real-time updates
✅ Transaction history
✅ 24/7 support`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🚀 Open TeleShop',
            web_app: { url: WEBAPP_URL }
          }
        ],
        [
          { text: '📧 Contact Support', url: 'mailto:support@teleshop.com' }
        ]
      ]
    };

    bot?.sendMessage(chatId, helpMessage, {
      reply_markup: keyboard,
      parse_mode: 'HTML'
    });
  });

  // Handle callback queries
  bot.on('callback_query', (callbackQuery) => {
    const message = callbackQuery.message;
    const data = callbackQuery.data;
    const chatId = message?.chat.id;

    if (!chatId) return;

    switch (data) {
      case 'store':
        const storeKeyboard = {
          inline_keyboard: [
            [
              {
                text: '🛍️ Browse Products',
                web_app: { url: `${WEBAPP_URL}?tab=store` }
              }
            ]
          ]
        };
        bot?.sendMessage(chatId, '🛍️ <b>Product Store</b>\n\nBrowse our collection of premium products!', {
          reply_markup: storeKeyboard,
          parse_mode: 'HTML'
        });
        break;

      case 'wallet':
        const walletKeyboard = {
          inline_keyboard: [
            [
              {
                text: '💰 Open Wallet',
                web_app: { url: `${WEBAPP_URL}?tab=wallet` }
              }
            ]
          ]
        };
        bot?.sendMessage(chatId, '💰 <b>Digital Wallet</b>\n\nManage your funds and view transactions.', {
          reply_markup: walletKeyboard,
          parse_mode: 'HTML'
        });
        break;

      case 'help':
        bot?.sendMessage(chatId, '🆘 <b>Need Help?</b>\n\nUse /help command for detailed information or contact our support team.', {
          parse_mode: 'HTML'
        });
        break;
    }

    // Answer callback query
    bot?.answerCallbackQuery(callbackQuery.id);
  });

  console.log('🤖 Telegram bot started successfully');
} else {
  console.log('⚠️ TELEGRAM_BOT_TOKEN not provided, bot features disabled');
}

export { bot };