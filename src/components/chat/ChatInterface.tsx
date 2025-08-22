'use client';

import { useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatSettings } from '@/types/chat';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ChatInterfaceProps {
  conversationId?: string | null;
  settings?: ChatSettings;
  className?: string;
  onError?: (error: string) => void;
}

export function ChatInterface({ 
  conversationId, 
  settings, 
  className = '',
  onError 
}: ChatInterfaceProps) {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    deleteMessage,
    regenerateLastResponse,
    clearError,
  } = useChat({ conversationId, settings, onError });

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
      });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Error is already handled by useChat hook
    }
  };

  const handleRetry = () => {
    clearError();
  };

  const handleClearChat = () => {
    clearMessages();
    clearError();
  };

  const canRegenerate = messages.length > 0 && 
    messages[messages.length - 1]?.role === 'assistant' && 
    !isLoading;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Error Display */}
      {error && (
        <Alert className="m-4 border-red-200 bg-red-50 text-red-900">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <div className="flex gap-2 ml-4">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetry}
                className="h-6 px-2 text-xs"
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Messages Area */}
      <div className="flex-1 relative">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-4 space-y-4">
            {/* Welcome Message */}
            {messages.length === 0 && !isLoading && (
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                <div className="text-center space-y-3">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Welcome to AI Chat
                  </h2>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Start a conversation with your AI assistant. Ask questions, get help with tasks, 
                    or just have a friendly chat!
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendMessage("Hello! How can you help me today?")}
                      className="text-xs"
                    >
                      "Hello! How can you help me today?"
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendMessage("What are your capabilities?")}
                      className="text-xs"
                    >
                      "What are your capabilities?"
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendMessage("Help me write a professional email")}
                      className="text-xs"
                    >
                      "Help me write a professional email"
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Message List */}
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                onDelete={() => deleteMessage(message.id)}
                onRegenerate={
                  message.role === 'assistant' && 
                  index === messages.length - 1 && 
                  !isLoading
                    ? regenerateLastResponse
                    : undefined
                }
              />
            ))}

            {/* Typing Indicator */}
            {isLoading && <TypingIndicator />}

            {/* Clear Chat Button */}
            {messages.length > 0 && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearChat}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear Conversation
                </Button>
              </div>
            )}

            {/* Scroll Anchor */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Chat Input */}
      <div className="border-t bg-white p-4">
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          placeholder={
            isLoading 
              ? "AI is thinking..." 
              : "Type your message here... (Press Enter to send)"
          }
        />
        
        {/* Regenerate Button */}
        {canRegenerate && (
          <div className="flex justify-center mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={regenerateLastResponse}
              disabled={isLoading}
              className="text-xs"
            >
              Regenerate Response
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}