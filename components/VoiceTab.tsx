import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { WeatherData, TempUnit } from '../types';
import { encode, decode, decodeAudioData } from '../services/geminiService';
import { Mic, MicOff, Volume2, Loader2, Info, X, PhoneOff, MessageSquare, AlertCircle } from 'lucide-react';

interface Props {
  weather: WeatherData | null;
  unit: TempUnit;
}

const VoiceTab: React.FC<Props> = ({ weather, unit }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [showTranscript, setShowTranscript] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startSession = async () => {
    setIsConnecting(true);
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Ensure AudioContexts are running (browsers often suspend them)
      if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
      if (outputAudioContextRef.current.state === 'suspended') await outputAudioContextRef.current.resume();

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscription(prev => [...prev.slice(-20), `Aura: ${text}`]);
            }
            
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              const ctx = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error("Live Error", e);
            setPermissionError("Connection error. Please try again.");
          },
          onclose: () => {
            setIsConnected(false);
            setIsConnecting(false);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          systemInstruction: `You are Aura, a friendly and chic fashion stylist. 
            ${weather ? `The current weather in ${weather.location} is ${unit === 'F' ? (weather.temp * 9/5 + 32).toFixed(1) : weather.temp.toFixed(1)}°${unit}, ${weather.wind}km/h wind, and ${weather.precip}mm rain.` : ''}
            Talk to the user naturally about their outfit concerns. Use °${unit} when mentioning temperatures. Keep responses brief and helpful.`
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error(err);
      setIsConnecting(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError("Microphone access denied. Please enable permissions in your browser settings.");
      } else {
        setPermissionError("Could not start voice session. Check your internet and permissions.");
      }
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setIsConnected(false);
  };

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500 overflow-hidden">
      {/* Immersive Call View */}
      <div className={`flex-1 relative rounded-[3rem] overflow-hidden transition-all duration-700 ${isConnected ? 'bg-indigo-900' : 'bg-gray-50'}`}>
        {/* Animated Background Ripples when connected */}
        {isConnected && (
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <div className="absolute w-64 h-64 bg-indigo-500 rounded-full animate-ping duration-[3000ms]" />
            <div className="absolute w-48 h-48 bg-indigo-400 rounded-full animate-ping duration-[2000ms] delay-700" />
            <div className="absolute w-32 h-32 bg-indigo-300 rounded-full animate-ping duration-[1000ms] delay-1000" />
          </div>
        )}

        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 space-y-8 z-10 text-center">
          <div className={`relative transition-all duration-1000 ${isConnected ? 'scale-125' : 'scale-100'}`}>
            <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-2xl ${
              isConnected ? 'bg-white' : 'bg-indigo-600'
            }`}>
              {isConnected ? (
                <Mic className="text-indigo-600 w-12 h-12" />
              ) : (
                <Volume2 className="text-white w-12 h-12" />
              )}
            </div>
            {isConnected && (
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-indigo-900 animate-pulse" />
            )}
          </div>

          <div className="space-y-3">
            <h2 className={`text-2xl font-black tracking-tighter transition-colors ${isConnected ? 'text-white' : 'text-gray-900'}`}>
              {isConnected ? "Aura Stylist" : "Voice Consultation"}
            </h2>
            <p className={`text-sm font-medium transition-colors ${isConnected ? 'text-indigo-200' : 'text-gray-400'}`}>
              {isConnected ? "Listening to your style needs..." : "Speak naturally with your AI stylist."}
            </p>
          </div>

          {!isConnected ? (
            <div className="space-y-4">
              <button
                onClick={startSession}
                disabled={isConnecting}
                className="px-10 py-5 bg-indigo-600 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-3"
              >
                {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start Session"}
              </button>
              {permissionError && (
                <div className="flex items-center gap-2 justify-center text-red-500 text-[10px] font-black uppercase tracking-widest animate-in fade-in">
                  <AlertCircle className="w-4 h-4" />
                  <span>{permissionError}</span>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={stopSession}
              className="px-10 py-5 bg-red-500 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-2xl shadow-red-500/20 hover:bg-red-600 active:scale-95 transition-all flex items-center gap-3"
            >
              <PhoneOff className="w-5 h-5" />
              End Consultation
            </button>
          )}
        </div>

        {/* Floating Toggle for Transcript */}
        {isConnected && (
          <button 
            onClick={() => setShowTranscript(!showTranscript)}
            className="absolute bottom-6 right-6 p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white z-20 hover:bg-white/20 transition-all"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Slide-up Transcript Tray or Hidden */}
      {(showTranscript || !isConnected) && (
        <div className={`bg-white rounded-t-[2.5rem] border border-gray-100 p-6 space-y-4 transition-all duration-500 ${!isConnected ? 'opacity-100 h-1/3' : 'h-1/2 shadow-2xl border-indigo-100'}`}>
          <div className="flex items-center justify-between border-b border-gray-50 pb-3">
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
              <Info className="w-4 h-4" />
              Live Briefing
            </div>
            {isConnected && (
              <button onClick={() => setShowTranscript(false)} className="p-1 hover:bg-gray-50 rounded-lg">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 px-1 custom-scrollbar">
            {transcription.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-30">
                <p className="text-[10px] font-black uppercase tracking-widest">Awaiting interaction</p>
              </div>
            ) : (
              transcription.map((t, i) => (
                <div key={i} className={`p-4 rounded-2xl text-xs font-bold leading-relaxed animate-in fade-in slide-in-from-bottom-2 ${
                  t.startsWith('Aura:') ? 'bg-indigo-50 text-indigo-700 self-start' : 'bg-gray-50 text-gray-700'
                }`}>
                  {t}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceTab;