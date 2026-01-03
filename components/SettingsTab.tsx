
import React, { useState, useEffect } from 'react';
import { Mail, Bell, Clock, Calendar, Smartphone, CheckCircle2, Eye, Loader2, Send, X, Sparkles, MapPin } from 'lucide-react';
import { WeatherData, OutfitSuggestion, TempUnit } from '../types';
import { generateEmailDigest, getOutfitSuggestion } from '../services/geminiService';
import { fetchWeather, geocode } from '../services/weatherService';

interface Props {
  weather: WeatherData | null;
  outfit: OutfitSuggestion | null;
  unit: TempUnit;
}

const SettingsTab: React.FC<Props> = ({ weather, outfit, unit }) => {
  // Load initial state from localStorage
  const [emailEnabled, setEmailEnabled] = useState(() => localStorage.getItem('aura_email_enabled') === 'true');
  const [pushEnabled, setPushEnabled] = useState(() => {
    const stored = localStorage.getItem('aura_push_enabled');
    return stored === null ? true : stored === 'true';
  });
  const [sendTime, setSendTime] = useState(() => localStorage.getItem('aura_send_time') || "07:30");
  
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [digestContent, setDigestContent] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Automatically persist changes to localStorage when states change
  useEffect(() => {
    localStorage.setItem('aura_email_enabled', String(emailEnabled));
    localStorage.setItem('aura_push_enabled', String(pushEnabled));
    localStorage.setItem('aura_send_time', sendTime);
  }, [emailEnabled, pushEnabled, sendTime]);

  const handleManualSave = () => {
    setSaveStatus('saving');
    // Values are already saved by useEffect, but we provide visual feedback
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 600);
  };

  const handlePreview = async () => {
    setIsPreviewing(true);
    setIsGenerating(true);
    try {
      let currentOutfit = outfit;
      let currentWeather = weather;

      // If no context, get default for Seattle as a fallback
      if (!currentWeather) {
        const coords = await geocode('Seattle');
        if (coords) {
          currentWeather = await fetchWeather(coords.lat, coords.lon, 'Seattle');
        }
      }
      
      if (currentWeather && !currentOutfit) {
        currentOutfit = await getOutfitSuggestion(currentWeather, 'professional', unit);
      }

      if (currentWeather && currentOutfit) {
        const content = await generateEmailDigest(currentWeather, currentOutfit, unit);
        setDigestContent(content);
      } else {
        setDigestContent("No style context available. Please visit the Stylist tab first.");
      }
    } catch (err) {
      setDigestContent("Failed to generate preview. Check your connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Configuration Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Bell className="text-indigo-600 w-6 h-6" />
              Proactive Styling
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              Don't wait to check the weather. Aura sends your outfit brief directly to you.
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-50">
          <div className={`flex items-center justify-between p-5 rounded-3xl transition-all ${emailEnabled ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50 border border-transparent'}`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${emailEnabled ? 'bg-white text-indigo-600 shadow-sm' : 'bg-white text-gray-300'}`}>
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-gray-900 text-sm tracking-tight">Daily Email Digest</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Full editorial layout</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={emailEnabled} 
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className={`flex items-center justify-between p-5 rounded-3xl transition-all ${pushEnabled ? 'bg-indigo-50 border border-indigo-100' : 'bg-gray-50 border border-transparent'}`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${pushEnabled ? 'bg-white text-indigo-600 shadow-sm' : 'bg-white text-gray-300'}`}>
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-gray-900 text-sm tracking-tight">Mobile Push</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Real-time style alerts</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={pushEnabled} 
                onChange={(e) => setPushEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Schedule Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-2">
          <Clock className="text-indigo-600 w-5 h-5" />
          <h3 className="text-lg font-black text-gray-900 tracking-tight">Schedule Your Briefing</h3>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="time" 
              value={sendTime}
              onChange={(e) => setSendTime(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800" 
            />
          </div>
          <button 
            onClick={handleManualSave}
            disabled={saveStatus === 'saving'}
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-base hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 min-w-[140px]"
          >
            {saveStatus === 'saving' ? <Loader2 className="w-5 h-5 animate-spin" /> : 
             saveStatus === 'saved' ? <CheckCircle2 className="w-5 h-5" /> : "Save Changes"}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center italic">Settings are saved automatically</p>
      </div>

      {/* Preview Section */}
      <div className="flex flex-col gap-4">
        <button
          onClick={handlePreview}
          className="group w-full p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] text-white shadow-2xl shadow-indigo-200 flex items-center justify-between hover:scale-[1.01] transition-transform active:scale-[0.99]"
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
              <Eye className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-lg font-black tracking-tight leading-none">Preview Daily Digest</p>
              <p className="text-xs text-indigo-100 font-medium mt-1">Generate today's AI stylist brief</p>
            </div>
          </div>
          <Sparkles className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
        </button>

        <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100">
          <div className="flex gap-4">
            <div className="bg-white p-3 rounded-2xl h-fit">
               <Calendar className="text-indigo-600 w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h4 className="font-black text-indigo-900 text-sm tracking-tight">Smart Calendar Integration</h4>
              <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                Aura can scan your schedule for keywords like "Wedding" or "Hike" to refine your daily digest automatically.
              </p>
              <button className="text-xs font-black text-indigo-600 underline tracking-tighter hover:text-indigo-800 transition-colors uppercase">Connect Google Calendar</button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal Overlay */}
      {isPreviewing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setIsPreviewing(false)}
              className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="p-8 pb-4 border-b border-gray-50 flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Your Style Briefing</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Scheduled for {sendTime}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 w-6 h-6" />
                  </div>
                  <p className="text-gray-900 font-black tracking-tight">Stylist is drafting...</p>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em]">Crafting editorial content</p>
                </div>
              ) : (
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 font-medium text-gray-800 leading-relaxed whitespace-pre-wrap italic">
                  {digestContent}
                </div>
              )}
            </div>

            <div className="p-8 pt-4 bg-gray-50 flex flex-col gap-3">
              <button 
                disabled={isGenerating}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send Test Email Now
              </button>
              <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">Powered by Gemini 3 Flash</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-green-50 p-5 rounded-3xl flex items-start gap-4 border border-green-100">
        <CheckCircle2 className="text-green-600 w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Status: Active</p>
          <p className="text-xs text-green-800 font-medium leading-relaxed">
            Aura is currently in PWA mode. To receive background push notifications on Android/iOS, ensure "Add to Home Screen" is enabled in your browser menu.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
