
import React, { useState, useRef, useEffect } from 'react';
import { Message, User, VoiceSettings } from '../types';
import { Play, Pause, CheckCheck, Sparkles, Music, Volume2 } from 'lucide-react';
import { speakText } from '../services/geminiService';

interface ChatMessageProps {
  message: Message;
  sender: User;
  isMe: boolean;
  voiceSettings: VoiceSettings;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, sender, isMe, voiceSettings }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleAiSpeak = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      await speakText(message.text || '', voiceSettings);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPlaying(false);
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current) {
      if (message.audioUrl) {
        const mimeType = message.mimeType || 'audio/webm';
        const audio = new Audio(`data:${mimeType};base64,${message.audioUrl}`);
        audioRef.current = audio;
        
        audio.addEventListener('timeupdate', () => {
          if (audio.duration) {
            setProgress((audio.currentTime / audio.duration) * 100);
          }
        });

        audio.addEventListener('ended', () => {
          setIsPlaying(false);
          setProgress(0);
        });
      }
    }

    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'} gap-4 items-end`}>
        
        {/* Avatar - Clay Style */}
        {!isMe && (
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-clay-sm border border-white flex-shrink-0 overflow-hidden">
            {sender.isAi ? (
              <Sparkles size={20} className="text-tofoli-lavenderDark" />
            ) : (
              <img 
                src={sender.avatar && sender.avatar.startsWith('http') ? sender.avatar : `https://api.dicebear.com/7.x/notionists/svg?seed=${sender.name}`} 
                alt="avatar" 
                className="w-full h-full object-cover" 
              />
            )}
          </div>
        )}

        {/* Bubble - Puffy & Soft */}
        <div 
          className={`
            relative px-6 py-5 shadow-clay-sm transition-all duration-300 border-4 border-white
            ${isMe 
              ? 'bg-tofoli-lavender text-slate-700 rounded-[2rem] rounded-tr-lg' 
              : 'bg-white text-slate-600 rounded-[2rem] rounded-tl-lg'}
          `}
        >
          {message.type === 'audio' ? (
            <div className="flex items-center gap-4 min-w-[180px]">
              <button 
                onClick={toggleAudio}
                className={`
                  w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm
                  ${isMe 
                    ? 'bg-white text-tofoli-lavenderDark hover:shadow-md' 
                    : 'bg-tofoli-mint text-teal-600 hover:shadow-md'}
                `}
              >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
              </button>
              
              <div className="flex flex-col justify-center gap-2 flex-1">
                <div className="h-8 flex items-center gap-[2px] opacity-60">
                   {[...Array(12)].map((_, i) => (
                     <div 
                        key={i} 
                        className={`w-1.5 rounded-full transition-all duration-300 ${isMe ? 'bg-tofoli-lavenderDark' : 'bg-slate-300'}`}
                        style={{ 
                          height: isPlaying ? `${Math.max(30, Math.random() * 100)}%` : '30%',
                          opacity: (i/12) * 100 < progress ? 1 : 0.4
                        }} 
                     />
                   ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-[16px] leading-relaxed font-bold tracking-wide">
              {message.text}
            </div>
          )}

          {/* Footer */}
          <div className={`flex items-center gap-3 mt-3 text-[11px] font-bold ${isMe ? 'text-slate-500/70 justify-end' : 'text-slate-400 justify-between'}`}>
             {sender.isAi && message.type === 'text' && (
                <button 
                  onClick={handleAiSpeak}
                  className="hover:bg-slate-50 p-1.5 -ml-2 rounded-xl transition-colors flex items-center gap-1 text-tofoli-lavenderDark"
                >
                  {isPlaying ? (
                     <div className="flex gap-0.5 items-center">
                        <div className="w-1 h-1 bg-current rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-current rounded-full animate-bounce delay-75"></div>
                        <span>يقرأ...</span>
                     </div>
                  ) : (
                    <>
                      <Volume2 size={14} />
                      <span>استمع</span>
                    </>
                  )}
                </button>
             )}
             <span className="opacity-60">{new Date(message.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
