import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpenAiService } from '../services/openai.service';

interface ChatMessage {
  content: string;
  sender: 'user' | 'bot';
  type: 'text' | 'image';
  imageUrl?: string;
  timestamp?: Date;
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.page.html',
  styleUrls: ['./chatbot.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ChatbotPage {
  messages: ChatMessage[] = [];
  userInput = '';
  activeMode: 'chat' | 'story' | null = null;
  recognition: any;
  isLoading = false;

  constructor(private openAiService: OpenAiService) {
    this.initializeSpeechRecognition();
  }

  selectMode(mode: 'chat' | 'story') {
    this.activeMode = mode;
    this.messages = [{
      content: mode === 'chat' 
        ? "Hello! What would you like to chat about?" 
        : "I'd love to hear about a memory that I can turn into a story with an image.",
      sender: 'bot',
      type: 'text',
      timestamp: new Date()
    }];
  }

  resetMode() {
    this.activeMode = null;
    this.messages = [];
    this.userInput = '';
  }

  private initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-SG'; // Set to Singapore English

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          this.userInput = transcript;
          this.sendMessage();
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        this.isLoading = false;
      };
    }
  }

  startVoiceInput() {
    if (this.recognition && !this.isLoading) {
      this.isLoading = true;
      this.recognition.start();
    }
  }

  async sendMessage() {
    if (!this.userInput.trim() || this.isLoading) return;

    const message = this.userInput.trim();
    this.userInput = '';
    this.isLoading = true;

    try {
      // Add user message
      this.messages.push({
        content: message,
        sender: 'user',
        type: 'text',
        timestamp: new Date()
      });

      if (this.activeMode === 'chat') {
        const response = await this.openAiService.generateChatResponse(message);
        this.messages.push({
          content: response,
          sender: 'bot',
          type: 'text',
          timestamp: new Date()
        });
      } else {
        // Add loading message
        const loadingIndex = this.messages.push({
          content: "I'm working on your story and creating an image...",
          sender: 'bot',
          type: 'text',
          timestamp: new Date()
        }) - 1;

        const result = await this.openAiService.generateStoryWithImage(message);
        
        // Remove loading message
        this.messages.splice(loadingIndex, 1);

        if (result.story) {
          this.messages.push({
            content: result.story,
            sender: 'bot',
            type: 'text',
            timestamp: new Date()
          });
        }
        
        if (result.imageUrl) {
          this.messages.push({
            content: '',
            sender: 'bot',
            type: 'image',
            imageUrl: result.imageUrl,
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Message handling error:', error);
      this.messages.push({
        content: 'I encountered an issue. Please try again in a moment.',
        sender: 'bot',
        type: 'text',
        timestamp: new Date()
      });
    } finally {
      this.isLoading = false;
    }
  }
}