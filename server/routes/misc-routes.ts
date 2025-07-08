import { Router } from "express";
import { bot } from "../telegramBot";

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    bot: bot ? 'connected' : 'disabled',
    database: 'connected'
  });
});

// Webhook endpoint for Telegram bot (production)
router.post('/webhook', (req, res) => {
  if (bot) {
    bot.processUpdate(req.body);
  }
  res.sendStatus(200);
});

export default router;
