
import React, { useState, useEffect } from 'react';
import { Mail, Bell, Clock, Calendar, Smartphone, CheckCircle2, Eye, Loader2, Send, X, Sparkles, User, AlertCircle, ChevronRight } from 'lucide-react';
import { WeatherData, OutfitSuggestion, TempUnit } from '../types';
import { generateEmailDigest, getOutfitSuggestion } from '../services/geminiService';
import { fetchWeather, geocode } from '../services/weatherService';

interface Props {
  weather: WeatherData | null;
  outfit: OutfitSuggestion | null;
  unit: TempUnit;
}

const SettingsTab: React.FC<Props> = ({ weather, outfit, unit }) => {
  const [emailAddress, setEmailAddress] = useState(() => localStorage.getItem('aura_email_address') || "");
  const [emailEnabled, setEmailEnabled] = useState(() => localStorage.getItem('aura_email_enabled') === 'true');
  const [pushEnabled, setPushEnabled] = useState(() => localStorage.getItem('aura_push_enabled') === 'true');
  const [sendTime, setSendTime] = useState(() => localStorage.getItem('aura_send_time') || "07:30");
  
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [digestContent, setDigestContent] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    localStorage.setItem('aura_email_address', emailAddress);
    localStorage.setItem('aura_email_enabled', String(emailEnabled));
    localStorage.setItem('aura_push_enabled', String(pushEnabled));
    localStorage.setItem('aura_send_time', sendTime);
  }, [emailAddress, emailEnabled, pushEnabled, sendTime]);

  const handleManualSave = () => {
    setSaveStatus('saving');
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
      if (!currentWeather) {
        const coords = await geocode('Seattle');
        if (coords) currentWeather = await fetchWeather(coords.lat, coords.lon, 'Seattle');
      }
      if (currentWeather && !currentOutfit) {
        currentOutfit = await getOutfitSuggestion(currentWeather, 'professional', unit);
      }
      if (currentWeather && currentOutfit) {
        const content = await generateEmailDigest(currentWeather, currentOutfit, unit);
        setDigestContent(content);
      }
    } catch (err) {
      setDigestContent("Could not generate brief. Check API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* Identity Group */}
      <div className="space-y-2">
        <h3 className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Profile</h3>
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="p-4 flex items-center gap-4">
            <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter mb-1">Styling Address</p>
              <input 
                type="email" 
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="fashion@aura.com"
                className="w-full bg-transparent border-none outline-none text-sm font-black text-gray-900 p-0" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Group */}
      <div className="space-y-2">
        <h3 className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Alert Preferences</h3>
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm divide-y divide-gray-50">
          <SettingToggle 
            icon={<Mail className="w-4 h-4" />} 
            label="Email Digest" 
            checked={emailEnabled} 
            onChange={setEmailEnabled} 
          />
          <SettingToggle 
            icon={<Smartphone className="w-4 h-4" />} 
            label="Push Alerts" 
            checked={pushEnabled} 
            onChange={setPushEnabled} 
          />
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gray-50 p-2 rounded-xl text-gray-400"><Clock className="w-4 h-4" /></div>
              <span className="text-xs font-black text-gray-900 uppercase">Briefing Time</span>
            </div>
            <input 
              type="time" 
              value={sendTime}
              onChange={(e) => setSendTime(e.target.value)}
              className="bg-gray-100 border-none rounded-lg px-2 py-1 text-xs font-black outline-none" 
            />
          </div>
        </div>
      </div>

      {/* Actions Group */}
      <div className="space-y-3 pt-2">
        <button
          onClick={handlePreview}
          className="w-full p-5 bg-indigo-600 text-white rounded-3xl flex items-center justify-between group active:scale-[0.98] transition-all shadow-xl shadow-indigo-100"
        >
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">Test Delivery</span>
          </div>
          <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          onClick={handleManualSave}
          disabled={saveStatus !== 'idle'}
          className="w-full p-5 bg-white border border-gray-100 text-gray-900 rounded-3xl flex items-center justify-between group active:scale-[0.98] transition-all shadow-sm"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className={`w-5 h-5 ${saveStatus === 'saved' ? 'text-green-500' : 'text-gray-300'}`} />
            <span className="text-xs font-black uppercase tracking-widest">
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Preference Saved' : 'Update Settings'}
            </span>
          </div>
          {saveStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
        </button>
      </div>

      {/* Modals are height-capped for viewport containment */}
      {isPreviewing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col h-[85dvh]">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0">
              <div className="flex items-center gap-3">
                <Sparkles className="text-indigo-600 w-5 h-5" />
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Briefing Preview</h3>
              </div>
              <button onClick={() => setIsPreviewing(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-gray-50/20 custom-scrollbar">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Crafting Chic Digest...</p>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm text-xs font-medium leading-loose whitespace-pre-wrap italic text-gray-600 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600 opacity-20" />
                  {digestContent}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SettingToggle: React.FC<{ icon: React.ReactNode, label: string, checked: boolean, onChange: (v: boolean) => void }> = ({ icon, label, checked, onChange }) => (
  <div className="p-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-xl ${checked ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-300'}`}>{icon}</div>
      <span className="text-xs font-black text-gray-900 uppercase">{label}</span>
    </div>
    <label className="relative inline-flex items-center cursor-pointer scale-[0.8]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
    </label>
  </div>
);

export default SettingsTab;
