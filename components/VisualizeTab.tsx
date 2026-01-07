
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OutfitSuggestion, WeatherData, TempUnit, AppTab, VideoResolution } from '../types';
import { generateOutfitImages, generateVeoVideo } from '../services/geminiService';
import { Sparkles, Download, Loader2, Camera, AlertCircle, ImageIcon, X, Zap, ChevronDown, Volume2, Mic, Film, Play, ChevronLeft, Shirt, Info, ShieldCheck, Lock, Upload } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoStatus, setVideoStatus] = useState("");
  const [showVideoModal, setShowVideoModal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (autoTrigger && outfit && weather && !imageUrls && !loading) handleGenerate();
  }, [autoTrigger, outfit, weather, imageUrls]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImagesUpdate([reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateVideo = async () => {
    if (!imageUrls || imageUrls.length === 0) return;
    setVideoLoading(true);
    setShowVideoModal(true);
    setVideoUrl(null);
    try {
      // Identity is preserved from the first image provided
      const url = await generateVeoVideo(imageUrls, "A fluid professional walking shot", '720p', (s) => setVideoStatus(s));
      setVideoUrl(url);
    } catch (err: any) {
      setError(err.message);
      setShowVideoModal(false);
    } finally {
      setVideoLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!outfit || !weather) return;
    setLoading(true);
    setError(null);
    try {
      const urls = await generateOutfitImages(outfit, weather, "1K", unit);
      onImagesUpdate(urls);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!outfit) return null;

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 px-1">
        <button onClick={() => onTabChange(AppTab.STYLIST)} className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-500 shadow-sm"><ChevronLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest">Portrait Runway</h2>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Likeness Lock Active</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm mx-1 space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3 text-indigo-600" />
            <span className="text-[9px] font-black uppercase text-gray-900 tracking-widest">Single Frame Anchor</span>
          </div>
          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Vercel 720p Mode</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleGenerate} disabled={loading} className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest active:scale-95 shadow-lg disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Render AI Outfit"}
          </button>
          
          <button onClick={() => fileInputRef.current?.click()} className="py-4 bg-white border border-gray-200 text-gray-900 rounded-2xl font-black text-[9px] uppercase tracking-widest active:scale-95 flex items-center justify-center gap-2">
            <Upload className="w-3.5 h-3.5" />
            Use My Photo
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        </div>
      </div>

      {imageUrls && imageUrls.length > 0 && (
        <div className="space-y-6 px-1">
          <div className="bg-gray-950 p-8 rounded-[3.5rem] flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden">
            {/* Glossy Backdrop Decoration */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
            
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-600 blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="w-28 h-28 rounded-3xl border-2 border-white/20 overflow-hidden shadow-2xl rotate-2 relative z-10">
                <img src={imageUrls[0]} className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="text-center space-y-2 z-10">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Identity Sync Ready</h3>
              <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-[0.2em] opacity-80">Preserving 1:1 Likeness</p>
            </div>
            
            <button 
              onClick={handleGenerateVideo}
              disabled={videoLoading}
              className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all relative z-10"
            >
              <Film className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Generate 9:16 Runway</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {imageUrls.map((url, i) => (
              <div key={i} className="aspect-[3/4] rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 relative group">
                <img src={url} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md p-2 rounded-full text-white">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 text-rose-600 p-5 rounded-[2rem] text-[10px] font-black uppercase border border-rose-100 mx-1 flex items-center gap-3">
          <AlertCircle className="w-4 h-4" />
          <p className="flex-1">{error}</p>
        </div>
      )}

      <AnimatePresence>
        {showVideoModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4">
            <button onClick={() => setShowVideoModal(false)} className="absolute top-6 right-6 p-4 bg-white/10 rounded-full text-white z-[120] hover:bg-white/20"><X className="w-6 h-6" /></button>
            
            <div className="w-full max-w-[400px] aspect-[9/16] bg-gray-900 rounded-[3rem] overflow-hidden relative border border-white/10 shadow-2xl">
              {videoLoading ? (
                <div className="h-full w-full flex flex-col items-center justify-center p-12 text-center gap-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-indigo-600 blur-3xl opacity-20 animate-pulse" />
                    <Loader2 className="w-16 h-16 text-indigo-500 animate-spin relative z-10" />
                    <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-white animate-pulse" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-[11px] font-black text-white uppercase tracking-widest animate-pulse">{videoStatus || "Syncing Persona..."}</p>
                    <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Likeness anchoring takes ~60-90s</p>
                  </div>
                </div>
              ) : videoUrl ? (
                <>
                  <video ref={videoRef} src={videoUrl} autoPlay loop playsInline className="w-full h-full object-cover" />
                  <div className="absolute bottom-8 right-8 z-[110] flex flex-col items-end gap-1.5 pointer-events-none opacity-80">
                    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Identity Lock • Aura AI</span>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {videoUrl && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-8 flex gap-3">
                <a href={videoUrl} download="aura-runway.mp4" className="px-10 py-5 bg-indigo-600 text-white rounded-3xl font-black text-[11px] uppercase tracking-widest shadow-2xl flex items-center gap-3 active:scale-95 transition-all">
                  <Download className="w-4 h-4" />
                  Save Runway
                </a>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VisualizeTab;
