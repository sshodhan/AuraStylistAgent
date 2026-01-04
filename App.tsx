
import React, { useState, useEffect } from 'react';
import { AppTab, WeatherData, OutfitSuggestion, TempUnit } from './types';
import StylistTab from './components/StylistTab';
import VoiceTab from './components/VoiceTab';
import VisualizeTab from './components/VisualizeTab';
import StoresTab from './components/StoresTab';
import SettingsTab from './components/SettingsTab';
import { Cloud, Mic, Sparkles, MapPin, Shirt, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.STYLIST);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [outfit, setOutfit] = useState<OutfitSuggestion | null>(null);
  const [weatherHero, setWeatherHero] = useState<string | null>(null);
  const [outfitImages, setOutfitImages] = useState<string[] | null>(null);
  const [unit, setUnit] = useState<TempUnit>('F');
  const [userName, setUserName] = useState(() => localStorage.getItem('aura_user_name') || "YOU");

  // Sync user name from local storage periodically or when settings might change it
  useEffect(() => {
    const handleStorageChange = () => {
      setUserName((localStorage.getItem('aura_user_name') || "YOU").toUpperCase());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sync name when switching back from settings
  useEffect(() => {
    if (activeTab === AppTab.STYLIST) {
      const name = localStorage.getItem('aura_user_name');
      setUserName(name ? name.toUpperCase() : "YOU");
    }
  }, [activeTab]);

  const tabs = [
    { id: AppTab.STYLIST, label: 'Stylist', icon: Shirt },
    { id: AppTab.VOICE, label: 'Voice', icon: Mic },
    { id: AppTab.VISUALIZE, label: 'Visualize', icon: Sparkles },
    { id: AppTab.STORES, label: 'Stores', icon: MapPin },
    { id: AppTab.SETTINGS, label: 'Daily', icon: Settings },
  ];

  const displayTemp = weather 
    ? (unit === 'F' ? (weather.temp * 9/5 + 32).toFixed(0) : weather.temp.toFixed(0)) 
    : null;

  return (
    <div className="h-[100dvh] w-full max-w-md mx-auto flex flex-col bg-white overflow-hidden relative selection:bg-indigo-100">
      {/* Fixed App Header - Centered Content based on Screenshot */}
      <header className="px-5 py-4 relative flex justify-between items-center bg-white z-30 shrink-0 border-b border-gray-100">
        {/* Left Section: Icon Only */}
        <div className="flex items-center z-10">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-md shadow-indigo-100">
            <Cloud className="text-white w-4 h-4" />
          </div>
        </div>

        {/* Center Section: Location & Welcome (Matching Screenshot Style) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {weather ? (
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-top-1 duration-500">
              <h2 className="text-[14px] font-black text-gray-900 uppercase tracking-tight leading-none">
                {weather.location}
              </h2>
              <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-1.5 leading-none">
                WELCOME {userName}
              </p>
            </div>
          ) : (
             <h1 className="text-sm font-black text-gray-900 uppercase tracking-widest">Aura</h1>
          )}
        </div>
        
        {/* Right Section: Units & Temp (Matching Screenshot layout) */}
        <div className="flex items-center gap-2 z-10">
          <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-100">
            {(['C', 'F'] as TempUnit[]).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`px-2 py-1 rounded-md text-[9px] font-black transition-all ${
                  unit === u 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-400'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
          {weather && (
            <div className="bg-indigo-50 px-1.5 py-1.5 rounded-lg">
              <p className="text-[10px] font-black text-indigo-600 leading-none">{displayTemp}°</p>
            </div>
          )}
        </div>
      </header>

      {/* Internal Scrollable Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <div className="h-full w-full overflow-y-auto overscroll-contain">
          <div className="p-4 space-y-4">
            {activeTab === AppTab.STYLIST && (
              <StylistTab 
                unit={unit}
                weather={weather}
                weatherHero={weatherHero}
                outfitImage={outfitImages?.[0] || null}
                onWeatherUpdate={setWeather} 
                onOutfitUpdate={setOutfit} 
                onHeroUpdate={setWeatherHero}
                onOutfitImageUpdate={(img) => setOutfitImages(img ? [img] : null)}
                currentOutfit={outfit} 
                onTabChange={setActiveTab}
              />
            )}
            {activeTab === AppTab.VOICE && <VoiceTab weather={weather} unit={unit} />}
            {activeTab === AppTab.VISUALIZE && (
              <VisualizeTab 
                outfit={outfit} 
                weather={weather} 
                unit={unit} 
                imageUrls={outfitImages} 
                onImagesUpdate={setOutfitImages}
                onTabChange={setActiveTab}
              />
            )}
            {activeTab === AppTab.STORES && <StoresTab weather={weather} outfit={outfit} />}
            {activeTab === AppTab.SETTINGS && <SettingsTab weather={weather} outfit={outfit} unit={unit} />}
          </div>
        </div>
      </main>

      {/* Fixed Bottom Navigation */}
      <nav className="border-t border-gray-50 bg-white px-2 py-3 shrink-0 z-30 shadow-[0_-8px_30px_rgb(0,0,0,0.02)]">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1.5 px-3 py-1 transition-all duration-300 relative ${
                  isActive 
                    ? 'text-indigo-600' 
                    : 'text-gray-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'fill-indigo-50' : ''}`} />
                <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default App;
