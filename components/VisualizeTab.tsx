
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OutfitSuggestion, WeatherData, TempUnit, AppTab } from '../types';
import { generateOutfitImages, generateVeoVideo } from '../services/geminiService';
import { Sparkles, Download, Loader2, Camera, AlertCircle, ImageIcon, X, Zap, ChevronDown, Volume2, Mic, Film, Play, ChevronLeft, Shirt } from 'lucide-react';

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
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoStatus, setVideoStatus] = useState("");
  const [showVideoModal, setShowVideoModal] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [voicePrompt, setVoicePrompt] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (autoTrigger && outfit && weather && !imageUrls && !loading) {
      handleGenerate();
    }
  }, [autoTrigger, outfit, weather, imageUrls]);

  // Voice Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setVoicePrompt(transcript);
          setIsRecording(false);
        };
        recognitionRef.current.onerror = () => setIsRecording(false);
        recognitionRef.current.onend = () => setIsRecording(false);
      } catch (err) {
        console.warn("Speech Recognition failed to initialize", err);
      }
    }
  }, []);

  const handleToggleRecording = () => {
    if (!recognitionRef.current) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setVoicePrompt("");
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Recording start error", err);
        setIsRecording(false);
      }
    }
  };

  const handleGenerateVideo = async () => {
    if (!imageUrls || imageUrls.length === 0) return;
    
    setVideoLoading(true);
    setError(null);
    setVideoUrl(null);
    setShowVideoModal(true);
    
    const archetype = localStorage.getItem('aura_style_archetype') || "Sophisticated Minimalist";
    const gender = localStorage.getItem('aura_gender') || "Female";

    // IDENTITY-LOCKED RUNWAY PROMPT
    const basePrompt = `
      HIGH-END EDITORIAL RUNWAY CINEMATOGRAPHY.
      SUBJECT: A stylish ${gender} in their 30s walking towards the camera.
      COMPOSITION: Full-body vertical portrait (9:16).
      STYLE: ${archetype}.
      ENVIRONMENT: ${weather?.location} streets.
      ${voicePrompt ? `DIRECTOR COMMAND: ${voicePrompt}` : ''}
      MANDATORY: Ensure the subject's gender strictly remains ${gender} throughout the entire clip.
    `.trim();

    try {
      const url = await generateVeoVideo(imageUrls, basePrompt, (status) => setVideoStatus(status));
      setVideoUrl(url);
    } catch (err: any) {
      setError(err.message || "Veo animation stalled. Please check API settings.");
      setShowVideoModal(false);
    } finally {
      setVideoLoading(false);
      setVideoStatus("");
    }
  };

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
    setLoading(true);
    setError(null);
    setIsHubExpanded(false);

    try {
      const urls = await generateOutfitImages(outfit, weather, size, unit, userPhoto || undefined);
      onImagesUpdate(urls);
    } catch (err: any) {
      setError(err.message || "Visual synthesis encountered an atmospheric error.");
    } finally {
      setLoading(false);
    }
  };

  if (!outfit) {
    return (
      <div className="min-h-[60dvh] flex flex-col items-center justify-center p-8 space-y-6 text-center animate-in fade-in duration-500">
        <div className="bg-indigo-50 p-6 rounded-[2.5rem]">
          <Shirt className="w-12 h-12 text-indigo-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">No Outfit Selection</h2>
          <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-[240px]">
            Head back to the Stylist tab to get your professional weather-aware recommendation first.
          </p>
        </div>
        <button 
          onClick={() => onTabChange(AppTab.STYLIST)}
          className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
        >
          Go to Stylist
        </button>
      </div>
    );
  }

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
          </div>
          <ChevronDown className={`w-4 h-4 text-white transition-transform ${isHubExpanded ? 'rotate-180' : 'rotate-0'}`} />
        </div>
        <AnimatePresence>
          {isHubExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="space-y-4 pt-4 text-white">
                <h2 className="text-lg font-black tracking-tight">Personalize Identity</h2>
                <div className="pt-2">
                  {userPhoto ? (
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0"><img src={userPhoto} alt="Ref" className="w-full h-full object-cover" /></div>
                      <div className="flex-1">
                        <p className="text-[9px] font-black uppercase text-indigo-100">Reference Active</p>
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
        <button onClick={handleGenerate} disabled={loading} className={`w-full py-4 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] transition-all flex justify-center items-center gap-3 active:scale-95 shadow-xl ${userPhoto ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-gray-900 text-white shadow-gray-200'} disabled:opacity-50`}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{userPhoto ? "Apply Personal Fit" : "Generate Styled Variation"}</>}
        </button>
        
        <div className="bg-indigo-50/50 p-4 rounded-[2rem] border border-indigo-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">Runway Motion Brief</span>
            <button onClick={handleToggleRecording} className={`p-2 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-indigo-600 shadow-sm'}`}>
              {isRecording ? <Mic className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
          <input 
            type="text" 
            value={voicePrompt} 
            onChange={(e) => setVoicePrompt(e.target.value)}
            placeholder={isRecording ? "Listening..." : "Optional: e.g. 'Walking in soft rain'"}
            className="w-full bg-transparent text-[11px] font-bold text-indigo-900 placeholder:text-indigo-300 outline-none border-b border-indigo-100 pb-1"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-600 p-5 rounded-[2rem] text-[10px] font-black uppercase flex flex-col gap-3 border border-rose-100 mx-1 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="flex-1 leading-relaxed tracking-tight">{error}</p>
          </div>
        </div>
      )}

      {/* Main Fit Previews */}
      <div className="space-y-12">
        {loading ? (
          <div className="mx-1 aspect-[3/4] bg-gray-50 rounded-[3rem] border border-gray-100 flex flex-col items-center justify-center space-y-6">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Synthesizing Identity...</p>
          </div>
        ) : imageUrls ? (
          <div className="space-y-8 px-1">
            <div className="bg-gray-900 p-8 rounded-[3.5rem] flex flex-col items-center gap-6 shadow-2xl border border-white/5">
                <div className="flex -space-x-4">
                  {imageUrls.slice(0, 3).map((url, i) => (
                    <div key={i} className="w-16 h-16 rounded-2xl border-2 border-gray-900 overflow-hidden shadow-lg rotate-3 odd:-rotate-3">
                      <img src={url} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Animate Your Identity</h3>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">Locked to your profile specifications</p>
                </div>
                <button 
                  onClick={handleGenerateVideo}
                  disabled={videoLoading}
                  className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
                >
                  <Film className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Launch Runway Preview</span>
                </button>
            </div>

            {imageUrls.map((url, idx) => (
              <div key={idx} className="relative aspect-[3/4] bg-gray-50 rounded-[3.5rem] overflow-hidden border border-gray-100 shadow-2xl group">
                <img src={url} alt={`Option ${idx + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-10 flex justify-between items-end">
                  <div className="text-white space-y-1.5">
                    <h4 className="text-[15px] font-black leading-snug max-w-[180px] uppercase tracking-tighter">
                      Persona Check 0{idx + 1}
                    </h4>
                  </div>
                  <div className="flex gap-2">
                    <a href={url} download={`aura-${idx+1}.png`} className="p-4 bg-white rounded-2xl text-indigo-600 shadow-xl active:scale-95 transition-all">
                      <Download className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mx-1 aspect-[3/4] bg-gray-50 rounded-[3rem] flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-40 border border-gray-100">
            <Camera className="w-10 h-10 text-gray-300" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Lock your identity core in settings to begin personalized synthesis.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showVideoModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-4 overflow-y-auto"
          >
            <button 
              onClick={() => {
                setShowVideoModal(false);
                setVideoUrl(null);
                setVideoLoading(false);
                setVideoStatus("");
              }}
              className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white shadow-2xl z-[110] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-full max-w-[400px] aspect-[9/16] bg-gray-900 rounded-[3rem] overflow-hidden shadow-2xl relative border border-white/10 my-auto">
              {videoLoading ? (
                <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center space-y-8">
                  <div className="relative">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="w-20 h-20 rounded-full border-t-4 border-indigo-500 border-r-4 border-transparent"
                    />
                    <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-indigo-400 animate-pulse" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-lg font-black text-white uppercase tracking-tighter">Dreaming Runway</p>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">
                      {videoStatus || "Initializing Aura Portrait Engine..."}
                    </p>
                  </div>
                </div>
              ) : videoUrl ? (
                <video 
                  ref={videoRef}
                  src={videoUrl} 
                  autoPlay 
                  loop 
                  muted={false}
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center p-12 text-center space-y-4">
                   <AlertCircle className="w-10 h-10 text-rose-500" />
                   <p className="text-[10px] font-black text-white uppercase tracking-widest">Synthesis Stalled</p>
                   <button onClick={handleGenerateVideo} className="px-6 py-3 bg-white text-black rounded-xl font-black text-[9px] uppercase tracking-widest">Retry Render</button>
                </div>
              )}
            </div>

            {videoUrl && (
              <div className="mt-6 flex gap-3 shrink-0">
                <button 
                  onClick={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause()}
                  className="px-6 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 shadow-xl active:scale-95 transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  Playback
                </button>
                <a 
                  href={videoUrl} 
                  download="aura-runway.mp4"
                  className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all"
                >
                  Download HD
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VisualizeTab;
