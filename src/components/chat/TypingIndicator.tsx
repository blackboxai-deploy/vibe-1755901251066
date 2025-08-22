'use client';

import { Card } from '@/components/ui/card';

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-end gap-2 max-w-[80%]">
        {/* Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 text-white flex items-center justify-center text-sm font-medium">
          AI
        </div>

        {/* Typing Animation Card */}
        <Card className="bg-white border-gray-200 px-4 py-3 shadow-sm">
          <div className="flex items-center space-x-1">
            <div className="flex space-x-1">
              <div 
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '0ms', animationDuration: '1000ms' }}
              />
              <div 
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '333ms', animationDuration: '1000ms' }}
              />
              <div 
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '666ms', animationDuration: '1000ms' }}
              />
            </div>
            <span className="text-sm text-gray-500 ml-2">
              AI is thinking...
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}