
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OutfitSuggestion, WeatherData, TempUnit, AppTab, VideoResolution } from '../types';
import { generateOutfitImages, generateVeoVideo } from '../services/geminiService';
import { Sparkles, Download, Loader2, Camera, AlertCircle, ImageIcon, X, Zap, ChevronDown, Volume2, Mic, Film, Play, ChevronLeft, Shirt, Info, ShieldCheck, Lock } from 'lucide-react';

interface Props {
  outfit: OutfitSuggestion | null;
  weather: WeatherData | null;
  unit: TempUnit;
  imageUrls: string[] | null;
  onImagesUpdate: (urls: string[] | null) => void;
  onTabChange: (tab: AppTab) => void;
  autoTrigger?: boolean;
}

const DAILY_LIMIT = 200;

const VisualizeTab: React.FC<Props> = ({ outfit, weather, unit, imageUrls, onImagesUpdate, onTabChange, autoTrigger }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoStatus, setVideoStatus] = useState("");
  const [showVideoModal, setShowVideoModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (autoTrigger && outfit && weather && !imageUrls && !loading) handleGenerate();
  }, [autoTrigger, outfit, weather, imageUrls]);

  const handleGenerateVideo = async () => {
    if (!imageUrls) return;
    setVideoLoading(true);
    setShowVideoModal(true);
    setVideoUrl(null);
    try {
      const url = await generateVeoVideo(imageUrls, "Editorial walking shot", '720p', (s) => setVideoStatus(s));
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
    <div className="space-y-4 pb-12 animate-in fade-in">
      <div className="flex items-center gap-3 px-1">
        <button onClick={() => onTabChange(AppTab.STYLIST)} className="p-2.5 bg-white border border-gray-100 rounded-xl"><ChevronLeft className="w-5 h-5" /></button>
        <div className="flex-1">
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest">Style Studio</h2>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">720p Identity Lock Active</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm mx-1 space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3 text-indigo-600" />
            <span className="text-[9px] font-black uppercase text-gray-900 tracking-widest">Two-Frame Anchor</span>
          </div>
        </div>
        <button onClick={handleGenerate} disabled={loading} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest active:scale-95 shadow-xl disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Render Variations"}
        </button>
      </div>

      {imageUrls && (
        <div className="space-y-8 px-1">
          <div className="bg-gray-900 p-8 rounded-[3.5rem] flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-4 left-4 bg-white/10 px-3 py-1 rounded-full border border-white/10">
              <span className="text-[8px] font-black text-white uppercase tracking-widest">Vercel-Ready | 720p</span>
            </div>
            <div className="text-center space-y-2 pt-4">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Motion Preview</h3>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Syncing start and end identity frames</p>
            </div>
            <button 
              onClick={handleGenerateVideo}
              disabled={videoLoading}
              className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
            >
              <Film className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Launch 720p Runway</span>
            </button>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {imageUrls.map((url, i) => (
              <div key={i} className="aspect-[3/4] rounded-[3rem] overflow-hidden shadow-xl border border-gray-100">
                <img src={url} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showVideoModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4">
            <button onClick={() => setShowVideoModal(false)} className="absolute top-6 right-6 p-4 bg-white/10 rounded-full text-white z-[120]"><X className="w-6 h-6" /></button>
            <div className="w-full max-w-[400px] aspect-[9/16] bg-gray-900 rounded-[3rem] overflow-hidden relative border border-white/10 shadow-2xl">
              {videoLoading ? (
                <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center gap-6">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{videoStatus}</p>
                </div>
              ) : videoUrl ? (
                <>
                  <video ref={videoRef} src={videoUrl} autoPlay loop playsInline className="w-full h-full object-cover" />
                  {/* WATERMARK OVERLAY */}
                  <div className="absolute bottom-6 right-6 z-[110] flex flex-col items-end gap-1 pointer-events-none opacity-60">
                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                      <ShieldCheck className="w-3 h-3 text-indigo-400" />
                      <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">Aura AI • Runway</span>
                    </div>
                    <span className="text-[7px] font-bold text-white/40 uppercase mr-1">720p Identity Optimized</span>
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VisualizeTab;
