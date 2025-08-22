import { Message, ChatSettings, ApiError } from '@/types/chat';

const AI_ENDPOINT = 'https://oi-server.onrender.com/chat/completions';

const AI_HEADERS = {
  'CustomerId': 'cus_S16jfiBUH2cc7P',
  'Content-Type': 'application/json',
  'Authorization': 'Bearer xxx',
};

export class AIService {
  static async sendMessage(
    messages: Message[],
    settings: ChatSettings
  ): Promise<string> {
    try {
      const requestBody = {
        model: settings.model,
        messages: [
          {
            role: 'system',
            content: settings.systemPrompt,
          },
          ...messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        ],
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
      };

      const response = await fetch(AI_ENDPOINT, {
        method: 'POST',
        headers: AI_HEADERS,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || 
          `API request failed with status ${response.status}`
        );
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'AI service returned an error');
      }

      return data.choices?.[0]?.message?.content || 'No response received';
    } catch (error) {
      console.error('AI Service Error:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Failed to get AI response. Please try again.');
    }
  }

  static handleError(error: unknown): ApiError {
    if (error instanceof Error) {
      // Network or fetch errors
      if (error.message.includes('fetch')) {
        return {
          message: 'Network error. Please check your connection and try again.',
          code: 0,
          details: error.message,
        };
      }
      
      // API errors
      if (error.message.includes('401') || error.message.includes('403')) {
        return {
          message: 'Authentication error. Please refresh the page and try again.',
          code: 401,
          details: error.message,
        };
      }
      
      if (error.message.includes('429')) {
        return {
          message: 'Rate limit exceeded. Please wait a moment and try again.',
          code: 429,
          details: error.message,
        };
      }
      
      if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
        return {
          message: 'AI service is temporarily unavailable. Please try again in a few moments.',
          code: 500,
          details: error.message,
        };
      }
      
      return {
        message: error.message,
        details: error.message,
      };
    }
    
    return {
      message: 'An unexpected error occurred. Please try again.',
      details: 'Unknown error type',
    };
  }

  static async testConnection(): Promise<boolean> {
    try {
      const testMessage: Message = {
        id: 'test',
        role: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      await this.sendMessage([testMessage], {
        systemPrompt: 'Respond with just "OK"',
        model: 'openrouter/anthropic/claude-sonnet-4',
        temperature: 0,
        maxTokens: 10,
      });

      return true;
    } catch (error) {
      console.error('AI Connection Test Failed:', error);
      return false;
    }
  }
}