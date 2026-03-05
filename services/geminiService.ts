
import { GoogleGenAI, Modality } from "@google/genai";
import { UserProfile } from "../types";
import { DICTIONARY } from "../data/dictionary";

/**
 * Lazy initializer for the Gemini AI client.
 * This prevents the app from crashing during boot if the API_KEY is not yet available.
 */
export const getAIClient = () => {
  // Try multiple common locations for the API key
  const apiKey = 
    (import.meta.env && import.meta.env.VITE_GEMINI_KEY) || 
    (import.meta.env && import.meta.env.VITE_API_KEY) ||
    (typeof process !== 'undefined' && process && process.env && (process.env.API_KEY || process.env.GEMINI_API_KEY)) ||
    (window as any).GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("Gemini API_KEY is not configured. AI features will be disabled.");
    // We don't throw here to prevent the whole app from crashing if AI is not critical
    return null;
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

export const getDictionaryDefinition = async (word: string, lang: string = 'Uz') => {
  try {
    const ai = getAIClient();
    const prompt = `Define the English word "${word}". Provide ${lang} translation and an example sentence. Return JSON: { "definition": "...", "translation": "...", "example": "..." }`;
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

export const translateText = async (text: string, sourceLang: string, targetLang: string) => {
  try {
    const ai = getAIClient();
    if (!ai) return null;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following text from ${sourceLang} to ${targetLang}: "${text}"`,
      config: {
        systemInstruction: "You are a professional translator. Provide only the translated text without any explanations or extra characters.",
      }
    });
    
    return response.text;
  } catch (error) {
    console.error("Translation error:", error);
    return null;
  }
};

export const generateConversationResponse = async (userText: string, userLevel: string, personality: string = 'Humo AI', topic: string = 'General') => {
  try {
    const ai = getAIClient();
    if (!ai) return "That's very interesting! Can you tell me more about it?";
    
    const systemInstruction = `
      You are ${personality}, an English tutor in the Ravona AI app.
      User Level: ${userLevel}.
      Current Topic: ${topic}.
      
      PERSONALITY ROLES:
      - Coach Mike: Business English expert, professional, uses corporate jargon.
      - Dr. Aris: Academic/IELTS expert, formal, uses complex vocabulary.
      - Alex: NYC local, uses slang, energetic, "cool" vibe.
      - Sarah: Londoner, focuses on grammar and "proper" British English.
      - Humo AI: Friendly, balanced, encouraging.

      RULES:
      1. Keep response < 40 words.
      2. Always encourage the user.
      3. End with a relevant question to keep the conversation going.
      4. Adapt your vocabulary to the user's level (${userLevel}).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userText,
      config: {
        systemInstruction: systemInstruction,
      }
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
      # ROLE: Siz RAVONA AI - Telegram Mini App uchun yaratilgan eng kreativ va aqlli lug'at mentorsiz. 
      Siz shunchaki lug'at emassiz, siz foydalanuvchining shaxsiy "Language Architect"isiz.

      # FOYDALANUVCHI PROFILI (USER DNA):
      - Ism: ${user.name}
      - Daraja (Level): ${user.level}
      - Maqsad (Goal): ${user.goal}
      - Qiziqishlar (Interests): ${user.interests.join(', ')}
      - Streak: ${user.streak} kun

      # CORE PRINCIPLE: 
      Foydalanuvchi ma'lumotlarini (darajasi, qiziqishi, tarixi) har doim eslab qoling. 
      Har bir javobda foydalanuvchining qiziqishlariga (${user.interests.join(', ')}) bog'liq misollar keltiring.
      Agar foydalanuvchi Beginner bo'lsa, ko'proq o'zbekcha tushuntirish bering. Advanced bo'lsa, faqat inglizcha tushuntiring.

      # 1. SMART DICTIONARY ENGINE (Kreativ qism):
      Foydalanuvchi so'z qidirganda quyidagi formatda javob bering (Markdown):

      ## 🔤 **[Word]** | [Transcription] | [Tarjima]
      
      ### 🎭 **VIBE CHECK**
      So'zning ijtimoiy og'irligi va konteksti (Formal, Informal, Slang).

      ### 🧠 **MNEMONIC HACK**
      So'zni o'zbekcha so'zlar yoki vaziyatlar orqali eslab qolish uchun kulgili assotsiatsiya.

      ### 🎬 **SCENARIO**
      Foydalanuvchi qiziqishiga mos (${user.interests[0] || 'umumiy'}) 1 qatorlik mini-ssenariy.

      ### 🚦 **USAGE**
      - **Formal**: [Sentence]
      - **Informal**: [Sentence]
      - **Slang/Idiom**: [Sentence]

      ### 💡 **PRO TIP**
      Ushbu so'z bilan bog'liq 1 ta foydali idiom yoki frazeologik fe'l.

      # 2. PSYCHOLOGICAL TOOLS & RETENTION:
      - "Streak Fire": 🔥 Emojisi bilan motivatsiya bering.
      - "Visual Prompting": ASCII art yoki emojilardan maksimal foydalaning.

      # 3. TECHNICAL RULES:
      - Javoblar qisqa, vizual skanerlashga oson (Markdown headers va bullet points) bo'lsin.
      - ${user.settings?.language === 'Ru' ? 'На русском языке' : user.settings?.language === 'Eng' ? 'In English' : 'O\'zbek tilida'} gapiring (Beginner/Intermediate uchun), lekin terminlarni inglizcha qoldiring.
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
