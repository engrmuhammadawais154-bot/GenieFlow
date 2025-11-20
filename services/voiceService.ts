import * as Speech from "expo-speech";

export interface VoiceOptions {
  language?: string;
  pitch?: number;
  rate?: number;
}

export class VoiceService {
  private static isSpeaking = false;
  
  static async speak(text: string, options: VoiceOptions = {}): Promise<void> {
    if (this.isSpeaking) {
      this.stop();
    }
    
    const defaultOptions = {
      language: "en-US",
      pitch: 1.0,
      rate: 0.9,
      ...options,
    };
    
    return new Promise((resolve, reject) => {
      this.isSpeaking = true;
      
      Speech.speak(text, {
        language: defaultOptions.language,
        pitch: defaultOptions.pitch,
        rate: defaultOptions.rate,
        onStart: () => {
          console.log("Speech started");
        },
        onDone: () => {
          this.isSpeaking = false;
          resolve();
        },
        onStopped: () => {
          this.isSpeaking = false;
          resolve();
        },
        onError: (error) => {
          this.isSpeaking = false;
          console.error("Speech error:", error);
          reject(error);
        },
      });
    });
  }
  
  static stop(): void {
    if (this.isSpeaking) {
      Speech.stop();
      this.isSpeaking = false;
    }
  }
  
  static pause(): void {
    Speech.pause();
  }
  
  static resume(): void {
    Speech.resume();
  }
  
  static getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
  
  static async getAvailableVoices(): Promise<Speech.Voice[]> {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      return voices;
    } catch (error) {
      console.error("Error getting voices:", error);
      return [];
    }
  }
}

export interface RecognitionResult {
  text: string;
  confidence: number;
}

export class SpeechRecognitionService {
  static isListening = false;
  
  static startListening(
    onResult: (result: RecognitionResult) => void,
    onError: (error: string) => void
  ): void {
    this.isListening = true;
    
    Alert.alert(
      "Voice Input",
      "Please speak your message. Click OK when done.",
      [
        {
          text: "Cancel",
          onPress: () => {
            this.isListening = false;
          },
          style: "cancel",
        },
        {
          text: "OK",
          onPress: () => {
            this.isListening = false;
            onError("Speech recognition is not yet implemented. Please type your message.");
          },
        },
      ]
    );
  }
  
  static stopListening(): void {
    this.isListening = false;
  }
  
  static getIsListening(): boolean {
    return this.isListening;
  }
}

import { Alert } from "react-native";
