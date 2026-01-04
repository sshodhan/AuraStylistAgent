
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WeatherData, OutfitSuggestion, TempUnit } from "../types";

const convertTemp = (c: number, unit: TempUnit) => unit === 'F' ? (c * 9/5 + 32).toFixed(1) : c;

// Generates an outfit suggestion based on weather and context
export const getOutfitSuggestion = async (weather: WeatherData, context: string = "casual", unit: TempUnit = 'F'): Promise<OutfitSuggestion> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const displayTemp = convertTemp(weather.temp, unit);
  
  const prompt = `
    You are a professional fashion stylist. A client is in ${weather.location}.
    The current weather is:
    - Temperature: ${displayTemp}°${unit}
    - Precipitation: ${weather.precip}mm
    - Wind Speed: ${weather.wind}km/h
    - Context: ${context}

    Style Rules:
    1. If humidity is >80%, suggest breathable fabrics like linen.
    2. If wind is >20km/h, prioritize windbreakers or scarves.
    3. Consider the context: "${context}".

    Suggest a specific outfit. Provide reasoning and pro-tips using the temperature unit °${unit}.
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
        },
        required: ["baseLayer", "outerwear", "footwear", "proTip", "styleReasoning"]
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
    Write a chic, professional, and brief "Daily Styling Digest" for a client named ${userName || 'Fashionista'}.
    Location: ${weather.location}
    Conditions: ${displayTemp}°${unit}, ${weather.precip}mm precip, ${weather.wind}km/h winds.
    Recommended Look:
    - Base: ${outfit.baseLayer}
    - Outerwear: ${outfit.outerwear}
    - Footwear: ${outfit.footwear}
    - Stylist Tip: ${outfit.proTip}

    Tone: Sophisticated, helpful, and concise. 
    Do NOT include a subject line in the text output, just the body content.
    Greet them warmly at the beginning.
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

// Generates a singular outfit image, optionally using a user reference image
export const generateOutfitImage = async (
  outfit: OutfitSuggestion, 
  weather: WeatherData, 
  size: "1K" | "2K" | "4K" = "1K", 
  unit: TempUnit = 'F', 
  subject: string = "a stylish person",
  userImage?: string // base64 data
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const displayTemp = convertTemp(weather.temp, unit);
  
  const subjectDescription = userImage 
    ? `this specific person shown in the reference image, realistically dressed in the new outfit while maintaining their likeness`
    : subject;

  const prompt = `High-fashion editorial photo of ${subjectDescription} in ${weather.location}. 
  STYLING VERDICT TO FOLLOW EXACTLY:
  - Base: ${outfit.baseLayer}
  - Outerwear: ${outfit.outerwear}
  - Shoes: ${outfit.footwear}
  - Stylist Note: ${outfit.proTip}
  
  ATMOSPHERE: ${displayTemp}°${unit} weather, cinematic lighting, photorealistic, 8k resolution.`;
  
  const parts: any[] = [{ text: prompt }];
  
  if (userImage) {
    parts.push({
      inlineData: {
        data: userImage.split(',')[1] || userImage, // Remove prefix if exists
        mimeType: 'image/jpeg'
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: parts
    },
    config: {
      imageConfig: {
        aspectRatio: "3:4",
        imageSize: size
      }
    }
  });

  if (!response.candidates?.[0]?.content?.parts) {
    throw new Error("Generation failed for the variation.");
  }

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image data found.");
};

// Generates multiple variations for lookbook
export const generateOutfitImages = async (
  outfit: OutfitSuggestion, 
  weather: WeatherData, 
  size: "1K" | "2K" | "4K" = "1K", 
  unit: TempUnit = 'F',
  userImage?: string
): Promise<string[]> => {
  // If user provides an image, we focus on personalizing it specifically
  if (userImage) {
    const p1 = generateOutfitImage(outfit, weather, size, unit, "personalized look", userImage);
    const p2 = generateOutfitImage(outfit, weather, size, unit, "alternate personalized look", userImage);
    const p3 = generateOutfitImage(outfit, weather, size, unit, "stylized personalized look", userImage);
    return Promise.all([p1, p2, p3]);
  }

  const subjects = [
    "a stylish woman wearing a feminine, high-fashion interpretation of the outfit with elegant styling",
    "a stylish man wearing a masculine, high-fashion version of the outfit",
    "a diverse biracial pair of people (including a person of color) together in high-fashion coordinated looks"
  ];

  return Promise.all(subjects.map(subject => generateOutfitImage(outfit, weather, size, unit, subject)));
};

// Generates a cinematic hero image of the current weather conditions
export const generateWeatherHeroImage = async (weather: WeatherData, unit: TempUnit = 'F'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const displayTemp = convertTemp(weather.temp, unit);
  
  const prompt = `A cinematic landscape photograph of ${weather.location} showing the actual atmospheric weather conditions: ${displayTemp}°${unit}, ${weather.precip}mm rain/snow, and ${weather.wind}km/h wind. Focus on the sky, lighting, and mood. Photorealistic, wide-angle.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9"
      }
    }
  });

  if (!response.candidates?.[0]?.content?.parts) {
    throw new Error("No weather hero generated.");
  }

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No weather hero image data found.");
};

// Retrieves local store locations using Google Maps grounding
export const getStoreLocations = async (location: string, outfitItem: string, lat: number, lon: number) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Find high-quality clothing stores near ${location} (Lat: ${lat}, Lon: ${lon}) where I can buy ${outfitItem}.`,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lon
          }
        }
      }
    }
  });

  const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.filter((chunk: any) => chunk.maps)
    ?.map((chunk: any) => ({
      uri: chunk.maps.uri,
      title: chunk.maps.title
    })) || [];

  return {
    text: response.text || "",
    links
  };
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
