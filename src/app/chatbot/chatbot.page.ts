import { Component, OnInit, ViewChild } from '@angular/core';
import { IonicModule, IonContent } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OpenAiService } from '../services/openai.service';

interface ChatMessage {
  content: string;
  sender: 'user' | 'bot';
  type: 'text' | 'image';
  imageUrl?: string;
  timestamp?: Date;
  language?: string;
}

interface SuggestedPrompt {
  label: string;
  text: string;
  category: 'weather' | 'location' | 'activity';
  language?: string;
}

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.page.html',
  styleUrls: ['./chatbot.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ChatbotPage implements OnInit {
  @ViewChild(IonContent) content!: IonContent;
  
  messages: ChatMessage[] = [];
  userInput = '';
  activeMode: 'chat' | 'story' | null = null;
  recognition: any;
  isLoading = false;
  currentLanguage: string = 'en';

  // Language options
  languages: LanguageOption[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
    { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' }
  ];

  // UI text in different languages
  uiText = {
    en: {
      appTitle: 'AI Companion',
      welcomeMessage: "Hello! Choose a suggestion below or type your own question! You can change the language using the language button in the top right corner.",
      storyWelcome: "I'd love to hear your story! Pick a memory type or share your own.",
      chatMode: "Chat Mode",
      storyMode: "Story Mode",
      chatDescription: "Let's chat! I can help with questions about activities, weather, or just have a friendly conversation.",
      storyDescription: "Share your memories with me and I'll help create a story with pictures!",
      inputPlaceholder: "Type your message...",
      storyInputPlaceholder: "Share a memory...",
      backToMenu: "Back to Menu",
      loadingMessage: "I'm working on your story and creating an image...",
      errorMessage: "I encountered an issue. Please try again in a moment.",
      processingRequest: "Processing your request..."
    },
    zh: {
      appTitle: '长者同伴',
      welcomeMessage: "您好！选择下面的建议或输入您自己的问题！您可以使用右上角的语言按钮更改语言。",
      storyWelcome: "我很想听听您的故事！选择一种记忆类型或分享您自己的故事。",
      chatMode: "聊天模式",
      storyMode: "故事模式",
      chatDescription: "让我们聊天吧！我可以帮助回答关于活动、天气的问题，或者只是进行友好的交谈。",
      storyDescription: "与我分享您的记忆，我将帮助创建带有图片的故事！",
      inputPlaceholder: "输入您的消息...",
      storyInputPlaceholder: "分享一段记忆...",
      backToMenu: "返回菜单",
      loadingMessage: "我正在创作您的故事并生成图像...",
      errorMessage: "我遇到了问题。请稍后再试。",
      processingRequest: "正在处理您的请求..."
    },
    ms: {
      appTitle: 'Rakan ElderLead',
      welcomeMessage: "Hai! Pilih cadangan di bawah atau taip soalan anda sendiri! Anda boleh menukar bahasa menggunakan butang bahasa di sudut kanan atas.",
      storyWelcome: "Saya ingin mendengar cerita anda! Pilih jenis kenangan atau kongsikan kenangan anda sendiri.",
      chatMode: "Mod Perbualan",
      storyMode: "Mod Cerita",
      chatDescription: "Mari berbual! Saya boleh membantu dengan soalan tentang aktiviti, cuaca, atau sekadar perbualan mesra.",
      storyDescription: "Kongsi kenangan anda dengan saya dan saya akan membantu mencipta cerita dengan gambar!",
      inputPlaceholder: "Taip mesej anda...",
      storyInputPlaceholder: "Kongsi kenangan...",
      backToMenu: "Kembali ke Menu",
      loadingMessage: "Saya sedang menyiapkan cerita anda dan mencipta imej...",
      errorMessage: "Saya menghadapi masalah. Sila cuba lagi sebentar.",
      processingRequest: "Memproses permintaan anda..."
    },
    ta: {
      appTitle: 'எல்டர்லீட் தோழர்',
      welcomeMessage: "வணக்கம்! கீழே உள்ள பரிந்துரைகளைத் தேர்ந்தெடுக்கவும் அல்லது உங்கள் சொந்த கேள்வியைத் தட்டச்சு செய்யவும்! வலது மேல் மூலையில் உள்ள மொழி பொத்தானைப் பயன்படுத்தி மொழியை மாற்றலாம்.",
      storyWelcome: "உங்கள் கதையைக் கேட்க விரும்புகிறேன்! ஒரு நினைவு வகையைத் தேர்ந்தெடுக்கவும் அல்லது உங்கள் சொந்த நினைவைப் பகிரவும்.",
      chatMode: "அரட்டை முறை",
      storyMode: "கதை முறை",
      chatDescription: "நாம் அரட்டையடிப்போம்! நடவடிக்கைகள், வானிலை பற்றிய கேள்விகளுக்கு உதவலாம், அல்லது நட்பு உரையாடலை மேற்கொள்ளலாம்.",
      storyDescription: "உங்கள் நினைவுகளை என்னுடன் பகிர்ந்துகொள்ளுங்கள், நான் படங்களுடன் ஒரு கதையை உருவாக்க உதவுவேன்!",
      inputPlaceholder: "உங்கள் செய்தியைத் தட்டச்சு செய்யவும்...",
      storyInputPlaceholder: "ஒரு நினைவைப் பகிரவும்...",
      backToMenu: "மெனுவிற்குத் திரும்புக",
      loadingMessage: "நான் உங்கள் கதையை உருவாக்கி, படத்தை உருவாக்குகிறேன்...",
      errorMessage: "நான் ஒரு சிக்கலை சந்தித்தேன். சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.",
      processingRequest: "உங்கள் கோரிக்கையை செயலாக்குகிறது..."
    }
  };

  // English prompts
  suggestedPromptsEn: SuggestedPrompt[] = [
    {
      label: '☀️ Weather Today',
      text: "What's the weather like today?",
      category: 'weather',
      language: 'en'
    },
    {
      label: '🏃‍♂️ Activities Nearby',
      text: 'What activities can I do nearby?',
      category: 'activity',
      language: 'en'
    },
    {
      label: '🎯 Popular Places',
      text: 'Where are some popular places to visit?',
      category: 'location',
      language: 'en'
    },
    {
      label: '🚶‍♂️ Walking Spots',
      text: 'Where can I go for a nice walk?',
      category: 'location',
      language: 'en'
    },
    {
      label: '🌧️ Rain Check',
      text: 'Will it rain today?',
      category: 'weather',
      language: 'en'
    },
    {
      label: '🎨 Weekend Activities',
      text: 'What activities can I do this weekend?',
      category: 'activity',
      language: 'en'
    }
  ];

  // Chinese prompts
  suggestedPromptsZh: SuggestedPrompt[] = [
    {
      label: '☀️ 今日天气',
      text: "今天天气怎么样？",
      category: 'weather',
      language: 'zh'
    },
    {
      label: '🏃‍♂️ 附近活动',
      text: '附近有什么活动可以参加？',
      category: 'activity',
      language: 'zh'
    },
    {
      label: '🎯 热门景点',
      text: '有哪些热门景点可以参观？',
      category: 'location',
      language: 'zh'
    },
    {
      label: '🚶‍♂️ 散步地点',
      text: '哪里适合散步？',
      category: 'location',
      language: 'zh'
    },
    {
      label: '🌧️ 会下雨吗',
      text: '今天会下雨吗？',
      category: 'weather',
      language: 'zh'
    },
    {
      label: '🎨 周末活动',
      text: '周末可以做什么活动？',
      category: 'activity',
      language: 'zh'
    }
  ];

  // Malay prompts
  suggestedPromptsMs: SuggestedPrompt[] = [
    {
      label: '☀️ Cuaca Hari Ini',
      text: "Bagaimana cuaca hari ini?",
      category: 'weather',
      language: 'ms'
    },
    {
      label: '🏃‍♂️ Aktiviti Berdekatan',
      text: 'Apa aktiviti yang boleh saya lakukan di sekitar sini?',
      category: 'activity',
      language: 'ms'
    },
    {
      label: '🎯 Tempat Popular',
      text: 'Di mana tempat popular untuk dilawati?',
      category: 'location',
      language: 'ms'
    },
    {
      label: '🚶‍♂️ Tempat Berjalan',
      text: 'Di mana saya boleh berjalan-jalan?',
      category: 'location',
      language: 'ms'
    },
    {
      label: '🌧️ Semakan Hujan',
      text: 'Adakah hari ini akan hujan?',
      category: 'weather',
      language: 'ms'
    },
    {
      label: '🎨 Aktiviti Hujung Minggu',
      text: 'Apa aktiviti yang boleh saya lakukan pada hujung minggu ini?',
      category: 'activity',
      language: 'ms'
    }
  ];

  // Tamil prompts
  suggestedPromptsTa: SuggestedPrompt[] = [
    {
      label: '☀️ இன்றைய வானிலை',
      text: "இன்று வானிலை எப்படி உள்ளது?",
      category: 'weather',
      language: 'ta'
    },
    {
      label: '🏃‍♂️ அருகில் செயல்பாடுகள்',
      text: 'அருகில் நான் என்ன செயல்பாடுகளைச் செய்யலாம்?',
      category: 'activity',
      language: 'ta'
    },
    {
      label: '🎯 பிரபலமான இடங்கள்',
      text: 'பார்வையிட பிரபலமான இடங்கள் எங்கே உள்ளன?',
      category: 'location',
      language: 'ta'
    },
    {
      label: '🚶‍♂️ நடைபயிற்சி இடங்கள்',
      text: 'அழகான நடைப்பயணத்திற்கு எங்கே செல்லலாம்?',
      category: 'location',
      language: 'ta'
    },
    {
      label: '🌧️ மழை பரிசோதனை',
      text: 'இன்று மழை பெய்யுமா?',
      category: 'weather',
      language: 'ta'
    },
    {
      label: '🎨 வார இறுதி செயல்பாடுகள்',
      text: 'இந்த வார இறுதியில் நான் என்ன செயல்பாடுகளைச் செய்யலாம்?',
      category: 'activity',
      language: 'ta'
    }
  ];

  // English story prompts
  storyPromptsEn: SuggestedPrompt[] = [
    {
      label: '🏫 School Days',
      text: 'I remember my first day at school in Singapore...',
      category: 'activity',
      language: 'en'
    },
    {
      label: '🎉 Festivals',
      text: 'My favorite festival celebration was...',
      category: 'activity',
      language: 'en'
    },
    {
      label: '🍜 Food Memories',
      text: 'I remember the old hawker center where...',
      category: 'location',
      language: 'en'
    },
    {
      label: '👨‍👩‍👧‍👦 Family Time',
      text: 'A special family moment I remember is...',
      category: 'activity',
      language: 'en'
    }
  ];

  // Chinese story prompts
  storyPromptsZh: SuggestedPrompt[] = [
    {
      label: '🏫 学校时光',
      text: '我记得在新加坡上学的第一天...',
      category: 'activity',
      language: 'zh'
    },
    {
      label: '🎉 节日庆典',
      text: '我最喜欢的节日庆典是...',
      category: 'activity',
      language: 'zh'
    },
    {
      label: '🍜 美食回忆',
      text: '我记得那个旧小贩中心，那里...',
      category: 'location',
      language: 'zh'
    },
    {
      label: '👨‍👩‍👧‍👦 家庭时光',
      text: '我记得一个特别的家庭时刻是...',
      category: 'activity',
      language: 'zh'
    }
  ];

  // Malay story prompts
  storyPromptsMs: SuggestedPrompt[] = [
    {
      label: '🏫 Hari Persekolahan',
      text: 'Saya ingat hari pertama saya di sekolah di Singapura...',
      category: 'activity',
      language: 'ms'
    },
    {
      label: '🎉 Perayaan',
      text: 'Perayaan festival kegemaran saya adalah...',
      category: 'activity',
      language: 'ms'
    },
    {
      label: '🍜 Kenangan Makanan',
      text: 'Saya ingat pusat penjaja lama di mana...',
      category: 'location',
      language: 'ms'
    },
    {
      label: '👨‍👩‍👧‍👦 Masa Keluarga',
      text: 'Satu momen keluarga istimewa yang saya ingat ialah...',
      category: 'activity',
      language: 'ms'
    }
  ];

  // Tamil story prompts
  storyPromptsTa: SuggestedPrompt[] = [
    {
      label: '🏫 பள்ளி நாட்கள்',
      text: 'சிங்கப்பூரில் பள்ளியில் என் முதல் நாள் நினைவிருக்கிறது...',
      category: 'activity',
      language: 'ta'
    },
    {
      label: '🎉 திருவிழாக்கள்',
      text: 'எனக்கு பிடித்த திருவிழா கொண்டாட்டம்...',
      category: 'activity',
      language: 'ta'
    },
    {
      label: '🍜 உணவு நினைவுகள்',
      text: 'அந்த பழைய ஹாக்கர் மையம் நினைவில் உள்ளது, அங்கே...',
      category: 'location',
      language: 'ta'
    },
    {
      label: '👨‍👩‍👧‍👦 குடும்ப நேரம்',
      text: 'நான் நினைவில் கொள்ளும் ஒரு சிறப்பு குடும்ப தருணம்...',
      category: 'activity',
      language: 'ta'
    }
  ];

  constructor(private openAiService: OpenAiService) {}

  scrollToBottom() {
    if (this.content) {
      this.content.scrollToBottom(300); // 300 ms duration
    }
  }

  async ngOnInit() {
    this.loadSavedLanguage();
    this.initializeSpeechRecognition();
    // Initialization logic remains unchanged...
    
    // Initialize the OpenAI thread
    try {
      await this.openAiService.loadExistingThread();
    } catch (error) {
      console.error('Error initializing thread:', error);
    }

    // Test the API connection
    this.openAiService.testConnection().then(success => {
      if (success) {
        console.log("OpenAI connection established successfully");
      } else {
        console.error("Failed to connect to OpenAI API");
      }
    });
  }

  loadSavedLanguage() {
    const savedLanguage = localStorage.getItem('elderleadLanguage');
    if (savedLanguage && ['en', 'zh', 'ms', 'ta'].includes(savedLanguage)) {
      this.currentLanguage = savedLanguage;
    }
  }

  saveLanguagePreference(language: string) {
    localStorage.setItem('elderleadLanguage', language);
  }

  changeLanguage(language: string) {
    this.currentLanguage = language;
    this.saveLanguagePreference(language);
    
    // Update speech recognition language
    this.updateRecognitionLanguage();
    
    // Add language change notification if already in a mode
    if (this.activeMode) {
      const languageNames = {
        'en': 'English',
        'zh': '中文 (Chinese)',
        'ms': 'Bahasa Melayu (Malay)',
        'ta': 'தமிழ் (Tamil)'
      };
      
      this.messages.push({
        content: `Language changed to ${languageNames[language as keyof typeof languageNames]}`,
        sender: 'bot',
        type: 'text',
        timestamp: new Date(),
        language: 'en' // This message is always in English for clarity
      });
      
      // Add a welcome message in the new language
      this.messages.push({
        content: this.activeMode === 'chat' 
          ? this.getText('welcomeMessage')
          : this.getText('storyWelcome'),
        sender: 'bot',
        type: 'text',
        timestamp: new Date(),
        language: language
      });
      
      this.scrollToBottom();
    }
  }

  getText(key: string): string {
    return this.uiText[this.currentLanguage as keyof typeof this.uiText][key as keyof (typeof this.uiText)['en']] || '';
  }

  getCurrentLanguageName(): string {
    const names = {
      'en': 'EN',
      'zh': '中文',
      'ms': 'MY',
      'ta': 'தமிழ்'
    };
    return names[this.currentLanguage as keyof typeof names] || 'EN';
  }

  getEnhancedWelcomeMessage(): string {
    const languageInstructions = {
      'en': "Hello! Choose a suggestion above or type your own question! You can change the language using the language button in the top right corner.",
      'zh': "您好！选择上面的建议或输入您自己的问题！您可以使用右上角的语言按钮更改语言。",
      'ms': "Hai! Pilih cadangan di atas atau taip soalan anda sendiri! Anda boleh menukar bahasa menggunakan butang bahasa di sudut kanan atas.",
      'ta': "வணக்கம்! மேலே உள்ள பரிந்துரையைத் தேர்ந்தெடுக்கவும் அல்லது உங்கள் சொந்தக் கேள்வியைத் தட்டச்சு செய்யவும்! வலது மேல் மூலையில் உள்ள மொழி பொத்தானைப் பயன்படுத்தி மொழியை மாற்றலாம்."
    };
    
    return languageInstructions[this.currentLanguage as keyof typeof languageInstructions] || languageInstructions['en'];
  }

  selectMode(mode: 'chat' | 'story') {
    this.activeMode = mode;
    this.messages = [{
      content: mode === 'chat' 
        ? this.getEnhancedWelcomeMessage()
        : this.getText('storyWelcome'),
      sender: 'bot',
      type: 'text',
      timestamp: new Date(),
      language: this.currentLanguage
    }];
    this.scrollToBottom();
  }

  resetMode() {
    this.activeMode = null;
    this.messages = [];
    this.userInput = '';
  }

  getPrompts(): SuggestedPrompt[] {
    if (this.activeMode === 'chat') {
      switch (this.currentLanguage) {
        case 'zh': return this.suggestedPromptsZh;
        case 'ms': return this.suggestedPromptsMs;
        case 'ta': return this.suggestedPromptsTa;
        default: return this.suggestedPromptsEn;
      }
    } else {
      switch (this.currentLanguage) {
        case 'zh': return this.storyPromptsZh;
        case 'ms': return this.storyPromptsMs;
        case 'ta': return this.storyPromptsTa;
        default: return this.storyPromptsEn;
      }
    }
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
      this.updateRecognitionLanguage();

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

  private updateRecognitionLanguage() {
    if (!this.recognition) return;
    
    // Map our language codes to Web Speech API language codes
    const langMap: {[key: string]: string} = {
      'en': 'en-SG', // Singapore English
      'zh': 'zh-CN', // Mandarin Chinese
      'ms': 'ms-MY', // Malay
      'ta': 'ta-SG'  // Tamil
    };
    
    this.recognition.lang = langMap[this.currentLanguage] || 'en-SG';
  }

  startVoiceInput() {
    if (this.recognition && !this.isLoading) {
      this.updateRecognitionLanguage();
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
        timestamp: new Date(),
        language: this.currentLanguage
      });
      this.scrollToBottom();

      // Check if this is a direct image generation request
      const isImageRequest = message.includes('图像') || 
                            message.includes('生成') ||
                            message.toLowerCase().includes('image') || 
                            message.toLowerCase().includes('picture');

      if (this.activeMode === 'chat') {
        if (isImageRequest) {
          // Direct image generation in chat mode
          this.messages.push({
            content: this.getImageGenerationMessage(),
            sender: 'bot',
            type: 'text',
            timestamp: new Date(),
            language: this.currentLanguage
          });
          this.scrollToBottom();
          
          const imageUrl = await this.openAiService.generateImageDirect(message);
          
          if (imageUrl) {
            // Handle image
            const img = new Image();
            img.onload = () => {
              this.scrollToBottom();
            };
            img.src = imageUrl;
            
            this.messages.push({
              content: '',
              sender: 'bot',
              type: 'image',
              imageUrl: imageUrl,
              timestamp: new Date()
            });
            this.scrollToBottom();
            
            this.messages.push({
              content: this.getImageSuccessMessage(),
              sender: 'bot',
              type: 'text',
              timestamp: new Date(),
              language: this.currentLanguage
            });
            this.scrollToBottom();
          } else {
            this.messages.push({
              content: this.getText('errorMessage'),
              sender: 'bot',
              type: 'text',
              timestamp: new Date(),
              language: this.currentLanguage
            });
            this.scrollToBottom();
          }
        } else {
          // Normal chat response
          const response = await this.openAiService.generateChatResponse(message, this.currentLanguage);
          
          this.messages.push({
            content: response,
            sender: 'bot',
            type: 'text',
            timestamp: new Date(),
            language: this.currentLanguage
          });
          this.scrollToBottom();
        }
      } 
      else {
        // Story mode - always treat as a memory to turn into a story with image
        const loadingIndex = this.messages.push({
          content: this.getText('loadingMessage'),
          sender: 'bot',
          type: 'text',
          timestamp: new Date(),
          language: this.currentLanguage
        }) - 1;
        this.scrollToBottom();

        const result = await this.openAiService.generateStoryWithImage(message, this.currentLanguage);
        
        // Remove loading message
        this.messages.splice(loadingIndex, 1);

        if (result.story) {
          this.messages.push({
            content: result.story,
            sender: 'bot',
            type: 'text',
            timestamp: new Date(),
            language: this.currentLanguage
          });
          this.scrollToBottom();
        }
        
        if (result.imageUrl) {
          // Handle image loading
          const img = new Image();
          img.onload = () => {
            this.scrollToBottom();
          };
          img.src = result.imageUrl;
          
          this.messages.push({
            content: '',
            sender: 'bot',
            type: 'image',
            imageUrl: result.imageUrl,
            timestamp: new Date()
          });
          this.scrollToBottom();
        }
      }
    } catch (error) {
      console.error('Message handling error:', error);
      this.messages.push({
        content: this.getText('errorMessage'),
        sender: 'bot',
        type: 'text',
        timestamp: new Date(),
        language: this.currentLanguage
      });
      this.scrollToBottom();
    } finally {
      this.isLoading = false;
    }
  }

  getImageGenerationMessage(): string {
    const messages: Record<string, string> = {
      'en': "I'll create that image for you now...",
      'zh': "我现在为您创建这张图像...",
      'ms': "Saya akan membuat gambar itu untuk anda sekarang...",
      'ta': "நான் இப்போது உங்களுக்காக அந்த படத்தை உருவாக்குகிறேன்..."
    };
    return messages[this.currentLanguage] || messages['en'];
  }

  getImageSuccessMessage(): string {
    const messages: Record<string, string> = {
      'en': "Here's your image! What do you think?",
      'zh': "这是您的图像！您觉得怎么样？",
      'ms': "Ini gambar anda! Apa pendapat anda?",
      'ta': "இதோ உங்கள் படம்! நீங்கள் என்ன நினைக்கிறீர்கள்?"
    };
    return messages[this.currentLanguage] || messages['en'];
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
          ? this.getEnhancedWelcomeMessage()
          : this.getText('storyWelcome'),
        sender: 'bot',
        type: 'text',
        timestamp: new Date(),
        language: this.currentLanguage
      }];
      this.scrollToBottom();
    }

    // Complete the refresh
    event.target.complete();
  }
}