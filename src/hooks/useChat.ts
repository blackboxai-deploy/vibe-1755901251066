'use client';

import { useState, useCallback, useEffect } from 'react';
import { Message, ChatState, ChatSettings } from '@/types/chat';
import { StorageService } from '@/lib/storage';

interface UseChatOptions {
  conversationId?: string | null;
  settings?: ChatSettings;
  onError?: (error: string) => void;
}

export function useChat(options: UseChatOptions = {}) {
  const { conversationId, settings, onError } = options;

  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    currentConversationId: conversationId || null,
  });

  // Load messages when conversation ID changes
  useEffect(() => {
    if (conversationId) {
      const conversation = StorageService.getConversation(conversationId);
      if (conversation) {
        setState(prev => ({
          ...prev,
          messages: conversation.messages,
          currentConversationId: conversationId,
          error: null,
        }));
      }
    } else {
      setState(prev => ({
        ...prev,
        messages: [],
        currentConversationId: null,
        error: null,
      }));
    }
  }, [conversationId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    // Update state with user message
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      // Use current settings or defaults
      const currentSettings = settings || StorageService.getSettings();
      
      // Prepare API request
      const requestBody = {
        messages: [...state.messages, userMessage],
        settings: currentSettings,
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Create assistant message
      const assistantMessage: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      const updatedMessages = [...state.messages, userMessage, assistantMessage];

      // Update state
      setState(prev => ({
        ...prev,
        messages: updatedMessages,
        isLoading: false,
        error: null,
      }));

      // Save to storage if we have a conversation ID
      if (state.currentConversationId) {
        StorageService.updateConversationMessages(state.currentConversationId, updatedMessages);
      }

      return assistantMessage;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      // Call error callback if provided
      if (onError) {
        onError(errorMessage);
      }

      // Remove the user message that failed to send
      setState(prev => ({
        ...prev,
        messages: prev.messages.slice(0, -1),
      }));

      throw error;
    }
  }, [state.messages, state.currentConversationId, settings, onError]);

  const clearMessages = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      error: null,
    }));
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    setState(prev => {
      const updatedMessages = prev.messages.filter(msg => msg.id !== messageId);
      
      // Update storage if we have a conversation ID
      if (prev.currentConversationId) {
        StorageService.updateConversationMessages(prev.currentConversationId, updatedMessages);
      }
      
      return {
        ...prev,
        messages: updatedMessages,
      };
    });
  }, []);

  const regenerateLastResponse = useCallback(async () => {
    if (state.messages.length < 2) return;

    // Find the last assistant message
    const messages = [...state.messages];
    let lastAssistantIndex = -1;
    
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') {
        lastAssistantIndex = i;
        break;
      }
    }

    if (lastAssistantIndex === -1) return;

    // Remove the last assistant message
    const messagesWithoutLastResponse = messages.slice(0, lastAssistantIndex);
    
    setState(prev => ({
      ...prev,
      messages: messagesWithoutLastResponse,
      isLoading: true,
      error: null,
    }));

    try {
      const currentSettings = settings || StorageService.getSettings();
      
      const requestBody = {
        messages: messagesWithoutLastResponse,
        settings: currentSettings,
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const newAssistantMessage: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      const updatedMessages = [...messagesWithoutLastResponse, newAssistantMessage];

      setState(prev => ({
        ...prev,
        messages: updatedMessages,
        isLoading: false,
        error: null,
      }));

      // Update storage
      if (state.currentConversationId) {
        StorageService.updateConversationMessages(state.currentConversationId, updatedMessages);
      }

      return newAssistantMessage;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate response';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        messages: state.messages, // Restore original messages
      }));

      if (onError) {
        onError(errorMessage);
      }

      throw error;
    }
  }, [state.messages, state.currentConversationId, settings, onError]);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    currentConversationId: state.currentConversationId,
    sendMessage,
    clearMessages,
    deleteMessage,
    regenerateLastResponse,
    clearError,
  };
}