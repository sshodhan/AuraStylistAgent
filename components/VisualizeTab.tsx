
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
  
  // Edit State
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-generate if triggered from Stylist tab
  useEffect(() => {
    if (autoTrigger && outfit && weather && !imageUrls && !loading) {
      handleGenerate();
    }
  }, [autoTrigger, outfit, weather, imageUrls]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
    setEditingIndex(null);
    setIsHubExpanded(false);

    try {
      const urls = await generateOutfitImages(outfit, weather, size, unit, userPhoto || undefined);
      onImagesUpdate(urls);
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) {
        setError("Please re-select your API key with a paid project.");
        if (typeof (window as any).aistudio?.openSelectKey === 'function') {
           await (window as any).aistudio.openSelectKey();
        }
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
    // Visual focus
    setTimeout(() => inputRef.current?.focus(), 50);
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
        <button 
          onClick={() => onTabChange(AppTab.STYLIST)}
          className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-6 py-3 rounded-xl"
        >
          Go to Stylist
        </button>
      </div>
    );
  }

  const variationsLabel = ["Modernist", "Avant-Garde", "Urban Heritage"];

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-500">
      {/* Back Header */}
      <div className="flex items-center gap-3 px-1">
        <button 
          onClick={() => onTabChange(AppTab.STYLIST)}
          className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-500 hover:text-indigo-600 shadow-sm transition-all active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest">Style Studio</h2>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Personalized Fit Lab</p>
        </div>
      </div>

      {/* Collapsible Personalization Hub */}
      <div className={`relative group overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] shadow-xl shadow-indigo-100/50 transition-all duration-500 ${isHubExpanded ? 'p-6' : 'p-4'}`}>
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsHubExpanded(!isHubExpanded)}>
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 text-indigo-300 transition-transform duration-500 ${isHubExpanded ? 'rotate-0' : 'rotate-12'}`} />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100">Virtual Mirror</h3>
            {!isHubExpanded && userPhoto && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-5 h-5 rounded-full overflow-hidden border border-white/40 ml-1"
              >
                <img src={userPhoto} alt="Ref" className="w-full h-full object-cover" />
              </motion.div>
            )}
          </div>
          <button className="p-1 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
            <ChevronDown className={`w-4 h-4 text-white transition-transform duration-500 ${isHubExpanded ? 'rotate-180' : 'rotate-0'}`} />
          </button>
        </div>

        <AnimatePresence>
          {isHubExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "circOut" }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pt-4 relative z-10 text-white">
                <div className="absolute top-0 right-0 p-4 opacity-10 -z-10">
                  <Sparkles className="w-24 h-24 text-white" />
                </div>
                
                <h2 className="text-lg font-black tracking-tight leading-tight">Personalize Your Look</h2>
                <p className="text-[10px] opacity-80 font-medium leading-relaxed max-w-[240px]">
                  Aura's reasoning engine will render today's recommendation directly onto your provided photo.
                </p>

                <div className="pt-2">
                  {userPhoto ? (
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/40 shrink-0">
                        <img src={userPhoto} alt="Ref" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-indigo-100">Ready to Render</p>
                        <p className="text-[8px] opacity-60">Personalized Fit Check Enabled</p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setUserPhoto(null);
                        }}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="w-full py-4 bg-white/20 hover:bg-white/30 backdrop-blur-md border-2 border-dashed border-white/40 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                      <ImageIcon className="w-5 h-5 opacity-80" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Upload your photo</span>
                    </button>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handlePhotoUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Studio Controls */}
      <div className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4 mx-1">
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
          className={`w-full py-4 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] transition-all flex justify-center items-center gap-3 active:scale-[0.98] shadow-xl ${
            userPhoto 
              ? 'bg-gradient-to-r from-indigo-600 to-violet-700 text-white shadow-indigo-100' 
              : 'bg-gray-900 text-white shadow-gray-200'
          }`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              {userPhoto && <Zap className="w-4 h-4" />}
              {userPhoto ? "Personalized Fit Check" : "Generate Range Brief"}
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-3 border border-red-100 mx-1">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Gallery Section */}
      <div className="space-y-6">
        {loading ? (
          <div className="mx-1 aspect-[3/4] bg-gray-50 rounded-[3rem] border border-gray-100 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
               <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
               <Camera className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 w-6 h-6" />
            </div>
            <div className="text-center space-y-1 px-12">
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest animate-pulse">
                {userPhoto ? "Rendering Your Likeness" : "Rendering Global Range"}
              </p>
              <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">
                {userPhoto 
                  ? "Aura is carefully mapping the recommendation onto your photo..." 
                  : "Depicting a range of stylish individuals in varied urban contexts..."}
              </p>
            </div>
          </div>
        ) : imageUrls ? (
          <div className="space-y-8 px-1">
            {imageUrls.map((url, idx) => (
              <div key={idx} className="space-y-3">
                <div className="relative aspect-[3/4] bg-gray-50 rounded-[3rem] overflow-hidden border border-gray-100 shadow-lg animate-in zoom-in-95 duration-500">
                  <img src={url} alt={`Option ${idx + 1}`} className="w-full h-full object-cover" />
                  
                  {/* Overlay Controls */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 p-8 flex justify-between items-end">
                    <div className="text-white">
                      <div className="flex items-center gap-2 mb-1 opacity-60">
                         {userPhoto ? <User className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                         <p className="text-[8px] font-black uppercase tracking-widest">
                           {userPhoto ? "Personalized Look" : `${variationsLabel[idx]} Interpretation`}
                         </p>
                      </div>
                      <p className="text-xs font-bold leading-tight line-clamp-2 max-w-[160px]">{outfit.outerwear}</p>
                    </div>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => setEditingIndex(editingIndex === idx ? null : idx)}
                        className={`p-4 rounded-2xl shadow-2xl active:scale-90 transition-all ${editingIndex === idx ? 'bg-indigo-600 text-white' : 'bg-white/20 backdrop-blur-md text-white border border-white/20'}`}
                      >
                        <Wand2 className="w-5 h-5" />
                      </button>
                      <a 
                        href={url} 
                        download={`aura-look-${idx+1}.png`}
                        className="p-4 bg-white rounded-2xl text-indigo-600 shadow-2xl active:scale-90 transition-all"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Magic Retouch Interface */}
                <AnimatePresence mode="wait">
                  {editingIndex === idx && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-indigo-50 border border-indigo-100 p-4 rounded-[2rem] space-y-3 overflow-hidden"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Wand className="w-3.5 h-3.5 text-indigo-600" />
                        <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Magic Retouch (Nano Banana)</h4>
                      </div>
                      <div className="relative">
                        <motion.div
                          animate={pulseInput ? { scale: [1, 1.02, 1], boxShadow: ["0px 0px 0px rgba(79, 70, 229, 0)", "0px 0px 15px rgba(79, 70, 229, 0.3)", "0px 0px 0px rgba(79, 70, 229, 0)"] } : {}}
                          transition={{ duration: 0.4 }}
                        >
                          <input 
                            type="text"
                            ref={inputRef}
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            placeholder="e.g. 'Add a retro filter' or 'Make it dusk'"
                            className="w-full bg-white border border-indigo-100 rounded-xl px-4 py-3 text-[11px] font-medium outline-none pr-20 shadow-sm focus:ring-2 focus:ring-indigo-600/20"
                          />
                        </motion.div>
                        <div className="absolute right-1.5 top-1.5 bottom-1.5 flex gap-1">
                          {editPrompt && (
                            <button 
                              onClick={() => setEditPrompt("")}
                              className="px-2 text-gray-300 hover:text-gray-500 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleApplyEdit(idx)}
                            disabled={isEditing || !editPrompt.trim()}
                            className="px-3 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 transition-colors"
                          >
                            {isEditing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      
                      {userPhoto && (
                        <div className="flex items-center gap-2 px-1 py-0.5">
                          <User className="w-2.5 h-2.5 text-indigo-400" />
                          <p className="text-[7px] font-black text-indigo-400 uppercase tracking-widest">Likeness Protection Active</p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-1">
                        {["Retro filter", "BW photo", "Golden hour", "Cyberpunk", "Remove background"].map(suggestion => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className={`text-[8px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all active:scale-95 ${
                              editPrompt === suggestion 
                                ? 'bg-indigo-600 text-white border-transparent' 
                                : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50'
                            }`}
                          >
                            {suggestion}
                          </button>
                        ))}
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
            <div className="text-center space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ready for Command</p>
              <p className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter px-12 leading-relaxed">Click generate or upload a photo to visualize today's styling verdict.</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2 text-[8px] text-gray-400 font-black uppercase tracking-widest px-4">
        <AlertCircle className="w-3 h-3" />
        <span>Paid API Project Required for high-res lookbook renders</span>
      </div>
    </div>
  );
};

export default VisualizeTab;
