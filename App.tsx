
import React, { useState, useRef, useEffect } from 'react';
import { initChatSession, sendMessageToGemini, sendAudioMessageToGemini, speakText, startLiveSession, stopLiveSession } from './services/geminiService';
import { ChatMessage } from './components/ChatMessage';
import { Message, User, VoiceSettings } from './types';
import { Mic, Send, Volume2, VolumeX, Settings, X, PlayCircle, Phone, PhoneOff, RefreshCw, Sparkles, CheckCircle2, ArrowLeft, Heart, Info, User as UserIcon, Waves, LogOut, Mail, LogIn } from 'lucide-react';

// Define global google interface
declare global {
  interface Window {
    google: any;
  }
}

// --- CONFIGURATION ---
// هام: استبدل هذا النص بالمعرف الحقيقي من Google Cloud Console
// IMPORTANT: Replace this with your actual Client ID from Google Cloud Console
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID_HERE";

// Mock AI User
const AI_USER: User = { id: 'ai', name: 'المساعد اللطيف', avatar: 'ai', status: 'online', isAi: true };

// Helper to decode JWT from Google (Updated for Unicode/Arabic support)
const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

// --- Background Components ---
const TopologicalBackground = () => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
    {/* Base Gradient */}
    <div className="absolute inset-0 bg-gradient-to-b from-tofoli-bg to-white"></div>
    
    {/* Contour Lines SVG Pattern */}
    <div className="absolute inset-0 opacity-30">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="contours" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M0 100 C 20 0 50 0 100 100" stroke="#E2DDFE" strokeWidth="0.5" fill="none"/>
            <path d="M0 0 C 50 100 80 100 100 0" stroke="#D0F0E4" strokeWidth="0.5" fill="none"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#contours)" />
      </svg>
    </div>

    {/* Morphing Blobs */}
    <div className="absolute -top-[10%] -right-[10%] w-[600px] h-[600px] bg-gradient-to-br from-tofoli-lavender to-white mix-blend-multiply filter blur-3xl opacity-60 animate-morph"></div>
    <div className="absolute top-[40%] -left-[10%] w-[500px] h-[500px] bg-gradient-to-tr from-tofoli-mint to-tofoli-blue mix-blend-multiply filter blur-3xl opacity-50 animate-morph" style={{ animationDelay: '2s' }}></div>
    <div className="absolute -bottom-[10%] right-[20%] w-[400px] h-[400px] bg-gradient-to-t from-tofoli-cream to-tofoli-lavender mix-blend-multiply filter blur-3xl opacity-70 animate-morph" style={{ animationDelay: '4s' }}></div>
  </div>
);

