import { Conversation, Message, ChatSettings, DEFAULT_CHAT_SETTINGS } from '@/types/chat';

const STORAGE_KEYS = {
  CONVERSATIONS: 'ai-chat-conversations',
  SETTINGS: 'ai-chat-settings',
  ACTIVE_CONVERSATION: 'ai-chat-active-conversation',
} as const;

export class StorageService {
  // Conversation Management
  static getConversations(): Conversation[] {
    try {
      if (typeof window === 'undefined') return [];
      
      const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      if (!stored) return [];

      const conversations = JSON.parse(stored);
      
      // Parse dates back to Date objects
      return conversations.map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
    } catch (error) {
      console.error('Error loading conversations:', error);
      return [];
    }
  }

  static saveConversations(conversations: Conversation[]): void {
    try {
      if (typeof window === 'undefined') return;
      
      localStorage.setItem(
        STORAGE_KEYS.CONVERSATIONS,
        JSON.stringify(conversations)
      );
    } catch (error) {
      console.error('Error saving conversations:', error);
    }
  }

  static getConversation(id: string): Conversation | null {
    const conversations = this.getConversations();
    return conversations.find(conv => conv.id === id) || null;
  }

  static saveConversation(conversation: Conversation): void {
    const conversations = this.getConversations();
    const existingIndex = conversations.findIndex(conv => conv.id === conversation.id);

    if (existingIndex >= 0) {
      conversations[existingIndex] = conversation;
    } else {
      conversations.unshift(conversation); // Add to beginning
    }

    this.saveConversations(conversations);
  }

  static deleteConversation(id: string): void {
    const conversations = this.getConversations();
    const filtered = conversations.filter(conv => conv.id !== id);
    this.saveConversations(filtered);
  }

  static createConversation(firstMessage?: Message): Conversation {
    const id = `conv-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    const now = new Date();

    const conversation: Conversation = {
      id,
      title: firstMessage ? this.generateTitle(firstMessage.content) : 'New Chat',
      messages: firstMessage ? [firstMessage] : [],
      createdAt: now,
      updatedAt: now,
    };

    this.saveConversation(conversation);
    return conversation;
  }

  static updateConversationMessages(id: string, messages: Message[]): void {
    const conversation = this.getConversation(id);
    if (!conversation) return;

    conversation.messages = messages;
    conversation.updatedAt = new Date();
    
    // Update title based on first user message if it's still "New Chat"
    if (conversation.title === 'New Chat' && messages.length > 0) {
      const firstUserMessage = messages.find(msg => msg.role === 'user');
      if (firstUserMessage) {
        conversation.title = this.generateTitle(firstUserMessage.content);
      }
    }

    this.saveConversation(conversation);
  }

  private static generateTitle(content: string): string {
    // Generate a title from the first message, truncated to reasonable length
    const cleaned = content.trim().replace(/\s+/g, ' ');
    return cleaned.length > 50 ? cleaned.substring(0, 50) + '...' : cleaned;
  }

  // Settings Management
  static getSettings(): ChatSettings {
    try {
      if (typeof window === 'undefined') return DEFAULT_CHAT_SETTINGS;
      
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!stored) return DEFAULT_CHAT_SETTINGS;

      return { ...DEFAULT_CHAT_SETTINGS, ...JSON.parse(stored) };
    } catch (error) {
      console.error('Error loading settings:', error);
      return DEFAULT_CHAT_SETTINGS;
    }
  }

  static saveSettings(settings: Partial<ChatSettings>): void {
    try {
      if (typeof window === 'undefined') return;
      
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  // Active Conversation Management
  static getActiveConversationId(): string | null {
    try {
      if (typeof window === 'undefined') return null;
      
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
    } catch (error) {
      console.error('Error loading active conversation:', error);
      return null;
    }
  }

  static setActiveConversationId(id: string | null): void {
    try {
      if (typeof window === 'undefined') return;
      
      if (id) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION, id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
      }
    } catch (error) {
      console.error('Error saving active conversation:', error);
    }
  }

  // Utility Methods
  static clearAllData(): void {
    try {
      if (typeof window === 'undefined') return;
      
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }

  static exportData(): string {
    const conversations = this.getConversations();
    const settings = this.getSettings();
    
    return JSON.stringify({
      conversations,
      settings,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.conversations) {
        this.saveConversations(data.conversations);
      }
      
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}