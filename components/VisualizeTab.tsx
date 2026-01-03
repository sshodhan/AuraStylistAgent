
import React, { useState } from 'react';
import { OutfitSuggestion, WeatherData, TempUnit } from '../types';
import { generateOutfitImage } from '../services/geminiService';
import { Sparkles, Download, RefreshCw, Loader2, Camera, AlertCircle } from 'lucide-react';

interface Props {
  outfit: OutfitSuggestion | null;
  weather: WeatherData | null;
  unit: TempUnit;
}

const VisualizeTab: React.FC<Props> = ({ outfit, weather, unit }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [size, setSize] = useState<"1K" | "2K" | "4K">("1K");
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!outfit || !weather) return;
    
    // Check for API key selection (simulated for environment)
    if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
        // Continue after returning from selection
      }
    }

    setLoading(true);
    setError(null);
    try {
      const url = await generateOutfitImage(outfit, weather, size, unit);
      setImageUrl(url);
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) {
        setError("Please re-select your API key with a paid project.");
        if (typeof (window as any).aistudio?.openSelectKey === 'function') {
           await (window as any).aistudio.openSelectKey();
        }
      } else {
        setError("Failed to generate image. Ensure you've selected an API key from a paid project.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!outfit) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4">
        <div className="bg-gray-100 p-6 rounded-full">
          <Camera className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">No outfit to visualize</h3>
        <p className="text-gray-500 max-w-xs">Please generate an outfit in the Stylist tab first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="text-indigo-600" />
          AI Visualization Lab
        </h2>
        <p className="text-sm text-gray-500">
          Using Gemini 3 Pro to render your look for {weather?.location}'s ${unit === 'F' ? (weather!.temp * 9/5 + 32).toFixed(0) : weather!.temp}°${unit} weather.
        </p>

        <div className="flex gap-2">
          {["1K", "2K", "4K"].map((s) => (
            <button
              key={s}
              onClick={() => setSize(s as any)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                size === s 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {s} Res
            </button>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold hover:opacity-90 transition-all flex justify-center items-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" /> : (imageUrl ? "Regenerate Look" : "Generate Visual")}
        </button>

        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <AlertCircle className="w-3 h-3" />
          <span>Requires API key from a paid GCP project. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline">Learn more</a></span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="aspect-[3/4] bg-gray-100 rounded-3xl flex flex-col items-center justify-center space-y-4 border-2 border-dashed border-gray-200">
          <div className="relative">
             <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
             <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" />
          </div>
          <p className="text-gray-500 font-medium animate-pulse">Designing your editorial look...</p>
        </div>
      )}

      {imageUrl && !loading && (
        <div className="space-y-4 animate-in zoom-in-95 duration-500">
          <div className="relative group overflow-hidden rounded-3xl shadow-2xl border-4 border-white">
            <img src={imageUrl} alt="AI Outfit Visualization" className="w-full h-auto" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <a 
                href={imageUrl} 
                download="aura-outfit.png"
                className="p-4 bg-white rounded-full text-indigo-600 hover:scale-110 transition-transform"
              >
                <Download className="w-6 h-6" />
              </a>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border flex items-center justify-between">
            <div className="text-xs">
              <p className="font-bold text-gray-900">Generated at {size} resolution</p>
              <p className="text-gray-500">Model: Gemini 3 Pro Image</p>
            </div>
            <button onClick={handleGenerate} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualizeTab;