// --- Landing Page Component ---
const LandingPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Initialize Google Button
  useEffect(() => {
    const initGoogle = () => {
      if (!window.google) return;

      if (GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID_HERE") {
        console.warn("Google Client ID is missing. Please update App.tsx with your Client ID.");
      }

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: any) => {
            const payload = parseJwt(response.credential);
            if (payload) {
              const googleUser: User = {
                id: payload.sub,
                name: payload.name,
                avatar: payload.picture,
                status: 'online'
              };
              onLogin(googleUser);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          // ui_mode: 'card', // Optional: looks nice on mobile
        });

        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(
            googleButtonRef.current,
            { 
              theme: "filled_blue", 
              size: "large", 
              shape: "pill", 
              width: "300", 
              text: "continue_with",
              logo_alignment: "left" 
            }
          );
        }
      } catch (error) {
        console.error("Google Sign-In Initialization Error:", error);
      }
    };

    // If script is already loaded
    initGoogle();
    
    // Retry mechanism in case the script loads lazily
    const interval = setInterval(() => {
      if (window.google && googleButtonRef.current && !googleButtonRef.current.hasChildNodes()) {
        initGoogle();
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [onLogin]);

  // Fallback login for demo purposes
  const handleGuestLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      const guestUser: User = { id: 'guest', name: 'زائر', avatar: 'me', status: 'online' };
      onLogin(guestUser);
    }, 1500);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col font-sans text-slate-600">
      <TopologicalBackground />

      {/* Navbar */}
      <nav className="relative z-50 max-w-6xl mx-auto w-full px-8 py-8 flex justify-between items-center">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-12 h-12 bg-white rounded-[1rem] flex items-center justify-center text-tofoli-lavenderDark shadow-clay-sm transform group-hover:rotate-6 transition-all duration-500 border border-white">
            <Sparkles size={24} fill="currentColor" className="opacity-80 group-hover:scale-110 transition-transform" />
          </div>
          <span className="font-black text-2xl tracking-tight text-slate-700">رفيقي</span>
        </div>
        
        {/* Login Icon Button */}
        <button 
            onClick={() => document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-[1rem] shadow-clay-sm text-slate-500 font-bold text-sm hover:text-tofoli-lavenderDark transition-all border border-white hover:shadow-clay"
         >
            <span>دخول</span>
            <LogIn size={18} />
         </button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center pb-10">
        
        <div className="max-w-4xl mx-auto space-y-8 flex flex-col items-center">
          
          {/* 3D Character Container */}
          <div className="relative w-72 h-72 md:w-96 md:h-96 mb-4 animate-float-slow">
            {/* Background Circle */}
            <div className="absolute inset-4 bg-white rounded-full shadow-clay opacity-50"></div>
            
            {/* CSS 3D-like Character */}
            <div className="absolute inset-0 flex items-center justify-center">
               {/* Body */}
               <div className="w-48 h-56 bg-gradient-to-b from-white to-slate-100 rounded-[3rem] shadow-clay relative border-4 border-white z-10 flex flex-col items-center pt-12 overflow-hidden">
                  {/* Face Screen */}
                  <div className="w-36 h-24 bg-slate-800 rounded-[2rem] shadow-inner relative overflow-hidden flex items-center justify-center gap-6 group">
                     {/* Eyes */}
                     <div className="w-3 h-8 bg-tofoli-mint rounded-full animate-pulse shadow-[0_0_10px_rgba(69,176,140,0.8)]"></div>
                     <div className="w-3 h-8 bg-tofoli-mint rounded-full animate-pulse shadow-[0_0_10px_rgba(69,176,140,0.8)] delay-75"></div>
                     {/* Reflection */}
                     <div className="absolute top-2 right-3 w-8 h-3 bg-white/10 rounded-full -rotate-12"></div>
                  </div>
                  {/* Mouth/Chin Area */}
                  <div className="mt-6 w-12 h-2 bg-slate-200 rounded-full opacity-50"></div>
                  
                  {/* Chest Details */}
                  <div className="mt-auto mb-4 flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-tofoli-lavenderDark"></div>
                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                  </div>
               </div>

               {/* Headphones */}
               <div className="absolute top-10 w-60 h-40 border-[20px] border-white rounded-t-full shadow-clay-sm -z-10"></div>
               <div className="absolute top-28 -left-4 w-14 h-20 bg-white rounded-[1.5rem] shadow-clay border border-slate-50 flex items-center justify-center">
                  <Waves size={24} className="text-tofoli-lavenderDark opacity-50" />
               </div>
               <div className="absolute top-28 -right-4 w-14 h-20 bg-white rounded-[1.5rem] shadow-clay border border-slate-50 flex items-center justify-center">
                  <Waves size={24} className="text-tofoli-lavenderDark opacity-50" />
               </div>
            </div>

            {/* Floating Element 1 */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-tofoli-mint/20 backdrop-blur-xl rounded-[1.5rem] shadow-clay border border-white/50 flex items-center justify-center animate-bounce-slow">
               <Heart className="text-tofoli-mintDark fill-current" size={28} />
            </div>
             {/* Floating Element 2 */}
            <div className="absolute bottom-10 -left-4 w-16 h-16 bg-tofoli-lavender/30 backdrop-blur-xl rounded-full shadow-clay border border-white/50 flex items-center justify-center animate-float-delayed">
               <div className="w-3 h-3 bg-tofoli-lavenderDark rounded-full"></div>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-slate-700 leading-[1.15] tracking-tight">
            ذكاءٌ يفهَمك <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-tofoli-lavenderDark to-tofoli-blueDark relative">
              بكل هدوء
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-tofoli-mint opacity-60" viewBox="0 0 100 10" preserveAspectRatio="none">
                 <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed opacity-90">
            تجربة محادثة صممت لراحتك النفسية. واجهة هادئة، ذكاء متعاطف، <br className="hidden md:block" />
            وتصميم يحتضن أفكارك بلطف.
          </p>

          <div id="login-section" className="pt-6 flex flex-col items-center gap-4 w-full">
            {/* Google Button Container */}
            <div ref={googleButtonRef} className="h-[50px] min-h-[50px] min-w-[200px] flex justify-center shadow-clay-sm rounded-full"></div>
            
            <div className="relative w-full max-w-xs flex items-center justify-center my-1">
               <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
               <div className="relative bg-tofoli-bg px-4 text-xs text-slate-400 font-bold">أو</div>
            </div>

            {/* Fallback Guest Login */}
            <button 
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="px-10 py-3 bg-white text-slate-600 rounded-[2rem] font-bold text-sm shadow-clay-sm hover:shadow-clay transition-all transform hover:-translate-y-1 border border-white w-full max-w-xs flex items-center justify-center gap-2"
            >
              {isLoading ? <RefreshCw className="animate-spin" size={18} /> : (
                 <>
                   <LogIn size={18} />
                   <span>متابعة كزائر</span>
                 </>
              )}
            </button>

            {/* Contact Email Link */}
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 delay-300">
              <a 
                href="mailto:support@example.com" 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/60 hover:bg-white backdrop-blur-sm rounded-full shadow-sm hover:shadow-clay-sm text-xs font-bold text-slate-400 hover:text-tofoli-lavenderDark transition-all border border-white"
              >
                <Mail size={14} />
                <span>تواصل معنا عبر Gmail</span>
              </a>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

// --- Main Chat Interface ---
const ChatInterface: React.FC<{ currentUser: User; onLogout: () => void }> = ({ currentUser, onLogout }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveVolume, setLiveVolume] = useState(0);
  const [visualizerData, setVisualizerData] = useState<number[]>(new Array(6).fill(20));
  
  const [showSettings, setShowSettings] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    try {
      const saved = localStorage.getItem('voiceSettings');
      return saved ? JSON.parse(saved) : { name: 'Zephyr', speed: 1, pitch: 0 };
    } catch (e) {
      return { name: 'Zephyr', speed: 1, pitch: 0 };
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const visualizerContextRef = useRef<AudioContext | null>(null);
  const visualizerFrameRef = useRef<number | null>(null);
  
  useEffect(() => {
    try {
      localStorage.setItem('voiceSettings', JSON.stringify(voiceSettings));
    } catch (e) {
      console.warn("LocalStorage access denied");
    }
  }, [voiceSettings]);

  useEffect(() => {
    initChatSession();
    const welcomeMsg: Message = {
      id: '1',
      senderId: 'ai',
      text: `مرحباً ${currentUser.name} في مساحتك الهادئة. 🌿\nأنا هنا للاستماع، كيف يمكنني مساعدتك اليوم؟`,
      timestamp: Date.now(),
      type: 'text'
    };
    setMessages([welcomeMsg]);
    if(autoSpeak) speakText(welcomeMsg.text || "", voiceSettings);

    return () => {
      stopLiveSession();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      text: inputText,
      timestamp: Date.now(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    try {
      const responseText = await sendMessageToGemini(userMsg.text || "");
      handleAiResponse(responseText);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAiResponse = async (text: string) => {
    const aiMsg: Message = {
      id: Date.now().toString(),
      senderId: AI_USER.id,
      text: text,
      timestamp: Date.now(),
      type: 'text'
    };
    setMessages(prev => [...prev, aiMsg]);
    
    if (autoSpeak) {
      await speakText(text, voiceSettings);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Visualizer setup
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        visualizerContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64; 
        analyser.smoothingTimeConstant = 0.6;
        source.connect(analyser);
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const updateVisualizer = () => {
          analyser.getByteFrequencyData(dataArray);
          const indices = [1, 2, 3, 5, 8, 12]; 
          const bars = indices.map(i => {
             const val = dataArray[i] || 0;
             return Math.max(20, (val / 255) * 100);
          });
          setVisualizerData(bars);
          visualizerFrameRef.current = requestAnimationFrame(updateVisualizer);
        };
        updateVisualizer();
      } catch(e) { console.error(e); }

      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm;codecs=opus';
      else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          
          const userMsg: Message = {
            id: Date.now().toString(),
            senderId: currentUser.id,
            text: 'تسجيل صوتي...',
            type: 'audio', 
            audioUrl: base64,
            mimeType: mimeType,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, userMsg]);
          setIsProcessing(true);

          try {
            const responseText = await sendAudioMessageToGemini(base64, mimeType);
            handleAiResponse(responseText);
          } catch (error) {
            console.error(error);
          } finally {
            setIsProcessing(false);
          }
        };
        
        stream.getTracks().forEach(track => track.stop());
        if (visualizerFrameRef.current) cancelAnimationFrame(visualizerFrameRef.current);
        if (visualizerContextRef.current) {
          visualizerContextRef.current.close();
          visualizerContextRef.current = null;
        }
        setVisualizerData(new Array(6).fill(20));
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic Error", err);
      alert("لا يمكن الوصول للميكروفون");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleLiveMode = async () => {
    if (isLiveMode) {
      await stopLiveSession();
      setIsLiveMode(false);
    } else {
      setIsLiveMode(true);
      try {
        await startLiveSession(voiceSettings, (vol) => setLiveVolume(vol));
      } catch (e) {
        setIsLiveMode(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen font-sans relative overflow-hidden bg-tofoli-bg text-slate-600">
      <TopologicalBackground />

      {/* Header - Floating & Organic */}
      <header className="relative z-20 px-4 pt-6 pb-2">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-clay-sm px-6 py-4 flex items-center justify-between border border-white/60 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-[1rem] flex items-center justify-center text-tofoli-lavenderDark shadow-clay-inset border border-slate-50 overflow-hidden">
              {currentUser.avatar.startsWith('http') ? (
                 <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                 <Sparkles size={22} fill="currentColor" className="opacity-80 animate-pulse-soft" />
              )}
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-slate-700">رفيقي</h1>
              <div className="flex items-center gap-1.5">
                 <span className="w-2 h-2 bg-tofoli-mintDark rounded-full shadow-[0_0_8px_rgba(69,176,140,0.6)]"></span>
                 <span className="text-xs font-bold text-slate-400">متصل الآن</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
               onClick={toggleLiveMode}
               className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-tofoli-lavender to-white text-tofoli-lavenderDark hover:shadow-clay transition-all shadow-sm flex items-center justify-center border border-white"
               title="مكالمة حية"
            >
              <Phone size={20} />
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="w-12 h-12 rounded-[1.2rem] bg-white text-slate-400 hover:text-tofoli-blueDark hover:shadow-clay transition-all shadow-sm flex items-center justify-center border border-white"
            >
              <Settings size={20} />
            </button>
            <button 
               onClick={onLogout}
               className="w-12 h-12 rounded-[1.2rem] bg-white text-slate-400 hover:text-rose-400 hover:shadow-clay transition-all shadow-sm flex items-center justify-center border border-white"
               title="خروج"
            >
               <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Live Mode Overlay */}
      {isLiveMode && (
        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-xl flex flex-col items-center justify-between p-8 animate-in fade-in duration-500">
          <TopologicalBackground />
          <div className="mt-12 text-center space-y-2 relative z-10">
            <h2 className="text-3xl font-black text-slate-700 tracking-tight">محادثة مباشرة</h2>
            <div className="inline-block px-5 py-2 bg-white rounded-full shadow-clay-sm">
               <p className="text-tofoli-mintDark font-bold text-sm flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-tofoli-mintDark animate-ping"></span>
                 اتصال صوتي نشط
               </p>
            </div>
          </div>
          
          {/* Organic Visualizer */}
          <div className="relative w-72 h-72 flex items-center justify-center z-10">
             {/* Outer breathing rings */}
             <div className="absolute inset-0 bg-tofoli-lavender/30 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] filter blur-2xl animate-morph" style={{ animationDuration: '6s' }}></div>
             <div className="absolute inset-4 bg-tofoli-blue/30 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] filter blur-xl animate-morph" style={{ animationDuration: '8s' }}></div>
             
             {/* Core */}
             <div 
               className="w-48 h-48 bg-white rounded-full shadow-clay flex items-center justify-center border-4 border-white relative z-20 transition-transform duration-100 ease-out"
               style={{ transform: `scale(${1 + liveVolume * 0.6})` }}
             >
               <div className="w-40 h-40 bg-gradient-to-br from-tofoli-lavender via-white to-tofoli-blue rounded-full shadow-inner flex items-center justify-center">
                 <Mic size={48} className="text-tofoli-lavenderDark drop-shadow-sm opacity-80" />
               </div>
             </div>
          </div>

          <button 
            onClick={toggleLiveMode}
            className="mb-12 relative z-10 bg-rose-500 hover:bg-rose-600 text-white w-20 h-20 rounded-[2rem] shadow-clay hover:shadow-xl transition-all flex items-center justify-center transform hover:scale-105"
          >
            <PhoneOff size={32} />
          </button>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-50 bg-slate-900/10 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-tofoli-bg w-full max-w-md rounded-[3rem] shadow-clay p-8 border-4 border-white relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/50 to-transparent pointer-events-none"></div>
             
            <button onClick={() => setShowSettings(false)} className="absolute top-6 left-6 p-3 bg-white rounded-2xl shadow-clay-sm text-slate-400 hover:text-slate-600 z-10 border border-slate-50">
              <X size={20} />
            </button>
            
            <h3 className="text-2xl font-black text-slate-700 mb-8 text-center relative z-10">تفضيلات الصوت</h3>

            <div className="space-y-6 relative z-10">
              <div className="bg-white p-5 rounded-[2rem] shadow-clay-sm border border-slate-50">
                <label className="text-sm font-bold text-slate-500 mb-3 block px-2">اختيار المتحدث</label>
                <div className="relative">
                  <select 
                    value={voiceSettings.name}
                    onChange={(e) => setVoiceSettings({...voiceSettings, name: e.target.value})}
                    className="w-full bg-tofoli-bg p-4 rounded-2xl outline-none text-slate-700 font-bold shadow-inner appearance-none cursor-pointer pr-10 border border-slate-100"
                  >
                    <option value="Zephyr">Zephyr (هادئ ومتزن)</option>
                    <option value="Kore">Kore (دافئ وعميق)</option>
                    <option value="System">صوت النظام (سريع)</option>
                  </select>
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-400">
                    <UserIcon size={20} />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] shadow-clay-sm border border-slate-50 space-y-8">
                 <div>
                    <div className="flex justify-between mb-3 px-2">
                      <label className="text-sm font-bold text-slate-500">سرعة الكلام</label>
                      <span className="text-xs font-bold bg-tofoli-blue/50 text-tofoli-blueDark px-3 py-1 rounded-lg">{voiceSettings.speed}x</span>
                    </div>
                    <input 
                      type="range" min="0.5" max="2.0" step="0.1"
                      value={voiceSettings.speed}
                      onChange={(e) => setVoiceSettings({...voiceSettings, speed: parseFloat(e.target.value)})}
                      className="w-full h-4 bg-tofoli-bg rounded-full appearance-none cursor-pointer shadow-inner accent-tofoli-blueDark"
                    />
                    <div className="flex justify-between mt-2 px-1 text-[10px] font-bold text-slate-400">
                       <span>بطيء</span>
                       <span>سريع</span>
                    </div>
                 </div>
                 
                 <div>
                    <div className="flex justify-between mb-3 px-2">
                      <label className="text-sm font-bold text-slate-500">نبرة الصوت</label>
                      <span className="text-xs font-bold bg-tofoli-lavender text-tofoli-lavenderDark px-3 py-1 rounded-lg" dir="ltr">
                         {Math.round(voiceSettings.pitch / 100)} st
                      </span>
                    </div>
                    <input 
                      type="range" min="-1200" max="1200" step="50"
                      value={voiceSettings.pitch}
                      onChange={(e) => setVoiceSettings({...voiceSettings, pitch: parseInt(e.target.value)})}
                      className="w-full h-4 bg-tofoli-bg rounded-full appearance-none cursor-pointer shadow-inner accent-tofoli-lavenderDark"
                    />
                    <div className="flex justify-between mt-2 px-1 text-[10px] font-bold text-slate-400">
                       <span>عميق</span>
                       <span>حاد</span>
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => setShowSettings(false)}
                className="w-full py-4 bg-tofoli-lavenderDark text-white rounded-2xl font-bold shadow-clay hover:shadow-glow-soft transition-all transform hover:-translate-y-1"
              >
                حفظ وإغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <main className="relative z-10 flex-1 overflow-y-auto p-4 space-y-8 no-scrollbar max-w-5xl mx-auto w-full">
        <div className="h-4"></div> 
        {messages.map((msg) => (
          <ChatMessage 
            key={msg.id} 
            message={msg} 
            sender={msg.senderId === 'ai' ? AI_USER : currentUser} 
            isMe={msg.senderId === currentUser.id}
            voiceSettings={voiceSettings}
          />
        ))}
        
        {isProcessing && (
          <div className="flex justify-start w-full px-2 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white rounded-[2rem] rounded-tl-md px-6 py-4 shadow-clay-sm border border-white flex items-center gap-4 w-max">
               <div className="w-10 h-10 bg-tofoli-bg rounded-2xl flex items-center justify-center shadow-inner">
                 <Sparkles size={20} className="text-tofoli-lavenderDark animate-spin-slow" />
               </div>
               <div className="flex gap-1 h-4 items-center">
                  <div className="w-1.5 h-full bg-gradient-to-t from-tofoli-lavenderDark to-tofoli-blue rounded-full animate-music-bar"></div>
                  <div className="w-1.5 h-full bg-gradient-to-t from-tofoli-lavender to-tofoli-mint rounded-full animate-music-bar delay-75"></div>
                  <div className="w-1.5 h-full bg-gradient-to-t from-tofoli-blue to-tofoli-cream rounded-full animate-music-bar delay-150"></div>
               </div>
               <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-500 animate-pulse">جاري التحليل...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </main>

      {/* Input Area */}
      <footer className="relative z-20 p-6 safe-area-bottom">
        
        {/* Floating Visualizer when recording */}
        {isRecording && (
          <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 bg-white/80 backdrop-blur-xl px-8 py-4 rounded-[2rem] shadow-clay border border-white flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-8 z-30">
            <div className="flex items-center gap-1.5 h-12 items-center">
              {visualizerData.map((height, i) => (
                <div 
                  key={i} 
                  className="w-2 rounded-full transition-all duration-100 ease-out bg-gradient-to-t from-rose-400 to-rose-300" 
                  style={{ height: `${height * 0.8}%`, minHeight: '10%' }}
                ></div>
              ))}
            </div>
            <span className="text-rose-500 font-bold text-xs tracking-wide">جاري الاستماع...</span>
          </div>
        )}

        <div className="bg-white rounded-[3rem] p-2 pr-6 shadow-float border border-white flex items-center gap-3 max-w-3xl mx-auto transform transition-transform hover:scale-[1.01]">
          
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="تحدث معي..."
            className="flex-1 bg-transparent border-none outline-none text-right dir-rtl text-slate-600 placeholder:text-slate-300 font-bold h-14 text-lg"
          />

          <div className="flex items-center gap-2">
             <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`
                  w-14 h-14 rounded-[1.5rem] flex items-center justify-center transition-all duration-300
                  ${isRecording 
                    ? 'bg-rose-50 text-rose-500 shadow-inner scale-95' 
                    : 'bg-tofoli-bg text-slate-400 hover:bg-tofoli-blue hover:text-tofoli-blueDark shadow-clay-inset hover:shadow-none'}
                `}
              >
                <Mic size={24} />
             </button>

             <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isProcessing}
                className={`
                  w-16 h-14 rounded-[1.5rem] flex items-center justify-center transition-all duration-300 shadow-clay-sm border border-white
                  ${inputText.trim() && !isProcessing
                    ? 'bg-gradient-to-br from-tofoli-lavenderDark to-[#7A6EF5] text-white hover:shadow-glow-soft hover:-translate-y-1' 
                    : 'bg-slate-50 text-slate-300 cursor-not-allowed'}
                `}
              >
                <Send size={24} className={inputText.trim() ? 'ml-1' : ''} />
             </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- Main App Entry ---
const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Check for existing session logic could be added here
  
  return !currentUser ? (
    <LandingPage onLogin={setCurrentUser} />
  ) : (
    <ChatInterface currentUser={currentUser} onLogout={() => setCurrentUser(null)} />
  );
};

export default App;
