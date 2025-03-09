import { Injectable } from '@angular/core';
import OpenAI from 'openai';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OpenAiService {
  private openai: OpenAI;
  private assistantId = 'asst_hR5J9KZyLg1Wxnz3F2U9XvUY'; // Your Assistant ID
  private threadId: string | null = null;

  constructor() {
    this.openai = new OpenAI({
      apiKey: environment.openaiApiKey,
      dangerouslyAllowBrowser: true
    });
  }

  async createNewThread(): Promise<string> {
    try {
      const thread = await this.openai.beta.threads.create();
      this.threadId = thread.id;
      localStorage.setItem('elderleadThreadId', thread.id);
      return thread.id;
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
  }

  async loadExistingThread(): Promise<void> {
    const savedThreadId = localStorage.getItem('elderleadThreadId');
    if (savedThreadId) {
      try {
        // Check if the thread still exists
        await this.openai.beta.threads.retrieve(savedThreadId);
        this.threadId = savedThreadId;
      } catch (error) {
        console.error('Saved thread no longer exists, creating new one:', error);
        await this.createNewThread();
      }
    } else {
      await this.createNewThread();
    }
  }

  async generateChatResponse(message: string, language: string = 'en'): Promise<string> {
    try {
      // Create a thread if it doesn't exist yet
      if (!this.threadId) {
        await this.loadExistingThread();
      }

      // Add the user's message to the thread
      await this.openai.beta.threads.messages.create(
        this.threadId!,
        {
          role: 'user',
          content: message
        }
      );

      // Create a run to process the messages
      const run = await this.openai.beta.threads.runs.create(
        this.threadId!,
        {
          assistant_id: this.assistantId,
          instructions: this.getLanguageInstructions(language)
        }
      );

      // Wait for the run to complete
      let runStatus = await this.openai.beta.threads.runs.retrieve(
        this.threadId!,
        run.id
      );

      // Poll for completion
      let startTime = new Date().getTime();
      const MAX_WAIT_TIME = 30000; // 30 seconds timeout
      
      while (runStatus.status !== 'completed' && 
             runStatus.status !== 'failed' && 
             runStatus.status !== 'cancelled' && 
             runStatus.status !== 'expired') {
        
        // Check if we've exceeded the maximum wait time
        if (new Date().getTime() - startTime > MAX_WAIT_TIME) {
          try {
            console.log('Run timed out, attempting to cancel');
            await this.openai.beta.threads.runs.cancel(this.threadId!, run.id);
          } catch (cancelError) {
            console.error('Error cancelling run (might already be completed):', cancelError);
          }
          return this.getTimeoutResponse(language);
        }
        
        // Wait before checking status again
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          runStatus = await this.openai.beta.threads.runs.retrieve(
            this.threadId!,
            run.id
          );
        } catch (statusError) {
          console.error('Error checking run status:', statusError);
          break;
        }
      }

      if (runStatus.status !== 'completed') {
        console.error('Run failed or cancelled:', runStatus);
        return this.getErrorResponse(language);
      }

      // Get the latest messages from the thread
      const messages = await this.openai.beta.threads.messages.list(
        this.threadId!
      );

      // Find the most recent assistant message
      const assistantMessages = messages.data.filter(msg => msg.role === 'assistant');
      if (assistantMessages.length === 0) {
        return this.getDefaultResponse(language);
      }

      // Get the latest assistant message
      const latestMessage = assistantMessages[0];
      
      // Extract the text content
      let responseText = '';
      if (latestMessage.content && latestMessage.content.length > 0) {
        const textContent = latestMessage.content.find(content => content.type === 'text');
        if (textContent && 'text' in textContent) {
          responseText = textContent.text.value;
        }
      }

      return responseText || this.getDefaultResponse(language);
    } catch (error) {
      console.error('Error generating chat response:', error);
      return this.getErrorResponse(language);
    }
  }

  async generateImageDirect(prompt: string): Promise<string> {
    try {
      console.log('Generating image with prompt:', prompt);
      
      const imageResponse = await this.openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "natural"
      });
      
      return imageResponse.data[0]?.url || "";
    } catch (error) {
      console.error('Error directly generating image:', error);
      return "";
    }
  }

  async generateStoryWithImage(memory: string, language: string = 'en'): Promise<{ story: string; imageUrl: string }> {
    try {
      // Create a thread if it doesn't exist yet
      if (!this.threadId) {
        await this.loadExistingThread();
      }

      // Add the user's memory to the thread
      await this.openai.beta.threads.messages.create(
        this.threadId!,
        {
          role: 'user',
          content: `Turn this memory into a story: ${memory}`
        }
      );

      // Create a run to process the message
      const run = await this.openai.beta.threads.runs.create(
        this.threadId!,
        {
          assistant_id: this.assistantId,
          instructions: this.getStoryInstructions(language)
        }
      );

      // Wait for run to complete with a longer timeout (45 seconds)
      let runStatus = await this.openai.beta.threads.runs.retrieve(
        this.threadId!,
        run.id
      );
      
      let startTime = new Date().getTime();
      const MAX_WAIT_TIME = 45000; // 45 seconds timeout

      while (runStatus.status !== 'completed' && 
             runStatus.status !== 'failed' && 
             runStatus.status !== 'cancelled' && 
             runStatus.status !== 'expired') {
        
        // Check if we've exceeded the maximum wait time
        if (new Date().getTime() - startTime > MAX_WAIT_TIME) {
          try {
            console.log('Run timed out, attempting to cancel');
            await this.openai.beta.threads.runs.cancel(this.threadId!, run.id);
          } catch (cancelError) {
            console.error('Error cancelling run (might already be completed):', cancelError);
          }
          break;
        }
        
        // Wait before checking status again
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          runStatus = await this.openai.beta.threads.runs.retrieve(
            this.threadId!,
            run.id
          );
        } catch (statusError) {
          console.error('Error checking run status:', statusError);
          break;
        }
      }

      // Get the story from the assistant's response
      let story = '';
      if (runStatus.status === 'completed') {
        try {
          const messages = await this.openai.beta.threads.messages.list(
            this.threadId!
          );
          
          const assistantMessages = messages.data.filter(msg => msg.role === 'assistant');
          if (assistantMessages.length > 0) {
            const latestMessage = assistantMessages[0];
            if (latestMessage.content && latestMessage.content.length > 0) {
              const textContent = latestMessage.content.find(content => content.type === 'text');
              if (textContent && 'text' in textContent) {
                story = textContent.text.value;
              }
            }
          }
        } catch (messageError) {
          console.error('Error retrieving messages:', messageError);
        }
      }

      if (!story) {
        story = this.getDefaultStoryResponse(language);
      }

      // Generate image using DALL-E directly with a simplified prompt
      // This bypasses the Assistant API for image generation which is more reliable
      let imageUrl = '';
      try {
        // Create a simplified prompt for the image based on the memory
        const simplifiedPrompt = `Create a warm, gentle image about: ${memory}. 
          Make it suitable for elderly viewers with soft colors and clear composition.
          Include Singapore cultural elements if relevant.`;
        
        imageUrl = await this.generateImageDirect(simplifiedPrompt);
      } catch (imageError) {
        console.error('Failed to generate image:', imageError);
      }

      return {
        story: story,
        imageUrl: imageUrl
      };
    } catch (error) {
      console.error('Error in story/image generation:', error);
      return {
        story: this.getDefaultStoryResponse(language),
        imageUrl: ""
      };
    }
  }

  private getLanguageInstructions(language: string): string {
    const languageStr = language === 'en' ? 'English' : 
                       language === 'zh' ? 'Chinese (中文)' : 
                       language === 'ms' ? 'Malay (Bahasa Melayu)' : 
                       'Tamil (தமிழ்)';
                       
    return `You are ElderLead, a friendly companion chatbot for elderly users in Singapore.
            IMPORTANT: Always respond in ${languageStr}.
            
            Be conversational, empathetic, and supportive. When users share personal experiences 
            or stories like "I just got back from my grandson's game", show interest and enthusiasm.
            
            Guidelines:
            - Use simple language appropriate for elderly users
            - Keep sentences short and clear
            - Show authentic interest in their lives and stories
            - Reference Singapore locations and cultural context when relevant
            - Be patient and understanding
            - Provide practical information when asked about activities, weather, or locations
            - For personal stories, respond warmly and ask follow-up questions
            
            Remember that the user is elderly and may appreciate both practical help and companionship.`;
  }

  private getStoryInstructions(language: string): string {
    const languageStr = language === 'en' ? 'English' : 
                       language === 'zh' ? 'Chinese (中文)' : 
                       language === 'ms' ? 'Malay (Bahasa Melayu)' : 
                       'Tamil (தமிழ்)';
                       
    return `Create a warm, touching story based on the user's memory. 
            IMPORTANT: Respond in ${languageStr}.
            
            Structure the story with:
            - Setting: Set the scene with simple, clear language
            - Memory: Share the core memory with emotional details
            - Reflection: Add a gentle, uplifting message
            
            The story should be 3-4 sentences long and include familiar Singapore references when relevant.
            Use a warm, nostalgic tone appropriate for elderly readers.`;
  }

  // Helper methods for responses in different languages
  private getDefaultResponse(language: string): string {
    const responses: Record<string, string> = {
      'en': "I'd love to chat with you! What would you like to talk about?",
      'zh': "我很乐意和您聊天！您想聊些什么？",
      'ms': "Saya suka berbual dengan anda! Apa yang anda ingin bincangkan?",
      'ta': "உங்களுடன் உரையாட விரும்புகிறேன்! நீங்கள் என்ன பற்றி பேச விரும்புகிறீர்கள்?"
    };
    
    return responses[language] || responses['en'];
  }

  private getErrorResponse(language: string): string {
    const responses: Record<string, string> = {
      'en': "I'm having trouble understanding that. Can you try again with a different question?",
      'zh': "我理解得有些困难。您能换个问题再试一次吗？",
      'ms': "Saya menghadapi masalah memahami itu. Boleh anda cuba lagi dengan soalan yang berbeza?",
      'ta': "அதைப் புரிந்துகொள்வதில் எனக்கு சிரமம் உள்ளது. வேறு கேள்வியுடன் மீண்டும் முயற்சிக்க முடியுமா?"
    };
    
    return responses[language] || responses['en'];
  }

  private getTimeoutResponse(language: string): string {
    const responses: Record<string, string> = {
      'en': "I'm taking a bit long to think about this. Could we try a different topic?",
      'zh': "我思考这个问题需要点时间。我们能换个话题吗？",
      'ms': "Saya mengambil masa yang agak lama untuk memikirkan ini. Bolehkah kita cuba topik lain?",
      'ta': "இதைப் பற்றி சிந்திக்க எனக்கு சிறிது நேரம் ஆகிறது. வேறு தலைப்பை முயற்சிக்கலாமா?"
    };
    
    return responses[language] || responses['en'];
  }

  private getDefaultStoryResponse(language: string): string {
    const responses: Record<string, string> = {
      'en': "Let me turn that memory into a story.",
      'zh': "让我把这段记忆变成一个故事。",
      'ms': "Biar saya ubah kenangan itu menjadi sebuah cerita.",
      'ta': "அந்த நினைவை ஒரு கதையாக மாற்ற எனக்கு அனுமதி கொடுங்கள்."
    };
    
    return responses[language] || responses['en'];
  }

  async testConnection(): Promise<boolean> {
    try {
      // Try a simple API call
      const models = await this.openai.models.list();
      console.log("API connection successful:", models.data.length, "models available");
      return true;
    } catch (error) {
      console.error("API connection failed:", error);
      return false;
    }
  }
}