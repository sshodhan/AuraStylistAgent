
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WeatherData, OutfitSuggestion, TempUnit, GroundingLink } from "../types";

const convertTemp = (c: number, unit: TempUnit) => unit === 'F' ? (c * 9/5 + 32).toFixed(1) : c;

// Generates a comprehensive lifestyle itinerary based on weather
export const getOutfitSuggestion = async (weather: WeatherData, context: string = "casual", unit: TempUnit = 'F'): Promise<OutfitSuggestion> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const displayTemp = convertTemp(weather.temp, unit);
  
  const prompt = `
    You are a professional fashion stylist and urban concierge. A client is in ${weather.location}.
    Weather: ${displayTemp}°${unit}, Precip: ${weather.precip}mm, Wind: ${weather.wind}km/h.
    Client Context/Persona: "${context}"

    Suggest:
    1. A 3-piece outfit (Base, Outerwear, Shoes).
    2. A "Weather Story": A very short (2 sentences max), inspirational narrative about today's atmosphere and an activity the user should feel inspired to do. 
    3. "Style Reasoning": Technical explanation of why this specific outfit works for the weather.
    4. A "Fun Activity" optimized for this vibe.
    5. A "Coffee/Dining Vibe".
    6. "Store Type".

    Style Rules:
    - Breathable for high humidity (>80%).
    - Shells for wind (>20km/h).
    - Match everything to the "${context}" aesthetic.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          baseLayer: { type: Type.STRING },
          outerwear: { type: Type.STRING },
          footwear: { type: Type.STRING },
          proTip: { type: Type.STRING },
          styleReasoning: { type: Type.STRING },
          weatherStory: { type: Type.STRING },
          activity: { type: Type.STRING },
          coffeeSpot: { type: Type.STRING },
          storeType: { type: Type.STRING },
        },
        required: ["baseLayer", "outerwear", "footwear", "proTip", "styleReasoning", "weatherStory", "activity", "coffeeSpot", "storeType"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

// Generates an email digest content
export const generateEmailDigest = async (weather: WeatherData, outfit: OutfitSuggestion, unit: TempUnit = 'F', userName: string = ''): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const displayTemp = convertTemp(weather.temp, unit);
  
  const prompt = `
    Write a brief "Daily Styling Digest" for ${userName || 'Fashionista'}.
    Location: ${weather.location}
    Weather: ${displayTemp}°${unit}.
    Look: ${outfit.outerwear} over ${outfit.baseLayer}.
    Activity: ${outfit.activity}.
    Vibe: ${outfit.coffeeSpot}.
    Tip: ${outfit.proTip}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      temperature: 0.7,
      maxOutputTokens: 500,
    }
  });

  return response.text || "Your daily style brief is ready.";
};

// Generates a singular outfit image with deep contextual steering
// MODEL: gemini-3-pro-image-preview is used for high-fidelity identity preservation
export const generateOutfitImage = async (
  outfit: OutfitSuggestion, 
  weather: WeatherData, 
  size: "1K" | "2K" | "4K" = "1K", 
  unit: TempUnit = 'F', 
  subject: string = "a stylish person",
  userImage?: string,
  visualVariation: string = "standard high-fashion",
  paletteHint: string = "neutral tones"
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const displayTemp = convertTemp(weather.temp, unit);
  
  const prompt = `High-end editorial fashion photography. 
  SUBJECT: ${userImage ? 'the person provided in the reference photo' : subject}.
  LOCATION: An atmospheric street in ${weather.location}, specifically near a ${outfit.coffeeSpot}.
  ACTIVITY: The subject is ${outfit.activity}.
  LIGHTING: Cinematic lighting matching ${displayTemp}°${unit} weather conditions.
  STYLE: ${visualVariation}, aesthetic matching ${outfit.styleReasoning}.
  PALETTE: ${paletteHint}.
  OUTFIT: ${outfit.baseLayer}, ${outfit.outerwear}, ${outfit.footwear}.
  QUALITY: Photorealistic, 8k resolution, fashion magazine quality. 
  CRITICAL: Maintain the exact facial structure and identity of the reference photo if provided.`;
  
  const parts: any[] = [{ text: prompt }];
  if (userImage) {
    parts.push({
      inlineData: {
        data: userImage.split(',')[1] || userImage,
        mimeType: 'image/jpeg'
      }
    });
  }

  const response: any = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts },
    config: {
      imageConfig: { aspectRatio: "3:4", imageSize: size }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("No image data found.");
};

