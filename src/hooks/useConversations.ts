'use client';

import { useState, useCallback, useEffect } from 'react';
import { Conversation, ConversationState, Message } from '@/types/chat';
import { StorageService } from '@/lib/storage';

export function useConversations() {
  const [state, setState] = useState<ConversationState>({
    conversations: [],
    activeConversationId: null,
    isLoading: false,
    error: null,
  });

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const conversations = StorageService.getConversations();
      const activeId = StorageService.getActiveConversationId();

      setState({
        conversations,
        activeConversationId: activeId,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load conversations',
      }));
    }
  }, []);

  const createConversation = useCallback((firstMessage?: Message): Conversation => {
    try {
      const newConversation = StorageService.createConversation(firstMessage);
      
      setState(prev => ({
        ...prev,
        conversations: [newConversation, ...prev.conversations],
        activeConversationId: newConversation.id,
        error: null,
      }));

      StorageService.setActiveConversationId(newConversation.id);
      return newConversation;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create conversation';
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));

      throw new Error(errorMessage);
    }
  }, []);

  const deleteConversation = useCallback((id: string) => {
    try {
      StorageService.deleteConversation(id);
      
      setState(prev => {
        const updatedConversations = prev.conversations.filter(conv => conv.id !== id);
        const newActiveId = prev.activeConversationId === id ? null : prev.activeConversationId;
        
        if (newActiveId !== prev.activeConversationId) {
          StorageService.setActiveConversationId(newActiveId);
        }

        return {
          ...prev,
          conversations: updatedConversations,
          activeConversationId: newActiveId,
          error: null,
        };
      });
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to delete conversation',
      }));
    }
  }, []);

  const setActiveConversation = useCallback((id: string | null) => {
    try {
      StorageService.setActiveConversationId(id);
      
      setState(prev => ({
        ...prev,
        activeConversationId: id,
        error: null,
      }));
    } catch (error) {
      console.error('Failed to set active conversation:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to set active conversation',
      }));
    }
  }, []);

  const updateConversation = useCallback((id: string, updates: Partial<Conversation>) => {
    try {
      const conversation = StorageService.getConversation(id);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const updatedConversation = { ...conversation, ...updates, updatedAt: new Date() };
      StorageService.saveConversation(updatedConversation);

      setState(prev => ({
        ...prev,
        conversations: prev.conversations.map(conv => 
          conv.id === id ? updatedConversation : conv
        ),
        error: null,
      }));
    } catch (error) {
      console.error('Failed to update conversation:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update conversation',
      }));
    }
  }, []);

  const getConversation = useCallback((id: string): Conversation | null => {
    return state.conversations.find(conv => conv.id === id) || null;
  }, [state.conversations]);

  const clearAllConversations = useCallback(() => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      StorageService.saveConversations([]);
      StorageService.setActiveConversationId(null);
      
      setState({
        conversations: [],
        activeConversationId: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Failed to clear conversations:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to clear conversations',
      }));
    }
  }, []);

  const startNewChat = useCallback(() => {
    try {
      setState(prev => ({
        ...prev,
        activeConversationId: null,
        error: null,
      }));
      
      StorageService.setActiveConversationId(null);
    } catch (error) {
      console.error('Failed to start new chat:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start new chat',
      }));
    }
  }, []);

  const duplicateConversation = useCallback((id: string): Conversation | null => {
    try {
      const original = getConversation(id);
      if (!original) {
        throw new Error('Conversation not found');
      }

      const duplicate = StorageService.createConversation();
      const duplicatedConversation = {
        ...duplicate,
        title: `${original.title} (Copy)`,
        messages: original.messages.map(msg => ({
          ...msg,
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        })),
      };

      StorageService.saveConversation(duplicatedConversation);

      setState(prev => ({
        ...prev,
        conversations: [duplicatedConversation, ...prev.conversations],
        error: null,
      }));

      return duplicatedConversation;
    } catch (error) {
      console.error('Failed to duplicate conversation:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to duplicate conversation',
      }));
      return null;
    }
  }, [getConversation]);

  const exportConversations = useCallback((): string => {
    try {
      return StorageService.exportData();
    } catch (error) {
      console.error('Failed to export conversations:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to export conversations',
      }));
      return '';
    }
  }, []);

  const importConversations = useCallback((jsonData: string): boolean => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const success = StorageService.importData(jsonData);
      if (success) {
        loadConversations(); // Reload after import
        return true;
      } else {
        throw new Error('Import failed');
      }
    } catch (error) {
      console.error('Failed to import conversations:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to import conversations',
      }));
      return false;
    }
  }, [loadConversations]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    conversations: state.conversations,
    activeConversationId: state.activeConversationId,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    loadConversations,
    createConversation,
    deleteConversation,
    setActiveConversation,
    updateConversation,
    getConversation,
    clearAllConversations,
    startNewChat,
    duplicateConversation,
    exportConversations,
    importConversations,
    clearError,
  };
}