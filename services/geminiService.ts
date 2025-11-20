import { GoogleGenAI, Chat, LiveServerMessage, Modality } from "@google/genai";
import { VoiceSettings } from "../types";

// System Instruction: Smart & Friendly Assistant
const SYSTEM_INSTRUCTION = `
أنت مساعد ذكي ومتحدث لبق باللغة العربية.
مهمتك هي إجراء محادثات ممتعة ومفيدة مع المستخدم.

القواعد:
1. تحدث بنبرة صوتية طبيعية، دافئة، وودودة.
2. اجعل إجاباتك موجزة ومباشرة (ما لم يطلب المستخدم شرحاً مفصلاً).
3. استخدم تعبيرات إنسانية (مثل: "أفهمك"، "هذا مثير للاهتمام").
4. كن مستعداً للمساعدة في أي موضوع (ثقافة، علوم، دردشة عامة).
5. تجنب الردود الآلية الجامدة.
`;

let chatSession: Chat | null = null;
let aiInstance: GoogleGenAI | null = null;
let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

// Live Session Globals
let liveInputContext: AudioContext | null = null;
let liveOutputContext: AudioContext | null = null;
let liveStream: MediaStream | null = null;
let liveProcessor: ScriptProcessorNode | null = null;
let liveSource: MediaStreamAudioSourceNode | null = null;
let nextStartTime = 0;
const liveSources = new Set<AudioBufferSourceNode>();
let activeLiveSession: any = null;

const getAI = () => {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiInstance;
};

export const initChatSession = () => {
  const ai = getAI();
  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingBudget: 0 },
      temperature: 0.7,
    },
  });
  return chatSession;
};

export const sendMessageToGemini = async (text: string): Promise<string> => {
  if (!chatSession) initChatSession();
  try {
    const result = await chatSession!.sendMessage({ message: text });
    return result.text || "";
  } catch (error) {
    console.error("Text Error:", error);
    return "عذراً، حدث خطأ في الاتصال.";
  }
};

export const sendAudioMessageToGemini = async (base64Audio: string, mimeType: string): Promise<string> => {
  if (!chatSession) initChatSession();

  try {
    const result = await chatSession!.sendMessage({
      message: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          { text: "استمع إلى المستخدم وأجبه صوتياً ونصياً." }
        ]
      }
    });
    return result.text || "";
  } catch (error) {
    console.error("Gemini Audio Error:", error);
    return "لم أتمكن من سماعك بوضوح، هل يمكنك الإعادة؟";
  }
};

export const speakText = async (text: string, settings: VoiceSettings): Promise<void> => {
  // Cancel any previous audio
  if (currentSource) {
    try { currentSource.stop(); } catch(e) {}
  }
  window.speechSynthesis.cancel();

  // Handle Native System Voice
  if (settings.name === 'System') {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = settings.speed;
      
      // Correct Pitch Calculation: 2^(cents/1200)
      // -1200 cents = 0.5x frequency, 0 cents = 1.0x, 1200 cents = 2.0x
      const pitchMultiplier = Math.pow(2, settings.pitch / 1200);
      
      // Web Speech API pitch range is typically 0 to 2 (default 1)
      utterance.pitch = Math.max(0.1, Math.min(2, pitchMultiplier));

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve(); // Resolve on error to unblock

      window.speechSynthesis.speak(utterance);
    });
  }

  // Handle Gemini Voice
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: { parts: [{ text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: settings.name }
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");

    await playPCMData(base64Audio, settings.speed, settings.pitch);

  } catch (error) {
    console.error("TTS Error:", error);
    // Fallback to native if Gemini fails
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    window.speechSynthesis.speak(utterance);
  }
};

