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
    location: `For places in Singapore, provide information in this format:

              Name:
              [Name of the place]

              Location:
              [Simple address or nearest MRT]

              Highlight:
              [One key feature or attraction]

              For Elderly:
              [Accessibility notes for elderly visitors]`,

    weather: `For Singapore weather, provide information in this format:

             Current Weather:
             [Current conditions in simple terms]

             For Elderly:
             [Simple recommendations for elderly]

             Safety Tips:
             [Basic precautions if needed]

             Best Timing:
             [Best times for outdoor activities]`,

    activity: `For elderly-friendly activities in Singapore, provide information in this format:

              Activity:
              [Activity name]

              Details:
              [Basic details and location]

              Safety:
              [Important safety notes]

              Best Timing:
              [Best timing for elderly]

              Cost:
              [Estimated cost if applicable]`,

    default: `Please provide information in this format:

             Main Point:
             [Key information in simple terms]

             Details:
             [Additional information using basic English]

             For Elderly:
             [Specific notes for elderly users]`
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
        max_tokens: 150,
        store: true,
        presence_penalty: -0.5,
        frequency_penalty: 0.3,
        response_format: { type: "text" }
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
            content: `Create a warm story with this structure:

                     Setting:
                     [Set the scene with simple, clear language]

                     Memory:
                     [Share the core memory with emotional details]

                     Reflection:
                     [Add a gentle, uplifting message]

                     Keep it under 4 sentences total and use familiar Singapore references when relevant.` 
          },
          { role: "user", content: memory }
        ],
        temperature: 0.7,
        max_tokens: 200,
        store: true,
        response_format: { type: "text" }
      });

      const story = storyCompletion.choices[0]?.message?.content || 
                   "Let me turn that memory into a story.";

      try {
        const imageResponse = await this.openai.images.generate({
          model: "dall-e-3",
          prompt: `Create a gentle, clear image inspired by this story: ${story}. 
                  Requirements:
                  - Warm and friendly atmosphere
                  - Soft, soothing colors
                  - Simple and clear composition
                  - Easily recognizable elements
                  - Include Singapore cultural elements if relevant
                  - Should be easy for elderly viewers to understand
                  Style: Natural and realistic, like a pleasant photograph`,
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
        story: "I'm having trouble creating your story. Could you share another memory?",
        imageUrl: ""
      };
    }
  }

  private detectMessageType(message: string): MessageType {
    const lowerMessage = message.toLowerCase();
    
    // Location detection
    if (lowerMessage.includes('where') || 
        lowerMessage.includes('location') || 
        lowerMessage.includes('place') ||
        lowerMessage.includes('go to')) {
      return 'location';
    }
    
    // Weather detection
    if (lowerMessage.includes('weather') || 
        lowerMessage.includes('rain') || 
        lowerMessage.includes('hot') ||
        lowerMessage.includes('temperature')) {
      return 'weather';
    }
    
    // Activity detection
    if (lowerMessage.includes('activity') || 
        lowerMessage.includes('do') ||
        lowerMessage.includes('what can') ||
        lowerMessage.includes('things to')) {
      return 'activity';
    }
    
    return 'default';
  }

  private getSystemPrompt(type: MessageType, message: string): string {
    const template = this.CHAT_PROMPT_TEMPLATES[type as keyof PromptTemplates];
    return `You are a friendly AI assistant for elderly users in Singapore.
           ${template}
           
           Important guidelines:
           - Use simple English (avoid complex words)
           - Keep sentences short and clear
           - Use familiar Singapore references
           - Include relevant local context
           - Be patient and supportive
           - Focus on elderly-friendly information
           - Follow the exact formatting structure provided
           - Use clear section headers with colons
           - Add line breaks between sections`;
  }

  private formatResponse(response: string): string {
    // Clean up any asterisks or other special characters
    response = response.replace(/\*\*/g, '')
               .replace(/\[|\]/g, '');
    
    // Ensure proper spacing after section headers
    response = response.replace(/(\w+:)/g, '\n$1');
    
    // Clean up whitespace
    response = response.replace(/\s+/g, ' ').trim();
    
    // Add proper line breaks between sections
    response = response.split('\n').map(line => line.trim()).join('\n\n');
    
    // Remove any excessive line breaks
    response = response.replace(/\n{3,}/g, '\n\n');
    
    return response;
  }

  private formatStory(story: string): string {
    // Remove brackets and special characters
    let formattedStory = story.replace(/\[|\]/g, '');
    
    // Ensure proper spacing after sections
    formattedStory = formattedStory.replace(/(\w+:)/g, '\n$1');
    
    // Clean up whitespace and add proper line breaks
    formattedStory = formattedStory.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n\n');
    
    return formattedStory;
  }

  private getErrorResponse(message: string): string {
    const type = this.detectMessageType(message);
    switch (type) {
      case 'location':
        return "I can help find places in Singapore for you. Which area are you interested in?";
      case 'weather':
        return "I can check Singapore's weather for you. Would you like to know about today's weather?";
      case 'activity':
        return "I can suggest elderly-friendly activities. What kind of activities interest you?";
      default:
        return "Could you ask that again in a simpler way? I'm here to help!";
    }
  }
}