
import React, { useState, useEffect } from 'react';
import { Mail, Bell, Clock, Calendar, Smartphone, CheckCircle2, Eye, Loader2, Send, X, Sparkles, User, AlertCircle } from 'lucide-react';
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
  const [emailAddress, setEmailAddress] = useState(() => localStorage.getItem('aura_email_address') || "");
  const [emailEnabled, setEmailEnabled] = useState(() => localStorage.getItem('aura_email_enabled') === 'true');
  const [pushEnabled, setPushEnabled] = useState(() => {
    const stored = localStorage.getItem('aura_push_enabled');
    return stored === null ? true : stored === 'true';
  });
  const [sendTime, setSendTime] = useState(() => localStorage.getItem('aura_send_time') || "07:30");
  
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [digestContent, setDigestContent] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Automatically persist changes to localStorage
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
    setTestSent(false);
    try {
      let currentOutfit = outfit;
      let currentWeather = weather;

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

  const handleSendTest = () => {
    if (!emailAddress || !emailAddress.includes('@')) {
      alert("Please enter a valid email address first.");
      return;
    }
    setIsSendingTest(true);
    // Simulate API call
    setTimeout(() => {
      setIsSendingTest(false);
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      {/* Identity Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-2">
          <User className="text-indigo-600 w-5 h-5" />
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Delivery Identity</h2>
        </div>
        <div className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="email" 
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="your@email.com"
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800 transition-all" 
            />
          </div>
          {!emailAddress.includes('@') && emailAddress.length > 0 && (
            <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Please enter a valid email
            </p>
          )}
        </div>
      </div>

      {/* Configuration Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Bell className="text-indigo-600 w-6 h-6" />
            Proactive Styling
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            Don't wait to check the weather. Aura sends your outfit brief directly to you.
          </p>
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
          <div className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative flex flex-col max-h-[85vh]">
            <button 
              onClick={() => setIsPreviewing(false)}
              className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="p-8 pb-4 border-b border-gray-50 flex items-center gap-4 flex-shrink-0">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Your Style Briefing</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Target: {emailAddress || 'Not set'}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/30">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 w-6 h-6" />
                  </div>
                  <p className="text-gray-900 font-black tracking-tight">Stylist is drafting...</p>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-3xl border border-gray-100 font-medium text-gray-800 leading-relaxed whitespace-pre-wrap italic shadow-sm">
                  {digestContent}
                </div>
              )}
            </div>

            <div className="p-8 pt-6 bg-white border-t border-gray-100 flex-shrink-0 flex flex-col gap-3">
              <button 
                onClick={handleSendTest}
                disabled={isGenerating || isSendingTest || testSent}
                className={`w-full py-4 rounded-2xl font-black shadow-xl transition-all flex items-center justify-center gap-2 ${
                  testSent 
                    ? 'bg-green-500 text-white shadow-green-100' 
                    : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700 disabled:bg-gray-200 disabled:shadow-none'
                }`}
              >
                {isSendingTest ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                 testSent ? <CheckCircle2 className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                {testSent ? "Test Briefing Sent!" : "Send Test Email Now"}
              </button>
              <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">
                {emailAddress ? `Sends to ${emailAddress}` : "No destination email set"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-green-50 p-5 rounded-3xl flex items-start gap-4 border border-green-100">
        <CheckCircle2 className="text-green-600 w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Status: Active</p>
          <p className="text-xs text-green-800 font-medium leading-relaxed">
            Aura is currently in PWA mode. Settings are stored locally on this device.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
