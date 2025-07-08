import { Router } from "express";
import { storage } from "../storage";
import { insertTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { isTelegramAuthenticated } from "../telegramAuth";

const router = Router();

router.get('/', isTelegramAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching transactions for user:', userId);
    const { type } = req.query;
    const transactions = await storage.getTransactions(userId, type as string);
    console.log('Found transactions:', transactions.length);
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

router.post('/', isTelegramAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    console.log('Creating transaction for user:', userId, 'type:', req.body.type, 'amount:', req.body.amount);
    const transactionData = insertTransactionSchema.parse({ 
      ...req.body, 
      userId,
      status: 'pending'
    });
    
    // Do NOT update balance immediately - wait for admin approval
    console.log(`Transaction created: ${transactionData.type} for user ${userId} - Amount: ${transactionData.amount} - Status: pending`);
    
    const transaction = await storage.createTransaction(transactionData);
    res.json(transaction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
    }
    console.error("Error creating transaction:", error);
    res.status(500).json({ message: "Failed to create transaction" });
  }
});

export default router;
