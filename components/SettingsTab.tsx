
import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, Loader2, User, ShieldCheck, Globe, Palette, Wand2, Fingerprint, Zap, Settings2 } from 'lucide-react';
import { WeatherData, OutfitSuggestion, TempUnit, VideoResolution } from '../types';

interface Props {
  weather: WeatherData | null;
  outfit: OutfitSuggestion | null;
  unit: TempUnit;
}

const ARCHETYPES = [
  "Old Money Aesthetic",
  "Cyberpunk Techwear",
  "Quiet Luxury",
  "Cottagecore",
  "Scandinavian Minimalist",
  "90s Grunge Revival",
  "Dark Academia"
];

const GENDERS = ["Female", "Male", "Non-Binary"];
const AGES = ["20s", "30s", "40s", "50+"];

const PALETTES = [
  { name: "Monochrome", colors: ["#000000", "#FFFFFF", "#808080"] },
  { name: "Earth Tones", colors: ["#5D4037", "#8D6E63", "#D7CCC8"] },
  { name: "Neon Nights", colors: ["#FF00FF", "#00FFFF", "#000000"] },
  { name: "Classic Navy", colors: ["#000080", "#FFFFFF", "#C0C0C0"] }
];

const SettingsTab: React.FC<Props> = ({ weather, outfit, unit }) => {
  const [userName, setUserName] = useState(() => localStorage.getItem('aura_user_name') || "");
  const [gender, setGender] = useState(() => localStorage.getItem('aura_gender') || GENDERS[0]);
  const [ageRange, setAgeRange] = useState(() => localStorage.getItem('aura_age_range') || AGES[1]);
  const [emailAddress, setEmailAddress] = useState(() => localStorage.getItem('aura_email_address') || "");
  const [archetype, setArchetype] = useState(() => localStorage.getItem('aura_style_archetype') || ARCHETYPES[0]);
  const [selectedPalette, setSelectedPalette] = useState(() => localStorage.getItem('aura_palette_name') || PALETTES[0].name);
  const [videoRes, setVideoRes] = useState<VideoResolution>(() => (localStorage.getItem('aura_video_res') as VideoResolution) || '720p');
  
  const [emailEnabled, setEmailEnabled] = useState(() => localStorage.getItem('aura_email_enabled') === 'true');
  const [sendTime, setSendTime] = useState(() => localStorage.getItem('aura_send_time') || "07:30");
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    localStorage.setItem('aura_user_name', userName);
    localStorage.setItem('aura_gender', gender);
    localStorage.setItem('aura_age_range', ageRange);
    localStorage.setItem('aura_email_address', emailAddress);
    localStorage.setItem('aura_style_archetype', archetype);
    localStorage.setItem('aura_palette_name', selectedPalette);
    localStorage.setItem('aura_video_res', videoRes);
    const p = PALETTES.find(p => p.name === selectedPalette);
    if (p) localStorage.setItem('aura_palette', JSON.stringify(p.colors));
    localStorage.setItem('aura_email_enabled', String(emailEnabled));
    localStorage.setItem('aura_send_time', sendTime);
  }, [userName, gender, ageRange, emailAddress, archetype, selectedPalette, emailEnabled, sendTime, videoRes]);

  const handleManualSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="mx-4 p-5 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] text-white shadow-xl flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Globe className="w-3 h-3 text-indigo-200" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100">Style Profile</h2>
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest">Identity Core</h2>
            <p className="text-[10px] opacity-80 font-medium">Synced across Visual & Voice engines.</p>
          </div>
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Identity Check</h3>
        <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm divide-y divide-gray-50">
          <div className="p-5 flex items-center gap-4">
            <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 shrink-0"><User className="w-5 h-5" /></div>
            <div className="flex-1">
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Display Name</p>
              <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Fashion Icon" className="w-full bg-transparent border-none outline-none text-sm font-black text-black p-0" />
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-3.5 h-3.5 text-indigo-600" />
              <p className="text-[10px] font-black uppercase text-gray-900 tracking-widest">Gender Representation</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {GENDERS.map(g => (
                <button key={g} onClick={() => setGender(g)} className={`py-3 rounded-xl text-[9px] font-black transition-all ${gender === g ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Quota & Performance</h3>
        <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            <p className="text-[10px] font-black uppercase text-gray-900 tracking-widest">Synthesis Resolution</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
             <button onClick={() => setVideoRes('720p')} className={`p-4 rounded-2xl flex flex-col gap-1 border-2 transition-all ${videoRes === '720p' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-50'}`}>
                <span className="text-[10px] font-black uppercase text-gray-900">720p (Eco)</span>
                <span className="text-[8px] font-bold text-gray-400 uppercase leading-none">Lower Cost • Faster</span>
             </button>
             <button onClick={() => setVideoRes('1080p')} className={`p-4 rounded-2xl flex flex-col gap-1 border-2 transition-all ${videoRes === '1080p' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-50'}`}>
                <span className="text-[10px] font-black uppercase text-gray-900">1080p (HD)</span>
                <span className="text-[8px] font-bold text-gray-400 uppercase leading-none">Higher Fidelity</span>
             </button>
          </div>
          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
             <div className="flex items-center gap-2 mb-1">
                <Settings2 className="w-3 h-3 text-indigo-600" />
                <span className="text-[9px] font-black text-indigo-900 uppercase tracking-widest">Model Strategy</span>
             </div>
             <p className="text-[9px] font-medium text-indigo-700/80 leading-relaxed">
                Currently locked to <b>Veo 3.1 Fast</b> to maximize your daily quota (200 ops/day).
             </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Style DNA</h3>
        <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
              <p className="text-[10px] font-black uppercase text-gray-900 tracking-widest">Style Archetype</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {ARCHETYPES.map(a => (
                <button key={a} onClick={() => setArchetype(a)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${archetype === a ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-2">
        <button onClick={handleManualSave} disabled={saveStatus !== 'idle'} className={`w-full p-5 rounded-[2rem] flex items-center justify-center gap-3 font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl ${saveStatus === 'saved' ? 'bg-green-500 text-white' : 'bg-gray-900 text-white'}`}>
          {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : saveStatus === 'saved' ? <CheckCircle2 className="w-4 h-4" /> : 'Apply Style DNA'}
          {saveStatus === 'saving' ? 'Applying...' : saveStatus === 'saved' ? 'DNA Updated' : 'Sync Profile'}
        </button>
      </div>
    </div>
  );
};

export default SettingsTab;
