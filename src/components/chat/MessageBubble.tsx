'use client';

import { useState } from 'react';
import { Message } from '@/types/chat';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  onDelete?: () => void;
  onRegenerate?: () => void;
}

export function MessageBubble({ message, onDelete, onRegenerate }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const formatTime = (timestamp: Date) => {
    return formatDistanceToNow(timestamp, { addSuffix: true });
  };

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`flex items-end gap-2 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-600 text-white'
        }`}>
          {isUser ? 'U' : 'AI'}
        </div>

        {/* Message Card */}
        <Card
          className={`relative px-4 py-3 shadow-sm ${
            isUser
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white border-gray-200'
          }`}
        >
          {/* Message Content */}
          <div className="space-y-2">
            <div className={`text-sm leading-relaxed whitespace-pre-wrap ${
              isUser ? 'text-white' : 'text-gray-900'
            }`}>
              {message.content}
            </div>

            {/* Timestamp */}
            <div className={`text-xs ${
              isUser ? 'text-blue-100' : 'text-gray-500'
            }`}>
              {formatTime(message.timestamp)}
            </div>
          </div>

          {/* Actions Menu */}
          {showActions && (
            <div className={`absolute ${isUser ? 'left-2' : 'right-2'} top-2`}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 w-6 p-0 hover:bg-opacity-20 ${
                      isUser 
                        ? 'text-blue-100 hover:bg-white' 
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xs">⋯</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align={isUser ? 'start' : 'end'}
                  className="w-48"
                >
                  <DropdownMenuItem onClick={handleCopy}>
                    {copied ? 'Copied!' : 'Copy message'}
                  </DropdownMenuItem>
                  
                  {onRegenerate && (
                    <DropdownMenuItem onClick={onRegenerate}>
                      Regenerate response
                    </DropdownMenuItem>
                  )}
                  
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={onDelete}
                      className="text-red-600 focus:text-red-600"
                    >
                      Delete message
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}