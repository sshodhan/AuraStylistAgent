
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OutfitSuggestion, WeatherData, TempUnit, AppTab } from '../types';
import { generateOutfitImages, editImage } from '../services/geminiService';
import { Sparkles, Download, Loader2, Camera, AlertCircle, Layers, ChevronLeft, User, Image as ImageIcon, X, Zap, ChevronDown, Wand2, Send, Wand, Globe } from 'lucide-react';

interface Props {
  outfit: OutfitSuggestion | null;
  weather: WeatherData | null;
  unit: TempUnit;
  imageUrls: string[] | null;
  onImagesUpdate: (urls: string[] | null) => void;
  onTabChange: (tab: AppTab) => void;
  autoTrigger?: boolean;
}

const VisualizeTab: React.FC<Props> = ({ outfit, weather, unit, imageUrls, onImagesUpdate, onTabChange, autoTrigger }) => {
  const [loading, setLoading] = useState(false);
  const [size, setSize] = useState<"1K" | "2K" | "4K">("1K");
  const [error, setError] = useState<string | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [isHubExpanded, setIsHubExpanded] = useState(true);
  const [pulseInput, setPulseInput] = useState(false);
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoTrigger && outfit && weather && !imageUrls && !loading) {
      handleGenerate();
    }
  }, [autoTrigger, outfit, weather, imageUrls]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUserPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!outfit || !weather) return;
    if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) await (window as any).aistudio.openSelectKey();
    }
    setLoading(true);
    setError(null);
    setEditingIndex(null);
    setIsHubExpanded(false);
    try {
      const urls = await generateOutfitImages(outfit, weather, size, unit, userPhoto || undefined);
      onImagesUpdate(urls);
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) {
        setError("Please re-select your API key with a paid project.");
        if (typeof (window as any).aistudio?.openSelectKey === 'function') await (window as any).aistudio.openSelectKey();
      } else {
        setError("Rendering failed. Verify your API key status.");
      }
      setIsHubExpanded(true);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyEdit = async (index: number) => {
    if (!imageUrls || !editPrompt.trim()) return;
    setIsEditing(true);
    setError(null);
    try {
      const editedUrl = await editImage(imageUrls[index], editPrompt);
      const newUrls = [...imageUrls];
      newUrls[index] = editedUrl;
      onImagesUpdate(newUrls);
      setEditPrompt("");
      setEditingIndex(null);
    } catch (err: any) {
      setError("Magic Retouch failed. Try a different prompt.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setEditPrompt(suggestion);
    setPulseInput(true);
    setTimeout(() => setPulseInput(false), 600);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  if (!outfit) return null;

  const variationsLabel = ["Modernist", "Avant-Garde", "Urban Heritage"];

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 px-1">
        <button onClick={() => onTabChange(AppTab.STYLIST)} className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-500 hover:text-indigo-600 shadow-sm transition-all active:scale-95">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest">Style Studio</h2>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Personalized Fit Lab</p>
        </div>
      </div>

      <div className={`relative group overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] transition-all duration-500 ${isHubExpanded ? 'p-6 shadow-xl' : 'p-4'}`}>
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsHubExpanded(!isHubExpanded)}>
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 text-indigo-300 transition-transform ${isHubExpanded ? 'rotate-0' : 'rotate-12'}`} />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100">Virtual Mirror</h3>
            {!isHubExpanded && userPhoto && (
              <div className="w-5 h-5 rounded-full overflow-hidden border border-white/40 ml-1">
                <img src={userPhoto} alt="Ref" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-white transition-transform ${isHubExpanded ? 'rotate-180' : 'rotate-0'}`} />
        </div>
        <AnimatePresence>
          {isHubExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="space-y-4 pt-4 text-white">
                <h2 className="text-lg font-black tracking-tight">Personalize Your Look</h2>
                <p className="text-[10px] opacity-80 font-medium leading-relaxed max-w-[240px]">Map Aura's styling verdicts directly onto your photo using Gemini 3 Pro reasoning.</p>
                <div className="pt-2">
                  {userPhoto ? (
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0"><img src={userPhoto} alt="Ref" className="w-full h-full object-cover" /></div>
                      <div className="flex-1">
                        <p className="text-[9px] font-black uppercase text-indigo-100">Identity Active</p>
                        <p className="text-[8px] opacity-60">Personalized Mode Engaged</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setUserPhoto(null); }} className="p-1.5"><X className="w-4 h-4 text-white" /></button>
                    </div>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="w-full py-4 bg-white/20 backdrop-blur-md border-2 border-dashed border-white/40 rounded-2xl flex flex-col items-center justify-center gap-2">
                      <ImageIcon className="w-5 h-5 opacity-80" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Upload your photo</span>
                    </button>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-white p-5 rounded-[2.5rem] border border-gray-100 space-y-4 mx-1 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black flex items-center gap-2 text-gray-900 uppercase tracking-widest">Style Lab</h2>
          <div className="bg-indigo-50 px-2 py-1 rounded-md"><span className="text-[8px] font-black text-indigo-600 uppercase">Gemini 3 Pro</span></div>
        </div>
        <button onClick={handleGenerate} disabled={loading} className={`w-full py-4 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] transition-all flex justify-center items-center gap-3 active:scale-95 shadow-xl ${userPhoto ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-gray-900 text-white shadow-gray-200'}`}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{userPhoto ? "Personalized Fit Check" : "Generate Range Brief"}</>}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-3 border border-red-100 mx-1"><AlertCircle className="w-4 h-4 shrink-0" /><p>{error}</p></div>}

      <div className="space-y-12">
        {loading ? (
          <div className="mx-1 aspect-[3/4] bg-gray-50 rounded-[3rem] border border-gray-100 flex flex-col items-center justify-center space-y-6">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <div className="text-center px-12">
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Synthesizing Imagery...</p>
              <p className="text-[8px] text-gray-400 font-bold uppercase mt-1">Aura is rendering high-fidelity looks for ${weather!.location}...</p>
            </div>
          </div>
        ) : imageUrls ? (
          <div className="space-y-12 px-1">
            {imageUrls.map((url, idx) => (
              <div key={idx} className="space-y-4">
                <div className="relative aspect-[3/4] bg-gray-50 rounded-[3.5rem] overflow-hidden border border-gray-100 shadow-2xl animate-in zoom-in-95">
                  <img src={url} alt={`Option ${idx + 1}`} className="w-full h-full object-cover" />
                  
                  {/* Updated Overlay from Screenshot */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-10 flex justify-between items-end">
                    <div className="text-white space-y-1.5">
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80">Look Details</p>
                      <h4 className="text-[15px] font-black leading-snug max-w-[180px] uppercase tracking-tighter">
                        {outfit.outerwear.split(' ').slice(0, 3).join(' ')} + {outfit.baseLayer.split(' ').slice(0, 2).join(' ')}
                      </h4>
                      <div className="flex items-center gap-2 pt-1">
                         <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                         <span className="text-[8px] font-black uppercase tracking-widest text-indigo-200">
                           {userPhoto ? "Personalized Render" : `${variationsLabel[idx]} Vibe`}
                         </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => setEditingIndex(editingIndex === idx ? null : idx)} className={`p-4 rounded-2xl transition-all ${editingIndex === idx ? 'bg-indigo-600 text-white' : 'bg-white/10 backdrop-blur-md text-white border border-white/20'}`}>
                        <Wand2 className="w-5 h-5" />
                      </button>
                      <a href={url} download={`aura-${idx+1}.png`} className="p-4 bg-white rounded-2xl text-indigo-600 shadow-xl active:scale-95 transition-all">
                        <Download className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {editingIndex === idx && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2.5rem] space-y-4 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <Wand className="w-3.5 h-3.5 text-indigo-600" />
                        <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Magic Retouch (2.5 Flash)</h4>
                      </div>
                      <div className="relative">
                        <input type="text" value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} placeholder="e.g. 'Add a rain effect' or 'Make it BW'" className="w-full bg-white border border-indigo-100 rounded-2xl px-5 py-4 text-xs font-medium outline-none pr-16 shadow-sm focus:ring-4 focus:ring-indigo-600/10" />
                        <button onClick={() => handleApplyEdit(idx)} disabled={isEditing || !editPrompt.trim()} className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 text-white rounded-xl">
                          {isEditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        ) : (
          <div className="mx-1 aspect-[3/4] bg-gray-50 rounded-[3rem] flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-40 border border-gray-100">
            <Camera className="w-10 h-10 text-gray-300" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-relaxed px-6">Render today's styling verdict into high-fidelity imagery.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizeTab;
