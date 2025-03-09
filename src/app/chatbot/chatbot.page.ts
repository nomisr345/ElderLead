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

interface SuggestedPrompt {
  label: string;
  text: string;
  category: 'weather' | 'location' | 'activity';
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

  suggestedPrompts: SuggestedPrompt[] = [
    {
      label: '☀️ Weather Today',
      text: "What's the weather like today?",
      category: 'weather'
    },
    {
      label: '🏃‍♂️ Activities Nearby',
      text: 'What activities can I do nearby?',
      category: 'activity'
    },
    {
      label: '🎯 Popular Places',
      text: 'Where are some popular places to visit?',
      category: 'location'
    },
    {
      label: '🚶‍♂️ Walking Spots',
      text: 'Where can I go for a nice walk?',
      category: 'location'
    },
    {
      label: '🌧️ Rain Check',
      text: 'Will it rain today?',
      category: 'weather'
    },
    {
      label: '🎨 Weekend Activities',
      text: 'What activities can I do this weekend?',
      category: 'activity'
    }
  ];

  storyPrompts: SuggestedPrompt[] = [
    {
      label: '🏫 School Days',
      text: 'I remember my first day at school in Singapore...',
      category: 'activity'
    },
    {
      label: '🎉 Festivals',
      text: 'My favorite festival celebration was...',
      category: 'activity'
    },
    {
      label: '🍜 Food Memories',
      text: 'I remember the old hawker center where...',
      category: 'location'
    },
    {
      label: '👨‍👩‍👧‍👦 Family Time',
      text: 'A special family moment I remember is...',
      category: 'activity'
    }
  ];

  constructor(private openAiService: OpenAiService) {
    this.initializeSpeechRecognition();
  }

  selectMode(mode: 'chat' | 'story') {
    this.activeMode = mode;
    this.messages = [{
      content: mode === 'chat' 
        ? "Hello! Choose a suggestion below or type your own question!" 
        : "I'd love to hear your story! Pick a memory type or share your own.",
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

  getPrompts(): SuggestedPrompt[] {
    return this.activeMode === 'chat' ? this.suggestedPrompts : this.storyPrompts;
  }

  async sendSuggestedPrompt(prompt: SuggestedPrompt) {
    this.userInput = prompt.text;
    await this.sendMessage();
  }

  private initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-SG';

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

  async refresh(event: any) {
    // Reset the chat state
    this.messages = [];
    this.userInput = '';
    this.isLoading = false;
    
    // If we're in a specific mode, reinitialize that mode
    if (this.activeMode) {
      this.messages = [{
        content: this.activeMode === 'chat' 
          ? "Hello! Choose a suggestion below or type your own question!" 
          : "I'd love to hear your story! Pick a memory type or share your own.",
        sender: 'bot',
        type: 'text',
        timestamp: new Date()
      }];
    }

    // Complete the refresh
    event.target.complete();
  }
}