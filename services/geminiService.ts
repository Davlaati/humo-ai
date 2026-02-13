
import { GoogleGenAI, Modality } from "@google/genai";
import { UserProfile } from "../types";
import { DICTIONARY } from "../data/dictionary";

/**
 * Lazy initializer for the Gemini AI client.
 * This prevents the app from crashing during boot if the API_KEY is not yet available.
 */
const getAIClient = () => {
  // Use bracket notation to access the environment variable
  const apiKey = process['env']['API_KEY'];
  if (!apiKey) {
    throw new Error("API_KEY is not configured in the environment.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Manual Base64 decoding as per SDK guidelines (do not use js-base64)
 */
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Manual raw PCM decoding for AudioContext
 */
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const generateLessonContent = async (user: UserProfile, topic: string) => {
  try {
    const ai = getAIClient();
    const prompt = `
      Create a mini English lesson for a student with level ${user.level}.
      Topic: ${topic}.
      User Interests: ${user.interests.join(', ')}.
      Teaching Style: ${user.personalities.join(', ')}.
      
      Provide 5 key vocabulary words with definitions, Uzbek translations, and 1 short quiz question in JSON format:
      {
        "vocab": [{"word": "...", "definition": "...", "example": "...", "translation": "..."}],
        "quiz": {"question": "...", "options": ["...", "..."], "answer": "..."}
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Lesson Error:", error);
    return generateFallbackLesson();
  }
};

export const getDictionaryDefinition = async (word: string) => {
  try {
    const ai = getAIClient();
    const prompt = `Define the English word "${word}". Provide Uzbek translation and an example sentence. Return JSON: { "definition": "...", "translation": "...", "example": "..." }`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Dictionary lookup failed:", error);
    return null;
  }
};

/**
 * Text-to-Speech using Gemini 2.5 Flash
 */
export const playTextToSpeech = async (text: string) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return;

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const bytes = decodeBase64(base64Audio);
    const buffer = await decodeAudioData(bytes, audioCtx, 24000, 1);

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
  } catch (e) {
    console.error("TTS Playback Failed", e);
  }
};

export const generateConversationResponse = async (userText: string, userLevel: string) => {
  try {
    const ai = getAIClient();
    const prompt = `You are Humobek AI, a friendly English tutor. User level: ${userLevel}. Response < 30 words. Encourage and ask a question. User: "${userText}"`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (e) {
    console.error("Conversation generation failed:", e);
    return "That's very interesting! Can you tell me more about it?";
  }
};

export const generateFallbackLesson = () => {
    const shuffled = [...DICTIONARY].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);
    return {
        vocab: selected.map(w => ({
            word: w.term,
            definition: w.definition,
            example: w.example,
            translation: w.translation
        })),
        quiz: {
            question: `What is the translation of "${selected[0].term}"?`,
            options: [selected[0].translation, selected[1].translation, "None", "Unknown"],
            answer: selected[0].translation
        }
    };
};

// --- YANGI QO'SHILGAN KOD: AQLLI LUG'AT MENTOR (Language Architect) ---

export const consultWithMentor = async (user: UserProfile, query: string, type: 'lookup' | 'daily' = 'lookup') => {
  try {
    const ai = getAIClient();
    
    const systemInstruction = `
      # ROLE: Siz HUMO AI - Telegram Mini App uchun yaratilgan eng kreativ va aqlli lug'at mentorsiz. 

      # FOYDALANUVCHI PROFILI (USER DNA):
      - Ism: ${user.name}
      - Daraja (Level): ${user.level}
      - Maqsad (Goal): ${user.goal}
      - Qiziqishlar (Interests): ${user.interests.join(', ')}
      - Streak: ${user.streak} kun

      # CORE PRINCIPLE: 
      Foydalanuvchi ma'lumotlarini (darajasi, qiziqishi, tarixi) har doim eslab qoling. Yangi ma'lumot kelsa, eskisi bilan birlashtiring, uni o'chirib yubormang.

      # 1. INITIALIZATION (USER DNA):
      Birinchi marta salomlashganda foydalanuvchining 'Til DNA'sini aniqlang (agar profilda bo'lmasa). Hozirgi profilda bor.

      # 2. SMART DICTIONARY ENGINE (Kreativ qism):
      Foydalanuvchi so'z qidirganda quyidagi formatda javob bering (Markdown):

      - 🔤 **[Word]** | [Transcription] | [Tarjima]
      - 🎭 **VIBE CHECK**: So'zning ijtimoiy og'irligini ayting (Masalan: "Bu so'z bilan suhbatda aqlli ko'rinasiz" yoki "Ehtiyot bo'ling, bu ko'cha slangi").
      - 🧠 **MNEMONIC HACK**: So'zni o'zbekcha so'zlar yoki vaziyatlar orqali eslab qolish uchun kulgili assotsiatsiya (Masalan: 'Curious' - 'Ko'r-Yuz' - hamma narsani ko'rgisi keladigan qiziquvchan yuz).
      - 🎬 **SCENARIO**: Foydalanuvchi qiziqishiga mos (${user.interests[0] || 'umumiy'}) 1 qatorlik mini-ssenariy (Masalan, IT bo'lsa: "Kod yozayotganingda 'Error' chiqsa, 'Curious' bo'lishing kerak").
      - 🚦 **USAGE**: 3 xil uslubda (Formal, Informal, Slang) bittadan qisqa gap.

      # 3. PSYCHOLOGICAL TOOLS & RETENTION:
      - "The Forgotten Friend": Har 5 ta so'zdan keyin, foydalanuvchi avval so'ragan 1 ta so'zni kutilmaganda so'rang.
      - "Streak Fire": Har bir to'g'ri javob uchun 🔥 emojisi bilan motivatsiya bering.
      - "Visual Prompting": So'zni tushuntirish uchun ASCII art yoki emojilardan maksimal foydalaning.

      # 4. MONETIZATION (Premium Push):
      - Foydalanuvchi 3 tadan ortiq murakkab so'z so'rasa, "Senda akademik salohiyat yuqori (${user.goal})! Humo Premium'da IELTS 8+ lug'at paketi ochildi, Stars orqali ulanishni xohlaysanmi?" deb taklif bering.

      # 5. TECHNICAL RULES:
      - Javoblar qisqa, vizual skanerlashga oson (bullet points) bo'lsin.
      - O'zbek tilida gapiring, lekin terminlarni inglizcha qoldiring.
      - Foydalanuvchi xato qilsa, uni kamsitmasdan, "Ajoyib urinish, lekin mana bunday yaxshiroq..." deb tuzating.
    `;

    const userPrompt = type === 'daily' 
      ? "Menga bugungi kun uchun 5 ta yangi so'z tavsiya eting (Daily Words)." 
      : `Quyidagi so'z yoki iborani tahlil qiling: "${query}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Mentor Error:", error);
    return "Uzr, hozircha mentor bilan bog'lanib bo'lmadi. Keyinroq urinib ko'ring.";
  }
};
