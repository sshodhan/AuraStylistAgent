
import React, { useState } from 'react';
import { OutfitSuggestion, WeatherData, TempUnit } from '../types';
import { generateOutfitImage } from '../services/geminiService';
import { Sparkles, Download, RefreshCw, Loader2, Camera, AlertCircle, Layers } from 'lucide-react';

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
    
    if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
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
        setError("Rendering failed. Check API key status.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!outfit) {
    return (
      <div className="h-[70dvh] flex flex-col items-center justify-center p-12 text-center space-y-6">
        <div className="bg-gray-50 p-8 rounded-full border border-gray-100">
          <Layers className="w-12 h-12 text-gray-300" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-black text-gray-900 tracking-tight">Studio Idle</h3>
          <p className="text-xs text-gray-400 font-medium max-w-[200px]">Generate a styling verdict first to unlock the visual lab.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-500">
      {/* Studio Controls */}
      <div className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black flex items-center gap-2 text-gray-900 uppercase tracking-widest">
            <Sparkles className="text-indigo-600 w-4 h-4" />
            Style Lab
          </h2>
          <div className="bg-indigo-50 px-2 py-1 rounded-md">
            <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">Gemini 3 Pro</span>
          </div>
        </div>

        <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-100">
          {["1K", "2K", "4K"].map((s) => (
            <button
              key={s}
              onClick={() => setSize(s as any)}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all ${
                size === s 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all flex justify-center items-center gap-3 active:scale-[0.98] shadow-xl shadow-gray-200"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (imageUrl ? "Regenerate Image" : "Develop Visual")}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-3 border border-red-100">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Image Canvas */}
      <div className="relative aspect-[3/4] bg-gray-50 rounded-[3rem] overflow-hidden border border-gray-100 shadow-inner group">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
               <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
               <Camera className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest animate-pulse">Processing Editorial</p>
              <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Applying lighting & climate textures</p>
            </div>
          </div>
        ) : imageUrl ? (
          <div className="h-full w-full animate-in zoom-in-95 duration-500">
            <img src={imageUrl} alt="Editorial" className="w-full h-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-8 flex justify-between items-end">
              <div className="text-white">
                <p className="text-[8px] font-black opacity-60 uppercase tracking-widest mb-1">Context</p>
                <p className="text-xs font-bold leading-tight line-clamp-2 max-w-[150px]">{outfit.baseLayer}</p>
              </div>
              <a 
                href={imageUrl} 
                download="aura-editorial.png"
                className="p-4 bg-white rounded-2xl text-indigo-600 shadow-2xl active:scale-90 transition-all"
              >
                <Download className="w-5 h-5" />
              </a>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-40">
            <Camera className="w-10 h-10 text-gray-300" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Canvas Ready</p>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2 text-[8px] text-gray-400 font-black uppercase tracking-widest px-4">
        <AlertCircle className="w-3 h-3" />
        <span>Paid Tier Required for Image Ops</span>
      </div>
    </div>
  );
};

export default VisualizeTab;
