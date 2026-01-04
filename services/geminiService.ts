
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WeatherData, OutfitSuggestion, TempUnit, GroundingLink, UserProfile } from "../types";

const convertTemp = (c: number, unit: TempUnit) => unit === 'F' ? (c * 9/5 + 32).toFixed(1) : c;

const getUserRole = (): string => "Professional Fashion Stylist and Quality Assurance Agent";

const getUserProfile = (): UserProfile => {
  return {
    name: localStorage.getItem('aura_user_name') || "YOU",
    email: localStorage.getItem('aura_email_address') || "",
    styleArchetype: localStorage.getItem('aura_style_archetype') || "Sophisticated Minimalist",
    preferredPalette: JSON.parse(localStorage.getItem('aura_palette') || '["Neutral Gray", "Deep Navy", "Pure White"]')
  };
};

export const generateVeoVideo = async (
  imageUrls: string[], 
  prompt: string,
  onStatusUpdate?: (status: string) => void
): Promise<string> => {
  if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await (window as any).aistudio.openSelectKey();
    }
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  onStatusUpdate?.("Initializing Veo Portrait Engine...");

  try {
    const startImage = imageUrls[0].split(',')[1] || imageUrls[0];
    const endImage = (imageUrls[1] || imageUrls[0]).split(',')[1] || (imageUrls[1] || imageUrls[0]);

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `${prompt}. Ensure the lower body is clearly rendered with the specified ${imageUrls.length > 0 ? 'garments' : 'clothing'}. If shorts are worn, they must be distinct and intentional.`,
      image: {
        imageBytes: startImage,
        mimeType: 'image/png',
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '9:16',
        lastFrame: {
          imageBytes: endImage,
          mimeType: 'image/png',
        }
      }
    });

    onStatusUpdate?.("Applying Style Safety Guardrails...");

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      onStatusUpdate?.(getRandomReassuringMessage());
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed.");

    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await videoResponse.blob();
    return URL.createObjectURL(blob);
  } catch (err: any) {
    console.error("Veo Error:", err);
    throw err;
  }
};

const getRandomReassuringMessage = () => {
  const messages = [
    "Ensuring garment continuity...",
    "Verifying anatomical layering...",
    "Finalizing cinematic textures...",
    "Stitching full-body frames...",
    "Polishing urban lighting..."
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

export const getOutfitSuggestion = async (weather: WeatherData, context: string = "casual", unit: TempUnit = 'F'): Promise<OutfitSuggestion> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const displayTemp = convertTemp(weather.temp, unit);
  const profile = getUserProfile();
  
  const prompt = `
    Role: ${getUserRole()}
    Task: Suggest a complete, high-fashion outfit for ${weather.location} at ${displayTemp}°${unit}.
    
    SAFETY & LOGIC MANDATE:
    - You MUST provide a specific "lowerBody" garment. 
    - Choices: Trousers, Chinos, Denim, Skirt, or Shorts.
    - SHORTS POLICY: Only suggest shorts if the temperature is above 20°C (68°F) or for specific athletic/relaxed contexts. 
    - In rain or professional settings with long coats, prefer trousers to maintain aesthetic balance.
    - Ensure the outfit is logically layered. No "naked" or missing lower-body glitches.

    Style DNA: ${profile.styleArchetype} in ${profile.preferredPalette.join(', ')}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            baseLayer: { type: Type.STRING, description: "Tops/Shirts" },
            outerwear: { type: Type.STRING, description: "Coats/Jackets" },
            lowerBody: { type: Type.STRING, description: "Trousers/Pants/Shorts/Skirt - MANDATORY" },
            footwear: { type: Type.STRING },
            proTip: { type: Type.STRING },
            styleReasoning: { type: Type.STRING },
            weatherStory: { type: Type.STRING },
            activity: { type: Type.STRING },
            coffeeSpot: { type: Type.STRING },
            storeType: { type: Type.STRING },
          },
          required: ["baseLayer", "outerwear", "lowerBody", "footwear", "proTip", "styleReasoning", "weatherStory", "activity", "coffeeSpot", "storeType"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (err: any) {
    throw err;
  }
};

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
  const profile = getUserProfile();
  
  const prompt = `
    EDITORIAL FASHION PHOTOGRAPHY. FULL LENGTH HEAD-TO-TOE SHOT.
    SUBJECT: ${userImage ? 'the person in the reference' : subject}.
    THEME: ${visualVariation || profile.styleArchetype}.
    PALETTE: ${paletteHint || profile.preferredPalette.join(', ')}.
    MANDATORY GARMENTS (Must be clearly visible): 
    1. ${outfit.outerwear} (Outer Layer)
    2. ${outfit.baseLayer} (Inner Layer)
    3. ${outfit.lowerBody} (Primary Lower Body - MUST RENDER CLEARLY)
    4. ${outfit.footwear}
    
    QUALITY CONTROL: Ensure the ${outfit.lowerBody} is physically present. If shorts, show intentional leg styling. No bare-body hallucinations.
    ATMOSPHERE: ${weather.location} street scene, ${weather.precip > 0 ? 'drizzly' : 'crisp'}.
  `.trim();
  
  const parts: any[] = [{ text: prompt }];
  if (userImage) {
    parts.push({ inlineData: { data: userImage.split(',')[1] || userImage, mimeType: 'image/jpeg' } });
  }

  const response: any = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts },
    config: { imageConfig: { aspectRatio: "3:4", imageSize: size } }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Generation failed to return pixels.");
};

export const generateOutfitImages = async (
  outfit: OutfitSuggestion, 
  weather: WeatherData, 
  size: "1K" | "2K" | "4K" = "1K", 
  unit: TempUnit = 'F',
  userImage?: string
): Promise<string[]> => {
  const profile = getUserProfile();
  const variations = [
    { palette: profile.preferredPalette.join(', '), theme: profile.styleArchetype, subject: "A person reflecting urban elegance" },
    { palette: "Complementary Contrast", theme: `Cinematic ${profile.styleArchetype}`, subject: "A fashion-forward individual" }
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
        { text: `${prompt}. Ensure garment integrity.` },
      ],
    },
    config: { imageConfig: { aspectRatio: "3:4" } }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Edit failed.");
};

export const generateWeatherHeroImage = async (weather: WeatherData, unit: TempUnit = 'F'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const displayTemp = convertTemp(weather.temp, unit);
  const prompt = `Cinematic photo of ${weather.location} at ${displayTemp}°${unit}. Wide-angle fashion landscape. High-end lighting.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio: "16:9" } }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Hero generation failed.");
};

export const getPlanRecommendations = async (location: string, outfit: OutfitSuggestion, lat: number, lon: number): Promise<{ text: string, links: GroundingLink[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Grounded locations in ${location} for: Explore (${outfit.activity}), Eat (${outfit.coffeeSpot}), Shop (${outfit.storeType}). Focus on high-fashion accessibility.`;
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lon } } }
    }
  });
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const links: GroundingLink[] = groundingChunks.filter((c: any) => c.maps).map((c: any) => ({ uri: c.maps.uri, title: c.maps.title }));
  return { text: response.text || "", links };
};

export function decode(base64: string) { return new Uint8Array(atob(base64).split("").map(c => c.charCodeAt(0))); }
export function encode(bytes: Uint8Array) { return btoa(String.fromCharCode(...bytes)); }
export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(numChannels, dataInt16.length / numChannels, sampleRate);
  for (let c = 0; c < numChannels; c++) {
    const d = buffer.getChannelData(c);
    for (let i = 0; i < d.length; i++) d[i] = dataInt16[i * numChannels + c] / 32768.0;
  }
  return buffer;
}