const playPCMData = async (base64String: string, speed: number = 1, pitch: number = 0) => {
  // Reuse AudioContext if possible, or create new one
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }

  // Resume context if suspended (browser policy)
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  // Stop previous audio if playing (Interrupt logic)
  if (currentSource) {
    try {
      currentSource.stop();
    } catch (e) {
      // Ignore error if already stopped
    }
  }

  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const dataInt16 = new Int16Array(bytes.buffer);
  const buffer = audioContext.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  
  source.playbackRate.value = speed;
  source.detune.value = pitch;

  source.connect(audioContext.destination);
  source.start();
  currentSource = source;

  return new Promise<void>((resolve) => {
    source.onended = () => {
      if (currentSource === source) {
        currentSource = null;
      }
      resolve();
    };
  });
};

// --- LIVE API IMPLEMENTATION ---

export const stopLiveSession = async () => {
  if (liveStream) {
    liveStream.getTracks().forEach(track => track.stop());
    liveStream = null;
  }
  if (liveProcessor) {
    liveProcessor.disconnect();
    liveProcessor = null;
  }
  if (liveSource) {
    liveSource.disconnect();
    liveSource = null;
  }
  if (liveInputContext) {
    await liveInputContext.close();
    liveInputContext = null;
  }
  if (liveOutputContext) {
    await liveOutputContext.close();
    liveOutputContext = null;
  }
  
  // Stop all playing sources
  liveSources.forEach(source => {
    try { source.stop(); } catch (e) {}
  });
  liveSources.clear();
  nextStartTime = 0;
};

export const startLiveSession = async (settings: VoiceSettings, onVolume: (v: number) => void) => {
  const ai = getAI();
  
  // Reset state
  await stopLiveSession();

  liveInputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  liveOutputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  
  // Get Mic Stream
  liveStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: () => {
        console.log("Live Session Opened");
        
        // Setup Input Stream
        if (!liveInputContext || !liveStream) return;
        
        liveSource = liveInputContext.createMediaStreamSource(liveStream);
        liveProcessor = liveInputContext.createScriptProcessor(4096, 1, 1);
        
        liveProcessor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Calculate Volume for UI
          let sum = 0;
          for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
          const rms = Math.sqrt(sum / inputData.length);
          onVolume(rms * 5); // boost for UI

          // Create 16-bit PCM
          const pcmBlob = createPcmBlob(inputData);
          
          sessionPromise.then(session => {
            session.sendRealtimeInput({ media: pcmBlob });
          });
        };
        
        liveSource.connect(liveProcessor);
        liveProcessor.connect(liveInputContext.destination);
      },
      onmessage: async (message: LiveServerMessage) => {
        // Handle Audio Output
        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        
        if (base64Audio && liveOutputContext) {
          // Update start time to ensure smooth playback
          nextStartTime = Math.max(nextStartTime, liveOutputContext.currentTime);
          
          const audioBuffer = await decodeLiveAudioData(base64Audio, liveOutputContext);
          
          const source = liveOutputContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(liveOutputContext.destination);
          
          source.addEventListener('ended', () => {
            liveSources.delete(source);
          });

          source.start(nextStartTime);
          nextStartTime += audioBuffer.duration;
          liveSources.add(source);
        }

        // Handle Interruption
        if (message.serverContent?.interrupted) {
           console.log("Interrupted!");
           liveSources.forEach(s => {
             try { s.stop(); } catch(e){}
           });
           liveSources.clear();
           nextStartTime = 0;
        }
      },
      onclose: () => {
        console.log("Live Session Closed");
      },
      onerror: (e) => {
        console.error("Live Session Error", e);
      }
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: settings.name }
        }
      },
      systemInstruction: SYSTEM_INSTRUCTION,
    }
  });

  activeLiveSession = sessionPromise;
};

// Helpers for Live API
function createPcmBlob(data: Float32Array): { data: string, mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // Clamping to avoid wrapping distortion if volume > 1.0
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  // Manual Base64 Encode for Int16Array
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return {
    data: btoa(binary),
    mimeType: 'audio/pcm;rate=16000'
  };
}

async function decodeLiveAudioData(base64: string, ctx: AudioContext): Promise<AudioBuffer> {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const dataInt16 = new Int16Array(bytes.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  
  return buffer;
}