
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
  const [outfitImage, setOutfitImage] = useState<string | null>(null);
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
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto bg-white shadow-xl overflow-hidden">
      {/* Header */}
      <header className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <Cloud className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Aura Stylist</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {(['C', 'F'] as TempUnit[]).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  unit === u 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                °{u}
              </button>
            ))}
          </div>
          {weather && (
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{weather.location}</p>
              <p className="text-xl font-black text-indigo-600 leading-none">{displayTemp}°{unit}</p>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {activeTab === AppTab.STYLIST && (
          <StylistTab 
            unit={unit}
            weather={weather}
            weatherHero={weatherHero}
            outfitImage={outfitImage}
            onWeatherUpdate={setWeather} 
            onOutfitUpdate={setOutfit} 
            onHeroUpdate={setWeatherHero}
            onOutfitImageUpdate={setOutfitImage}
            currentOutfit={outfit} 
          />
        )}
        {activeTab === AppTab.VOICE && <VoiceTab weather={weather} unit={unit} />}
        {activeTab === AppTab.VISUALIZE && <VisualizeTab outfit={outfit} weather={weather} unit={unit} />}
        {activeTab === AppTab.STORES && <StoresTab weather={weather} outfit={outfit} />}
        {activeTab === AppTab.SETTINGS && <SettingsTab weather={weather} outfit={outfit} unit={unit} />}
      </main>

      {/* Navigation Footer */}
      <nav className="border-t bg-gray-50/80 backdrop-blur-md p-3 sticky bottom-0">
        <div className="flex justify-around items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'text-indigo-600 scale-110 font-bold' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'fill-indigo-50' : ''}`} />
                <span className="text-[10px] uppercase tracking-widest">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default App;
