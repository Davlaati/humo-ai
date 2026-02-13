
import { GoogleGenAI, Modality } from "@google/genai";
import { UserProfile } from "../types";
import { DICTIONARY } from "../data/dictionary";

// API Key xavfsiz olinishi
const API_KEY = (typeof process !== 'undefined' && process.env?.API_KEY) || "";
const ai = new GoogleGenAI({ apiKey: API_KEY });

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
  if (!API_KEY) return generateFallbackLesson();
  try {
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
  if (!API_KEY) return null;
  try {
    const prompt = `Define the English word "${word}". Provide Uzbek translation and an example sentence. Return JSON: { "definition": "...", "translation": "...", "example": "..." }`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    return null;
  }
};

/**
 * Text-to-Speech using Gemini 2.5 Flash
 */
export const playTextToSpeech = async (text: string) => {
  if (!API_KEY) return;
  try {
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
  if (!API_KEY) return "That's very interesting! Can you tell me more about it?";
  try {
    const prompt = `You are Humobek AI, a friendly English tutor. User level: ${userLevel}. Response < 30 words. Encourage and ask a question. User: "${userText}"`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (e) {
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
