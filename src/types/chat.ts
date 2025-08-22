export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSettings {
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface ChatResponse {
  message: string;
  error?: string;
}

export interface ApiError {
  message: string;
  code?: number;
  details?: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  currentConversationId: string | null;
}

export interface ConversationState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;
}

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  systemPrompt: "You are a helpful AI assistant. Provide clear, accurate, and helpful responses to user questions. Be conversational but professional.",
  model: "openrouter/anthropic/claude-sonnet-4",
  temperature: 0.7,
  maxTokens: 2000,
};

export const SUPPORTED_MODELS = [
  {
    id: "openrouter/anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    description: "Advanced reasoning and coding tasks",
  },
  {
    id: "openrouter/openai/gpt-4o",
    name: "GPT-4o",
    description: "OpenAI's latest multimodal model",
  },
  {
    id: "openrouter/anthropic/claude-3-haiku",
    name: "Claude 3 Haiku",
    description: "Fast and efficient responses",
  },
] as const;