export const generateOutfitImages = async (
  outfit: OutfitSuggestion, 
  weather: WeatherData, 
  size: "1K" | "2K" | "4K" = "1K", 
  unit: TempUnit = 'F',
  userImage?: string
): Promise<string[]> => {
  const variations = [
    { palette: "Sophisticated Neutrals", theme: "Sleek & Modernist", subject: "A stylish East Asian person" },
    { palette: "Rich Textural Tones", theme: "Bold & Avant-garde", subject: "A confident Black individual" },
    { palette: "Urban Heritage Earthtones", theme: "Classic & Timeless", subject: "A person reflecting sophisticated urban elegance" }
  ];

  return Promise.all(variations.map(v => 
    generateOutfitImage(outfit, weather, size, unit, v.subject, userImage, v.theme, v.palette)
  ));
};

export const editImage = async (base64Image: string, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1] || base64Image, mimeType: 'image/jpeg' } },
        { text: prompt },
      ],
    },
    config: { imageConfig: { aspectRatio: "3:4" } }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("No edited image data found.");
};

export const generateWeatherHeroImage = async (weather: WeatherData, unit: TempUnit = 'F'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const displayTemp = convertTemp(weather.temp, unit);
  const prompt = `Cinematic photo of ${weather.location} at ${displayTemp}°${unit}, ${weather.precip}mm rain, ${weather.wind}km/h wind. Wide-angle.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio: "16:9" } }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("No weather hero image found.");
};

// GOOGLE MAPS GROUNDING INTEGRATION
export const getPlanRecommendations = async (location: string, outfit: OutfitSuggestion, lat: number, lon: number): Promise<{ text: string, links: GroundingLink[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `I need specifically grounded locations in ${location} for these categories:
    1. Explore: ${outfit.activity}
    2. Eat/Drink: ${outfit.coffeeSpot}
    3. Shop: ${outfit.storeType}
    
    CRITICAL INSTRUCTION: For EVERY place found, you MUST provide a line in this exact format:
    "[Place Name] - Reason: [A exactly 5-word description of why this fits the outfit and mood]"
    Example: "The Roastery - Reason: Warm lighting complements your knits."`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lon } } }
    }
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const responseText = response.text || "";
  
  const reasonsMap: Record<string, string> = {};
  const reasonMatches = responseText.matchAll(/(.*?) - Reason: (.*)/g);
  for (const match of reasonMatches) {
    const title = match[1].trim().toLowerCase();
    const reason = match[2].trim();
    reasonsMap[title] = reason;
  }
  
  const links: GroundingLink[] = groundingChunks
    .filter((chunk: any) => chunk.maps)
    .map((chunk: any) => {
      const originalTitle = chunk.maps.title;
      const titleLower = originalTitle.toLowerCase();
      let type: 'eat' | 'explore' | 'shop' | undefined;
      
      if (titleLower.includes('cafe') || titleLower.includes('coffee') || titleLower.includes('restaurant') || titleLower.includes('bistro') || titleLower.includes('bar') || titleLower.includes('pub')) {
        type = 'eat';
      } else if (titleLower.includes('park') || titleLower.includes('museum') || titleLower.includes('gallery') || titleLower.includes('landmark') || titleLower.includes('pier') || titleLower.includes('square')) {
        type = 'explore';
      } else {
        type = 'shop';
      }

      let reason = "Perfectly fits your current aesthetic.";
      for (const [key, val] of Object.entries(reasonsMap)) {
        if (titleLower.includes(key) || key.includes(titleLower)) {
          reason = val;
          break;
        }
      }
      
      return { 
        uri: chunk.maps.uri, 
        title: originalTitle,
        reason: reason,
        type
      };
    }) || [];

  return { text: responseText, links };
};

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioData(
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
