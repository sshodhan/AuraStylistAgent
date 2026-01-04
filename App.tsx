
import React, { useState } from 'react';
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
      {/* Fixed App Header */}
      <header className="px-5 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md z-30 shrink-0 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-100">
            <Cloud className="text-white w-5 h-5" />
          </div>
          <h1 className="text-lg font-black text-gray-900 tracking-tight">Aura</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            {(['C', 'F'] as TempUnit[]).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-black transition-all ${
                  unit === u 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-400'
                }`}
              >
                °{u}
              </button>
            ))}
          </div>
          {weather && (
            <div className="bg-indigo-50 px-2 py-1 rounded-lg">
              <p className="text-[10px] font-black text-indigo-600 leading-none">{displayTemp}°{unit}</p>
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
      <nav className="border-t border-gray-100 bg-white/95 backdrop-blur-md px-2 py-3 shrink-0 z-30 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1.5 px-3 py-1 rounded-2xl transition-all duration-300 relative ${
                  isActive 
                    ? 'text-indigo-600 scale-105' 
                    : 'text-gray-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'fill-indigo-50' : ''}`} />
                <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-2 w-1 h-1 bg-indigo-600 rounded-full" />
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
