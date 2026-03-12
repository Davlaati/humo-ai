import { Telegraf } from 'telegraf';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Admin IDs who are allowed to use this command
const ADMIN_IDS = [process.env.ADMIN_CHAT_ID]; // Add your admin Telegram IDs here

bot.command('setcard', async (ctx) => {
  const userId = ctx.from.id.toString();
  
  // Security check: Only allow admins
  if (!ADMIN_IDS.includes(userId)) {
    return ctx.reply("Sizda bu buyruqni bajarish huquqi yo'q.");
  }

  // Extract the card number from the message
  // Example: /setcard 8600 1234 5678 9012
  const messageText = ctx.message.text;
  const newCard = messageText.replace('/setcard', '').trim();

  if (!newCard) {
    return ctx.reply("Iltimos, karta raqamini kiriting. Format: /setcard 8600 1234 5678 9012");
  }

  try {
    // Update the card in Supabase 'settings' table
    const { error } = await supabase
      .from('settings')
      .update({ value: newCard })
      .eq('key', 'p2p_card');

    if (error) {
      throw error;
    }

    ctx.reply(`✅ Karta raqami muvaffaqiyatli yangilandi:\n\n${newCard}`);
  } catch (error) {
    console.error('Error updating card:', error);
    ctx.reply("❌ Karta raqamini yangilashda xatolik yuz berdi.");
  }
});

// Start the bot
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
