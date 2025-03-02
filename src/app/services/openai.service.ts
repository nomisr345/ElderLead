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

@Injectable({
  providedIn: 'root'
})
export class OpenAiService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: environment.openaiApiKey,
      dangerouslyAllowBrowser: true
    });
  }

  async generateChatResponse(message: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `You are a friendly and patient AI companion for elderly users in Singapore.
                     Keep responses clear, helpful, and relevant to Singapore context.
                     For location questions, be specific about Singapore locations.
                     For weather questions, ask which part of Singapore they're in.
                     For health-related questions, recommend consulting healthcare providers.
                     For activities, suggest age-appropriate options in Singapore.` 
          },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 150,
        store: true
      });
      
      return completion.choices[0]?.message?.content || 
             "I'm sorry, could you rephrase that question?";
    } catch (err) {
      const error = err as OpenAIError;
      console.error('Chat error:', error);
      
      // Provide context-aware fallback responses
      if (message.toLowerCase().includes('weather')) {
        return "I'm having trouble checking the weather right now. Could you tell me which area of Singapore you're asking about?";
      }
      if (message.toLowerCase().includes('park') || message.toLowerCase().includes('activity')) {
        return "I'm having trouble at the moment, but I'd be happy to suggest some activities or parks in your area. Which part of Singapore are you in?";
      }
      return "I'm having a temporary issue connecting to my service. Could you try asking your question again?";
    }
  }

  async generateStoryWithImage(memory: string): Promise<{ story: string; imageUrl: string }> {
    try {
      // First generate the story
      const storyCompletion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `You are helping elderly users relive their memories.
                     Create a warm, descriptive paragraph about their memory.
                     Focus on sensory details and positive emotions.
                     Keep the tone gentle and nostalgic.
                     The description should be suitable for image generation.` 
          },
          { role: "user", content: memory }
        ],
        temperature: 0.7,
        max_tokens: 200,
        store: true
      });

      const story = storyCompletion.choices[0]?.message?.content || 
                   "Let me help you create a story about that memory.";

      // Then generate the image based on the story
      try {
        const imageResponse = await this.openai.images.generate({
          model: "dall-e-3",
          prompt: `Create a warm, cheerful image showing: ${story}. 
                  Style: Natural, gentle colors, welcoming atmosphere.
                  Make it clear and easy to understand for elderly viewers.`,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          style: "natural"
        });

        return {
          story,
          imageUrl: imageResponse.data[0]?.url || ""
        };
      } catch (err) {
        const imageError = err as OpenAIError;
        console.error('Image generation error:', imageError);
        // Return the story even if image generation fails
        return {
          story,
          imageUrl: ""
        };
      }
    } catch (err) {
      const error = err as OpenAIError;
      console.error('Story generation error:', error);
      return {
        story: "I'm having trouble creating your story right now. Could you try telling me more about your memory?",
        imageUrl: ""
      };
    }
  }

  private async retryWithDelay(operation: () => Promise<any>, retries = 3, delay = 1000): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (err) {
        const error = err as OpenAIError;
        if (i === retries - 1) throw error;
        if (error.response?.status === 429) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
          continue;
        }
        throw error;
      }
    }
  }
}