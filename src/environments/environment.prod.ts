export const environment = {
  production: true,
  openaiApiKey: 'your-production-api-key-here', // Replace with your actual OpenAI API key
  apiUrl: 'https://api.openai.com/v1',
  defaultModel: 'gpt-4o-mini',
  imageModel: 'dall-e-3',
  maxTokens: {
    chat: 150,
    story: 200
  },
  temperature: {
    chat: 0.5,
    story: 0.7
  },
  imageSettings: {
    size: '1024x1024',
    quality: 'standard',
    style: 'natural'
  },
  // Add any other configuration settings you need
  debugMode: false,
  logErrors: true
};