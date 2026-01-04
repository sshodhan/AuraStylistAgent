
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WeatherData, OutfitSuggestion, TempUnit, GroundingLink, UserProfile } from "../types";

const convertTemp = (c: number, unit: TempUnit) => unit === 'F' ? (c * 9/5 + 32).toFixed(1) : c;

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
    // To achieve 9:16 (Portrait), we use the 'image' (start frame) and 'lastFrame' (end frame) properties
    // This provides a "taller" cinematic look preferred for fashion runway shots.
    const startImage = imageUrls[0].split(',')[1] || imageUrls[0];
    const endImage = (imageUrls[1] || imageUrls[0]).split(',')[1] || (imageUrls[1] || imageUrls[0]);

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt: prompt,
      image: {
        imageBytes: startImage,
        mimeType: 'image/png',
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '9:16', // Switched to 9:16 for full-body fashion height
        lastFrame: {
          imageBytes: endImage,
          mimeType: 'image/png',
        }
      }
    });

    onStatusUpdate?.("Synthesizing Style Motion...");

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      onStatusUpdate?.(getRandomReassuringMessage());
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed to return a link.");

    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await videoResponse.blob();
    return URL.createObjectURL(blob);
  } catch (err: any) {
    console.error("Veo Generation Error:", err);
    if (err.message?.includes("Requested entity was not found")) {
      await (window as any).aistudio.openSelectKey();
      throw new Error("API Key reset required. Please select a paid project.");
    }
    throw err;
  }
};

const getRandomReassuringMessage = () => {
  const messages = [
    "Refining fabric physics...",
    "Balancing atmospheric lighting...",
    "Rendering cinematic motion...",
    "Stitching frames for elegance...",
    "Finalizing urban backdrop...",
    "Syncing motion to fit..."
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

export const getOutfitSuggestion = async (weather: WeatherData, context: string = "casual", unit: TempUnit = 'F'): Promise<OutfitSuggestion> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const displayTemp = convertTemp(weather.temp, unit);
  const profile = getUserProfile();
  
  const prompt = `
    You are a professional fashion stylist and urban concierge. A client is in ${weather.location}.
    Weather: ${displayTemp}°${unit}, Precip: ${weather.precip}mm, Wind: ${weather.wind}km/h.
    Client Persona: "${context}"
    
    CRITICAL PERSONALIZATION:
    - User's Signature Archetype: "${profile.styleArchetype}"
    - Preferred Color Palette: ${profile.preferredPalette.join(', ')}
    - User Name: ${profile.name}

    Suggest:
    1. A 3-piece outfit (Base, Outerwear, Shoes) that strictly adheres to the ${profile.styleArchetype} aesthetic using colors from ${profile.preferredPalette.join(', ')}.
    2. A "Weather Story": 2 sentences max. 
    3. "Style Reasoning": Technical explanation of fabric choices and palette harmony.
    4. A "Fun Activity" optimized for this vibe.
    5. A "Coffee/Dining Vibe".
    6. "Store Type".

    Rules:
    - If wind > 20km/h, prioritize structural outerwear.
    - If temp > 25°C, prioritize linen and breathable silks.
    - Personalize the response for ${profile.name}.
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
  } catch (err: any) {
    console.error("Gemini Reasoner Error:", err);
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
  const displayTemp = convertTemp(weather.temp, unit);
  const profile = getUserProfile();
  
  const prompt = `High-end editorial fashion photography. 
  SUBJECT: ${userImage ? 'the person in the reference' : subject}.
  THEME: ${profile.styleArchetype}.
  PALETTE: ${profile.preferredPalette.join(', ')}.
  LOCATION: ${weather.location} street scene.
  OUTFIT: ${outfit.baseLayer}, ${outfit.outerwear}, ${outfit.footwear}.
  ATMOSPHERE: ${weather.precip > 0 ? 'Drizzly and moody' : 'Bright and crisp'}.
  QUALITY: Photorealistic, 8k, fashion magazine.`;
  
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
      const mimeType = part.inlineData.mimeType || 'image/png';
      return `data:${mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image returned.");
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
    { palette: "High Contrast", theme: `Experimental ${profile.styleArchetype}`, subject: "A bold fashion-forward individual" },
    { palette: "Muted Earthtones", theme: `Casual ${profile.styleArchetype}`, subject: "A relaxed urban traveler" }
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
    if (part.inlineData) {
      const mimeType = part.inlineData.mimeType || 'image/png';
      return `data:${mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image data found.");
};

export const generateWeatherHeroImage = async (weather: WeatherData, unit: TempUnit = 'F'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const displayTemp = convertTemp(weather.temp, unit);
  const prompt = `Cinematic photo of ${weather.location} at ${displayTemp}°${unit}. Wide-angle fashion landscape. No text. Photorealistic.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const detectedMimeType = part.inlineData.mimeType || 'image/png';
        return `data:${detectedMimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data.");
  } catch (err: any) {
    throw err;
  }
};

export const getPlanRecommendations = async (location: string, outfit: OutfitSuggestion, lat: number, lon: number): Promise<{ text: string, links: GroundingLink[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Recommend grounded locations in ${location} for: Explore (${outfit.activity}), Eat (${outfit.coffeeSpot}), Shop (${outfit.storeType}).`;
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
