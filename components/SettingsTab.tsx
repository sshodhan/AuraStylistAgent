import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, Loader2, User, ShieldCheck, Globe, Palette, Wand2 } from 'lucide-react';
import { WeatherData, OutfitSuggestion, TempUnit } from '../types';

// Fix: Removed unused imports that were causing compilation errors due to missing exported members in services.
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

const PALETTES = [
  { name: "Monochrome", colors: ["#000000", "#FFFFFF", "#808080"] },
  { name: "Earth Tones", colors: ["#5D4037", "#8D6E63", "#D7CCC8"] },
  { name: "Neon Nights", colors: ["#FF00FF", "#00FFFF", "#000000"] },
  { name: "Classic Navy", colors: ["#000080", "#FFFFFF", "#C0C0C0"] }
];

const SettingsTab: React.FC<Props> = ({ weather, outfit, unit }) => {
  const [userName, setUserName] = useState(() => localStorage.getItem('aura_user_name') || "");
  const [emailAddress, setEmailAddress] = useState(() => localStorage.getItem('aura_email_address') || "");
  const [archetype, setArchetype] = useState(() => localStorage.getItem('aura_style_archetype') || ARCHETYPES[0]);
  const [selectedPalette, setSelectedPalette] = useState(() => localStorage.getItem('aura_palette_name') || PALETTES[0].name);
  
  const [emailEnabled, setEmailEnabled] = useState(() => localStorage.getItem('aura_email_enabled') === 'true');
  const [sendTime, setSendTime] = useState(() => localStorage.getItem('aura_send_time') || "07:30");
  
  // States related to email preview features (currently placeholders)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    localStorage.setItem('aura_user_name', userName);
    localStorage.setItem('aura_email_address', emailAddress);
    localStorage.setItem('aura_style_archetype', archetype);
    localStorage.setItem('aura_palette_name', selectedPalette);
    const p = PALETTES.find(p => p.name === selectedPalette);
    if (p) localStorage.setItem('aura_palette', JSON.stringify(p.colors));
    localStorage.setItem('aura_email_enabled', String(emailEnabled));
    localStorage.setItem('aura_send_time', sendTime);
  }, [userName, emailAddress, archetype, selectedPalette, emailEnabled, sendTime]);

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
            <h2 className="text-sm font-black uppercase tracking-widest">Aura DNA</h2>
            <p className="text-[10px] opacity-80 font-medium">Suggestions are targeted to your persona.</p>
          </div>
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identity</h3>
        <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm divide-y divide-gray-50">
          <div className="p-5 flex items-center gap-4">
            <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 shrink-0"><User className="w-5 h-5" /></div>
            <div className="flex-1">
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Display Name</p>
              <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Fashion Icon" className="w-full bg-transparent border-none outline-none text-sm font-black text-black p-0" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Style DNA</h3>
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

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-indigo-600" />
              <p className="text-[10px] font-black uppercase text-gray-900 tracking-widest">Primary Palette</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PALETTES.map(p => (
                <button key={p.name} onClick={() => setSelectedPalette(p.name)} className={`p-3 rounded-2xl flex items-center justify-between border-2 transition-all ${selectedPalette === p.name ? 'border-indigo-600 bg-indigo-50' : 'border-gray-50 bg-white'}`}>
                  <span className="text-[10px] font-black uppercase text-gray-700">{p.name}</span>
                  <div className="flex -space-x-1">
                    {p.colors.map((c, idx) => (
                      <div key={idx} className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Automation</h3>
        <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm divide-y divide-gray-50">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${emailEnabled ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-300'}`}><Mail className="w-4 h-4" /></div>
              <span className="text-xs font-black text-gray-900 uppercase">Email Briefings</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer scale-[0.8]">
              <input type="checkbox" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
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