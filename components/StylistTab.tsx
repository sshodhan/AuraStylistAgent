
import React, { useState, useEffect } from 'react';
import { WeatherData, OutfitSuggestion, TempUnit } from '../types';
import { fetchWeather, geocode } from '../services/weatherService';
import { getOutfitSuggestion, generateOutfitImage, generateWeatherHeroImage } from '../services/geminiService';
import { Search, Loader2, Thermometer, Wind, CloudRain, AlertCircle, Sparkles, Camera, Download, RefreshCw, CloudIcon, Sun, CloudLightning, Droplets } from 'lucide-react';

interface Props {
  unit: TempUnit;
  onWeatherUpdate: (w: WeatherData) => void;
  onOutfitUpdate: (o: OutfitSuggestion) => void;
  currentOutfit: OutfitSuggestion | null;
}

const StylistTab: React.FC<Props> = ({ unit, onWeatherUpdate, onOutfitUpdate, currentOutfit }) => {
  const [locationInput, setLocationInput] = useState('Seattle');
  const [context, setContext] = useState('casual');
  const [loading, setLoading] = useState(false);
  const [visualizing, setVisualizing] = useState(false);
  const [outfitImage, setOutfitImage] = useState<string | null>(null);
  const [weatherHero, setWeatherHero] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [weatherInfo, setWeatherInfo] = useState<WeatherData | null>(null);

  const contexts = ['casual', 'formal office', 'casual hike', 'night out', 'athletic'];

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setOutfitImage(null);
    setWeatherHero(null);

    try {
      const coords = await geocode(locationInput);
      if (!coords) throw new Error("Could not find location.");

      const weather = await fetchWeather(coords.lat, coords.lon, locationInput);
      setWeatherInfo(weather);
      onWeatherUpdate(weather);

      // Trigger parallel generations
      const [suggestion, hero] = await Promise.all([
        getOutfitSuggestion(weather, context, unit),
        generateWeatherHeroImage(weather, unit).catch(() => null)
      ]);

      onOutfitUpdate(suggestion);
      setWeatherHero(hero);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleVisualize = async () => {
    if (!currentOutfit || !weatherInfo) return;

    if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }

    setVisualizing(true);
    setError(null);
    try {
      const url = await generateOutfitImage(currentOutfit, weatherInfo, "1K", unit);
      setOutfitImage(url);
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) {
        setError("Please re-select your API key with a paid project.");
        if (typeof (window as any).aistudio?.openSelectKey === 'function') {
          await (window as any).aistudio.openSelectKey();
        }
      } else {
        setError("Failed to generate image. Ensure you've selected an API key from a paid project.");
      }
    } finally {
      setVisualizing(false);
    }
  };

  useEffect(() => {
    if (!currentOutfit) handleGenerate();
  }, []);

  const getDisplayTemp = (c: number) => unit === 'F' ? (c * 9/5 + 32).toFixed(1) : c.toFixed(1);

  const getWeatherIcon = (precip: number, temp: number) => {
    if (precip > 5) return <CloudLightning className="w-8 h-8 text-yellow-400 drop-shadow-sm" />;
    if (precip > 0) return <Droplets className="w-8 h-8 text-blue-400 drop-shadow-sm" />;
    if (temp > 20) return <Sun className="w-8 h-8 text-orange-400 drop-shadow-sm" />;
    return <CloudIcon className="w-8 h-8 text-white drop-shadow-sm" />;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Climate Hero Component */}
      {weatherInfo && !loading && (
        <div className="relative w-full aspect-[21/9] md:aspect-[3/1] bg-gray-200 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20 group">
          {weatherHero ? (
            <>
              <img src={weatherHero} alt="Climate Hero" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent p-8 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-2xl flex items-center gap-3">
                    {getWeatherIcon(weatherInfo.precip, weatherInfo.temp)}
                    <div className="text-white">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none">Status</p>
                      <p className="text-base font-black">
                        {weatherInfo.precip > 5 ? 'Stormy' : weatherInfo.precip > 0 ? 'Rainy' : weatherInfo.temp > 20 ? 'Sunny' : 'Cloudy'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-black/20 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl text-right">
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none">Real-Time</p>
                    <p className="text-2xl font-black text-white leading-none mt-1">
                      {getDisplayTemp(weatherInfo.temp)}°<span className="opacity-60">{unit}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-2xl">{weatherInfo.location}</h3>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center animate-pulse bg-gradient-to-br from-indigo-500 to-indigo-900">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-white animate-spin opacity-50" />
                <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.2em]">Crafting Context...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Input Section - Shaded wrapper to match screenshot */}
      <div className="bg-gray-50 p-5 rounded-[2.5rem] border border-gray-100">
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Where are you heading?</h2>
          <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="Enter city..."
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-gray-800"
              />
            </div>
            <select
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none font-medium text-gray-800"
            >
              {contexts.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
            <button
              disabled={loading}
              className="md:col-span-2 w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-base hover:bg-indigo-700 disabled:bg-indigo-300 transition-all flex justify-center items-center gap-2 shadow-xl shadow-indigo-100 active:scale-[0.98] tracking-tight"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Plan My Outfit"}
            </button>
          </form>
        </section>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-5 rounded-3xl flex items-center gap-3 border border-red-100 animate-in shake duration-300">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {currentOutfit && weatherInfo && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4 px-2">
            <WeatherCard icon={<Thermometer className="w-5 h-5" />} label="Temp" value={`${getDisplayTemp(weatherInfo.temp)}°${unit}`} />
            <WeatherCard icon={<CloudRain className="w-5 h-5" />} label="Precip" value={`${weatherInfo.precip}mm`} />
            <WeatherCard icon={<Wind className="w-5 h-5" />} label="Wind" value={`${weatherInfo.wind}km/h`} />
          </div>

          <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl overflow-hidden ring-1 ring-black/5">
            <div className="md:grid md:grid-cols-2">
              <div className="p-10 bg-indigo-50/50 space-y-8">
                <div>
                  <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Stylist Verdict</h3>
                  <h4 className="text-4xl font-black text-gray-900 leading-tight tracking-tighter">Your Suggested Look</h4>
                </div>
                
                <div className="space-y-8">
                  <OutfitItem label="Base Layer" value={currentOutfit.baseLayer} />
                  <OutfitItem label="Outerwear" value={currentOutfit.outerwear} />
                  <OutfitItem label="Footwear" value={currentOutfit.footwear} />
                </div>

                <div className="pt-8 border-t border-indigo-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Aura's Style Logic</span>
                  </div>
                  <p className="text-base text-gray-600 leading-relaxed italic font-medium">
                    {currentOutfit.styleReasoning}
                  </p>
                </div>
              </div>

              <div className="bg-gray-100 min-h-[500px] relative overflow-hidden group">
                {outfitImage ? (
                  <>
                    <img src={outfitImage} alt="Outfit preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute bottom-6 right-6 flex gap-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <button 
                        onClick={handleVisualize}
                        disabled={visualizing}
                        className="p-4 bg-white/90 backdrop-blur-xl rounded-2xl text-indigo-600 shadow-2xl hover:bg-white transition-colors"
                        title="Regenerate Look"
                      >
                        <RefreshCw className={`w-6 h-6 ${visualizing ? 'animate-spin' : ''}`} />
                      </button>
                      <a 
                        href={outfitImage} 
                        download="aura-style.png"
                        className="p-4 bg-indigo-600 rounded-2xl text-white shadow-2xl hover:bg-indigo-700 transition-colors"
                        title="Download Look"
                      >
                        <Download className="w-6 h-6" />
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center space-y-8 bg-gradient-to-br from-gray-50 to-gray-200">
                    {visualizing ? (
                      <>
                        <div className="relative">
                          <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                          <Camera className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xl font-black text-gray-900 tracking-tight">Rendering Look...</p>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Gemini 3 Pro Image</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-8 bg-white rounded-[2rem] shadow-inner">
                          <Camera className="w-12 h-12 text-gray-300" />
                        </div>
                        <div className="space-y-3">
                          <p className="text-gray-900 font-black text-lg">Visualize the look</p>
                          <p className="text-sm text-gray-500 max-w-[250px] mx-auto leading-relaxed">See how this outfit interacts with {weatherInfo.location}'s current climate conditions.</p>
                        </div>
                        <button
                          onClick={handleVisualize}
                          className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-3 mx-auto"
                        >
                          <Sparkles className="w-4 h-4" />
                          Generate Visual
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="px-10 py-6 bg-gray-50 border-t border-gray-100 flex items-center gap-6">
               <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-100">
                 <Sparkles className="w-5 h-5" />
               </div>
               <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Pro Stylist Tip</p>
                 <p className="text-lg text-gray-900 font-bold leading-tight tracking-tight">"{currentOutfit.proTip}"</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const WeatherCard: React.FC<{ icon: React.ReactNode, label: string, value: string }> = ({ icon, label, value }) => (
  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center gap-2 transition-all hover:border-indigo-100 hover:shadow-xl cursor-default group">
    <div className="text-indigo-500 bg-indigo-50 p-3 rounded-2xl group-hover:scale-110 transition-transform">{icon}</div>
    <span className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em]">{label}</span>
    <span className="font-black text-gray-900 whitespace-nowrap text-xl tracking-tighter">{value}</span>
  </div>
);

const OutfitItem: React.FC<{ label: string, value: string }> = ({ label, value }) => (
  <div className="space-y-1 group">
    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] group-hover:text-indigo-600 transition-colors">{label}</span>
    <p className="text-xl text-gray-900 font-black leading-snug tracking-tight">{value || 'Not needed'}</p>
  </div>
);

export default StylistTab;
