
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WeatherData, OutfitSuggestion, TempUnit, GroundingLink, UserProfile, VideoResolution } from "../types";

/**
 * LIKENESS-PRESERVING VEO ENGINE
 * Optimized for Vercel & Single Photo Inputs.
 * Uses 720p Fast model for 200 ops/day quota.
 */
export const generateVeoVideo = async (
  imageUrls: string[], 
  userPrompt: string,
  resolution: VideoResolution = '720p',
  onStatusUpdate?: (status: string) => void
): Promise<string> => {
  // Ensure the user has selected their key via AI Studio protocol if applicable
  if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) await (window as any).aistudio.openSelectKey();
  }

  // Create a fresh instance for Vercel/Key sync
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const gender = localStorage.getItem('aura_gender') || "Female";
  const archetype = localStorage.getItem('aura_style_archetype') || "Sophisticated Minimalist";

  onStatusUpdate?.("Anchoring Identity...");

  try {
    // Extract raw base64 data from the source image
    const sourceBase64 = imageUrls[0].split(',')[1] || imageUrls[0];
    
    // THE LIKENESS LOCK PROMPT:
    // This prompt forces the model to respect the provided image as the identity "seed".
    const identityPrompt = `
      CINEMATIC RUNWAY: ${userPrompt || "A professional runway walk towards the camera"}.
      SUBJECT: The exact ${gender} from the reference image. 
      STYLE DNA: ${archetype}.
      IDENTITY LOCK: Maintain 1:1 likeness of the subject's face, hair, and clothing from the reference frame. 
      DO NOT alter the outfit. DO NOT morph the facial structure. 
      ATMOSPHERE: High-fashion lighting, blurred urban background.
      MOTION: Natural, fluid human motion.
    `.trim();

    onStatusUpdate?.("Initializing 720p Synthesis...");

    // Start long-running generation
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: identityPrompt,
      image: {
        imageBytes: sourceBase64,
        mimeType: 'image/png',
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '9:16'
      }
    });

    // VERCEL POLLING LOOP: 
    // Prevents function timeouts by polling the status from the browser.
    let pollCount = 0;
    while (!operation.done) {
      pollCount++;
      await new Promise(resolve => setTimeout(resolve, 8000)); // Poll every 8 seconds
      
      const statuses = [
        "Analyzing Fabric Physics...",
        "Rendering Motion Frames...",
        "Finalizing Lighting...",
        "Polishing Persona...",
        "Identity Check Active..."
      ];
      onStatusUpdate?.(statuses[pollCount % statuses.length]);
      
      operation = await ai.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Synthesis failed to produce a valid link.");

    // Fetch the MP4 with the API key
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await videoResponse.blob();
    return URL.createObjectURL(blob);
  } catch (err: any) {
    console.error("Vercel Veo Error:", err);
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
  const prompt = `Full body fashion photography. A ${gender} wearing ${outfit.outerwear}, ${outfit.baseLayer} and ${outfit.lowerBody}. Location: ${weather.location} street. Clear visibility.`;
  
  const response: any = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: { imageConfig: { aspectRatio: "3:4", imageSize: "1K" } }
  });

  const urls: string[] = [];
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) urls.push(`data:image/png;base64,${part.inlineData.data}`);
  }
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
