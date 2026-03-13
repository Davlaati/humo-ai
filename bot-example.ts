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

// Handle Approve Callback
bot.action(/^approve_(.+)_(.+)$/, async (ctx) => {
  const userId = ctx.from.id.toString();
  if (!ADMIN_IDS.includes(userId)) {
    return ctx.answerCbQuery("Sizda bu huquq yo'q.");
  }

  const targetUserId = ctx.match[1];
  const plan = ctx.match[2];

  try {
    // Determine duration based on plan
    let durationDays = 30;
    if (plan.includes('13 OY') || plan.includes('Yillik')) durationDays = 395;
    else if (plan.includes('Oylik')) durationDays = 30;
    else if (plan.includes('Haftalik')) durationDays = 7;

    const premiumUntil = new Date();
    premiumUntil.setDate(premiumUntil.getDate() + durationDays);

    // Update user in Supabase
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_premium: true, 
        premium_until: premiumUntil.toISOString(),
        is_temporary_premium: false
      })
      .eq('id', targetUserId);

    if (error) throw error;

    // Update payment status
    await supabase
      .from('payments')
      .update({ status: 'approved' })
      .eq('user_id', targetUserId)
      .eq('status', 'pending');

    await ctx.editMessageCaption(`✅ To'lov tasdiqlandi!\n\nFoydalanuvchi ID: ${targetUserId}\nTarif: ${plan}`);
    ctx.answerCbQuery("Foydalanuvchi premiumga o'tkazildi!");
  } catch (error) {
    console.error('Error approving payment:', error);
    ctx.answerCbQuery("Xatolik yuz berdi.");
  }
});

// Handle Reject Callback
bot.action(/^reject_(.+)$/, async (ctx) => {
  const userId = ctx.from.id.toString();
  if (!ADMIN_IDS.includes(userId)) {
    return ctx.answerCbQuery("Sizda bu huquq yo'q.");
  }

  const targetUserId = ctx.match[1];

  try {
    // Update user in Supabase (remove temporary premium)
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_premium: false, 
        is_temporary_premium: false
      })
      .eq('id', targetUserId);

    if (error) throw error;

    // Update payment status
    await supabase
      .from('payments')
      .update({ status: 'rejected' })
      .eq('user_id', targetUserId)
      .eq('status', 'pending');

    await ctx.editMessageCaption(`❌ To'lov rad etildi.\n\nFoydalanuvchi ID: ${targetUserId}`);
    ctx.answerCbQuery("To'lov rad etildi.");
  } catch (error) {
    console.error('Error rejecting payment:', error);
    ctx.answerCbQuery("Xatolik yuz berdi.");
  }
});

// Start the bot
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
