
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WeatherData, OutfitSuggestion, TempUnit, GroundingLink, UserProfile, VideoResolution } from "../types";

/**
 * IDENTITY-LOCKED VEO GENERATION
 * Architectural Choice: uses 720p and Fast model to maximize Vercel performance.
 * Resilience: Handles both single-image (start only) and dual-image (start + end) inputs.
 */
export const generateVeoVideo = async (
  imageUrls: string[], 
  userPrompt: string,
  resolution: VideoResolution = '720p',
  onStatusUpdate?: (status: string) => void
): Promise<string> => {
  if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) await (window as any).aistudio.openSelectKey();
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const gender = localStorage.getItem('aura_gender') || "Female";
  const age = localStorage.getItem('aura_age_range') || "30s";

  onStatusUpdate?.("Anchoring Identity...");

  try {
    const startBase64 = imageUrls[0].split(',')[1] || imageUrls[0];
    
    // Check if we have a second image to use as an end-anchor
    const hasEndAnchor = imageUrls.length > 1;
    const endBase64 = hasEndAnchor ? (imageUrls[1].split(',')[1] || imageUrls[1]) : null;

    const identityPrompt = `
      SUBJECT: A stylish ${gender} in their ${age}. 
      ACTION: ${userPrompt || "A professional runway walk towards the camera"}.
      ENVIRONMENT: Urban backdrop, soft cinematic fashion lighting.
      IDENTITY: Preserve 1:1 likeness of the subject and the specific outfit provided. 
      No garment morphing. No facial shifting.
    `.trim();

    onStatusUpdate?.(`Generating 720p Motion (${hasEndAnchor ? 'Dual' : 'Single'} Anchor)...`);

    // Prepare video config
    const videoConfig: any = {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '9:16'
    };

    // If we have a second photo, use it to lock the ending state
    if (hasEndAnchor && endBase64) {
      videoConfig.lastFrame = {
        imageBytes: endBase64,
        mimeType: 'image/png',
      };
    }

    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: identityPrompt,
      image: {
        imageBytes: startBase64,
        mimeType: 'image/png',
      },
      config: videoConfig
    });

    let finalOp = operation;
    while (!finalOp.done) {
      await new Promise(resolve => setTimeout(resolve, 8000));
      onStatusUpdate?.("Interpolating Persona...");
      finalOp = await ai.operations.getVideosOperation({ operation: finalOp });
    }

    const downloadLink = finalOp.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Synthesis failed.");

    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await videoResponse.blob();
    return URL.createObjectURL(blob);
  } catch (err: any) {
    console.error("Veo Engine Error:", err);
    throw err;
  }
};

export const getOutfitSuggestion = async (weather: WeatherData, context: string = "casual", unit: TempUnit = 'F'): Promise<OutfitSuggestion> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const displayTemp = unit === 'F' ? (weather.temp * 9/5 + 32).toFixed(1) : weather.temp;
  const gender = localStorage.getItem('aura_gender') || "Female";
  const archetype = localStorage.getItem('aura_style_archetype') || "Sophisticated Minimalist";
  
  const prompt = `Suggest a professional outfit for ${weather.location} at ${displayTemp}°${unit}. Gender: ${gender}. Style: ${archetype}.`;

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
          lowerBody: { type: Type.STRING },
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
};

export const generateOutfitImages = async (outfit: OutfitSuggestion, weather: WeatherData, size: any, unit: any, userImage?: string): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const gender = localStorage.getItem('aura_gender') || "Female";
  const prompt = `Full body fashion photography. A ${gender} wearing ${outfit.outerwear} and ${outfit.lowerBody}. Location: ${weather.location} street.`;
  
  const response: any = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio: "3:4", imageSize: "1K" } }
  });

  const urls: string[] = [];
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) urls.push(`data:image/png;base64,${part.inlineData.data}`);
  }
  // Return whatever we got. Even one image is now valid for the updated generateVeoVideo logic.
  return urls;
};

export const generateWeatherHeroImage = async (weather: WeatherData, unit: TempUnit = 'F'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: `Atmospheric street view of ${weather.location}.` }] },
    config: { imageConfig: { aspectRatio: "16:9" } }
  });
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return "";
};

export const getPlanRecommendations = async (location: string, outfit: OutfitSuggestion, lat: number, lon: number) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Grounding search for: ${outfit.activity} and ${outfit.coffeeSpot} in ${location}.`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lon } } }
    }
  });
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const links = groundingChunks.filter((c: any) => c.maps).map((c: any) => ({ uri: c.maps.uri, title: c.maps.title }));
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
