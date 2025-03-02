import { Injectable } from '@angular/core';
import OpenAI from 'openai';
import { environment } from '../../environments/environment';

interface OpenAIError {
  response?: {
    status?: number;
    data?: any;
  };
  message?: string;
}

type MessageType = 'location' | 'weather' | 'activity' | 'default';

interface PromptTemplates {
  location: string;
  weather: string;
  activity: string;
  default: string;
}

@Injectable({
  providedIn: 'root'
})
export class OpenAiService {
  private openai: OpenAI;
  private readonly CHAT_PROMPT_TEMPLATES: PromptTemplates = {
    location: `Please suggest places. Keep the response short and clear. Include:
              - Name
              - Simple address
              - One key feature`,
    weather: `For Singapore weather:
             - Current conditions
             - Simple recommendation`,
    activity: `Suggest age-friendly activities. Include:
              - Activity name
              - Basic details
              - Safety note if needed`,
    default: `Please provide a simple, clear response suitable for elderly users.
             Use basic English and short sentences.`
  };

  constructor() {
    this.openai = new OpenAI({
      apiKey: environment.openaiApiKey,
      dangerouslyAllowBrowser: true
    });
  }

  async generateChatResponse(message: string): Promise<string> {
    try {
      const messageType = this.detectMessageType(message);
      const systemPrompt = this.getSystemPrompt(messageType, message);

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: systemPrompt
          },
          { role: "user", content: message }
        ],
        temperature: 0.5,
        max_tokens: 100,
        store: true,
        presence_penalty: -0.5,
        frequency_penalty: 0.3
      });
      
      let response = completion.choices[0]?.message?.content || 
                    "I'm sorry, could you ask that again in a simpler way?";

      response = this.formatResponse(response);
      
      return response;
    } catch (err) {
      const error = err as OpenAIError;
      console.error('Chat error:', error);
      return this.getErrorResponse(message);
    }
  }

  async generateStoryWithImage(memory: string): Promise<{ story: string; imageUrl: string }> {
    try {
      const storyCompletion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `Create a short, warm story about this memory.
                     - Use simple, clear language
                     - Focus on feelings and sensory details
                     - Keep it under 3 sentences
                     - Avoid complex words
                     - Make it personal and relatable` 
          },
          { role: "user", content: memory }
        ],
        temperature: 0.7,
        max_tokens: 150,
        store: true
      });

      const story = storyCompletion.choices[0]?.message?.content || 
                   "Let me turn that memory into a story.";

      try {
        // In the generateStoryWithImage method, update the image generation:
        const imageResponse = await this.openai.images.generate({
          model: "dall-e-3",
          prompt: `Create a gentle, clear image of: ${story}. 
                  Make it warm and friendly, with soft colors.
                  Style: Simple and clear, like a pleasant photograph.
                  Should be easy for elderly viewers to understand.`,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          style: "natural"
        });

        return {
          story: this.formatStory(story),
          imageUrl: imageResponse.data[0]?.url || ""
        };
      } catch (err) {
        console.error('Image generation error:', err);
        return { story, imageUrl: "" };
      }
    } catch (err) {
      console.error('Story generation error:', err);
      return {
        story: "I'm having trouble with your story. Could you share another memory?",
        imageUrl: ""
      };
    }
  }

  private detectMessageType(message: string): MessageType {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('where') || lowerMessage.includes('location') || 
        lowerMessage.includes('place')) return 'location';
    if (lowerMessage.includes('weather')) return 'weather';
    if (lowerMessage.includes('activity') || lowerMessage.includes('do')) return 'activity';
    return 'default';
  }

  private getSystemPrompt(type: MessageType, message: string): string {
    const template = this.CHAT_PROMPT_TEMPLATES[type as keyof PromptTemplates];
    return `You are a friendly AI assistant for elderly users in Singapore.
           ${template}
           Always use simple English and clear formatting.
           Keep responses brief but complete.`;
  }

  private formatResponse(response: string): string {
    response = response.replace(/\s+/g, ' ').trim();
    
    if (response.length > 50) {
      response = response.replace(/([.!?])\s+/g, '$1\n');
    }
    
    return response;
  }

  private formatStory(story: string): string {
    return story.trim().replace(/\s+/g, ' ');
  }

  private getErrorResponse(message: string): string {
    const type = this.detectMessageType(message);
    switch (type) {
      case 'location':
        return "I can help find places for you. Which area of Singapore are you interested in?";
      case 'weather':
        return "I can check the weather for you. Which part of Singapore are you in?";
      case 'activity':
        return "I can suggest activities. Which area are you in?";
      default:
        return "Could you ask that again in a simpler way?";
    }
  }
}