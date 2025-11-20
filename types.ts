export interface User {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'busy';
  isAi?: boolean;
}

export interface Room {
  id: string;
  name: string;
  participants: number;
  category: string;
  isActive: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  text?: string;
  audioUrl?: string; // Base64 or URL
  mimeType?: string; // e.g., 'audio/webm' or 'audio/mp4'
  audioDuration?: number;
  timestamp: number;
  type: 'text' | 'audio';
}

export interface VisionSection {
  title: string;
  icon: any;
  points: string[];
}

export interface VoiceSettings {
  name: string; // 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr'
  speed: number; // 0.5 to 2.0
  pitch: number; // -1200 to 1200 (cents)
}