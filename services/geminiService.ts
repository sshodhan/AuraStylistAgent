
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WeatherData, OutfitSuggestion, TempUnit, GroundingLink, UserProfile } from "../types";

const convertTemp = (c: number, unit: TempUnit) => unit === 'F' ? (c * 9/5 + 32).toFixed(1) : c;

const getUserRole = (): string => "Professional Fashion Stylist and Identity Consistency Expert";

const getUserProfile = (): UserProfile => {
  return {
    name: localStorage.getItem('aura_user_name') || "YOU",
    email: localStorage.getItem('aura_email_address') || "",
    gender: localStorage.getItem('aura_gender') || "Female",
    ageRange: localStorage.getItem('aura_age_range') || "30s",
    styleArchetype: localStorage.getItem('aura_style_archetype') || "Sophisticated Minimalist",
    preferredPalette: JSON.parse(localStorage.getItem('aura_palette') || '["Neutral Gray", "Deep Navy", "Pure White"]')
  };
};

/**
 * GENERATE VEO VIDEO (Fixed Implementation)
 * Uses the correct generateVideos method for Veo 3.1
 */
export const generateVeoVideo = async (
  imageUrls: string[], 
  prompt: string,
  onStatusUpdate?: (status: string) => void
): Promise<string> => {
  // 1. Mandatory API Key Selection Check
  if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await (window as any).aistudio.openSelectKey();
    }
  }

  // 2. Fresh instance for latest API Key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const profile = getUserProfile();
  onStatusUpdate?.("Initializing Veo 3.1 Engine...");

  try {
    const startImage = imageUrls[0].split(',')[1] || imageUrls[0];
    const endImage = (imageUrls[1] || imageUrls[0]).split(',')[1] || (imageUrls[1] || imageUrls[0]);

    // 3. Proper generateVideos call for Veo 3.1
    // Note: We DO NOT pass responseMimeType here to avoid 400 errors.
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt: `${prompt}. The subject is a ${profile.gender} in their ${profile.ageRange}. Maintain strict identity consistency across all frames.`,
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

    onStatusUpdate?.("Simulating Runway Motion...");

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      onStatusUpdate?.(getRandomReassuringMessage());
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video synthesis failed.");

    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await videoResponse.blob();
    return URL.createObjectURL(blob);
  } catch (err: any) {
    console.error("Veo Synthesis Error:", err);
    throw err;
  }
};

const getRandomReassuringMessage = () => {
  const messages = [
    "Locking subject identity...",
    "Verifying anatomical silhouettes...",
    "Applying textile dynamics...",
    "Stitching 9:16 cinematic frames...",
    "Polishing atmospheric lighting..."
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

export const getOutfitSuggestion = async (weather: WeatherData, context: string = "casual", unit: TempUnit = 'F'): Promise<OutfitSuggestion> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const displayTemp = convertTemp(weather.temp, unit);
  const profile = getUserProfile();
  
  const prompt = `
    Role: ${getUserRole()}
    User Identity: ${profile.gender}, age range ${profile.ageRange}.
    Task: Suggest a complete outfit for ${weather.location} at ${displayTemp}°${unit}.
    
    IDENTITY LOCK: You MUST suggest clothing items that align with ${profile.gender} fashion standards. 
    Ensure the "lowerBody" is a specific garment (Trousers, Skirt, etc.) that matches a ${profile.gender} silhouette.
    
    Aesthetic: ${profile.styleArchetype} in ${profile.preferredPalette.join(', ')}.
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
            baseLayer: { type: Type.STRING },
            outerwear: { type: Type.STRING },
            lowerBody: { type: Type.STRING, description: "Trousers/Shorts/Skirt - MUST match gender profile" },
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
  
  const identityDescription = userImage 
    ? `the person in the reference image (who is a ${profile.gender})` 
    : `a stylish ${profile.gender} in their ${profile.ageRange}`;

  const prompt = `
    EDITORIAL FASHION PHOTOGRAPHY. FULL LENGTH SHOT.
    SUBJECT: ${identityDescription}.
    THEME: ${visualVariation || profile.styleArchetype}.
    PALETTE: ${paletteHint || profile.preferredPalette.join(', ')}.
    GARMENTS: ${outfit.outerwear}, ${outfit.baseLayer}, ${outfit.lowerBody}, ${outfit.footwear}.
    
    IDENTITY SAFETY GUARDRAIL: 
    - Facial features and body silhouette MUST strictly match a ${profile.gender} subject. 
    - DO NOT mix gender traits. 
    - NO male features on female clothing or vice versa.
    
    ATMOSPHERE: ${weather.location} street scene.
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
  throw new Error("Image synthesis failed.");
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
    { palette: profile.preferredPalette.join(', '), theme: profile.styleArchetype, subject: `A stylish ${profile.gender}` },
    { palette: "Complementary Contrast", theme: `Cinematic ${profile.styleArchetype}`, subject: `A fashion-forward ${profile.gender}` }
  ];

  return Promise.all(variations.map(v => 
    generateOutfitImage(outfit, weather, size, unit, v.subject, userImage, v.theme, v.palette)
  ));
};

export const editImage = async (base64Image: string, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const profile = getUserProfile();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1] || base64Image, mimeType: 'image/jpeg' } },
        { text: `${prompt}. The subject is a ${profile.gender}. Maintain strict identity consistency.` },
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
