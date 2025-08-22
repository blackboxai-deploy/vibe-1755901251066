'use client';

import { useState } from 'react';
import { useConversations } from '@/hooks/useConversations';
import { Conversation } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  onSelectConversation: (id: string | null) => void;
  className?: string;
}

export function ConversationList({ onSelectConversation, className = '' }: ConversationListProps) {
  const {
    conversations,
    activeConversationId,
    isLoading,
    error,
    deleteConversation,
    startNewChat,
    duplicateConversation,
    clearAllConversations,
  } = useConversations();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);

  const handleNewChat = () => {
    startNewChat();
    onSelectConversation(null);
  };

  const handleSelectConversation = (id: string) => {
    onSelectConversation(id);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (conversationToDelete) {
      deleteConversation(conversationToDelete);
      if (activeConversationId === conversationToDelete) {
        onSelectConversation(null);
      }
    }
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicate = duplicateConversation(id);
    if (duplicate) {
      onSelectConversation(duplicate.id);
    }
  };

  const formatLastActivity = (conversation: Conversation) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const timestamp = lastMessage ? lastMessage.timestamp : conversation.updatedAt;
    return formatDistanceToNow(timestamp, { addSuffix: true });
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center p-8">
          <div className="text-sm text-gray-500">Loading conversations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with New Chat Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
        <Button
          onClick={handleNewChat}
          size="sm"
          className="h-8 px-3 text-xs"
        >
          New Chat
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="p-3 border-red-200 bg-red-50">
          <div className="text-sm text-red-800">{error}</div>
        </Card>
      )}

      {/* Conversations List */}
      <ScrollArea className="h-[calc(100vh-240px)]">
        <div className="space-y-2">
          {conversations.length === 0 ? (
            <Card className="p-6 text-center">
              <div className="space-y-2">
                <div className="text-sm text-gray-500">No conversations yet</div>
                <Button
                  onClick={handleNewChat}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Start your first chat
                </Button>
              </div>
            </Card>
          ) : (
            conversations.map((conversation) => (
              <Card
                key={conversation.id}
                className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                  activeConversationId === conversation.id
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-gray-200'
                }`}
                onClick={() => handleSelectConversation(conversation.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-gray-900 truncate">
                      {conversation.title}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {conversation.messages.length} message{conversation.messages.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatLastActivity(conversation)}
                      </span>
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-xs">⋯</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={(e) => handleDuplicate(conversation.id, e)}
                      >
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => handleDeleteClick(conversation.id, e)}
                        className="text-red-600 focus:text-red-600"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Clear All Button */}
      {conversations.length > 0 && (
        <div className="pt-2 border-t">
          <Button
            onClick={() => setClearAllDialogOpen(true)}
            variant="outline"
            size="sm"
            className="w-full text-xs text-gray-500 hover:text-red-600 hover:border-red-200"
          >
            Clear All Conversations
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Confirmation Dialog */}
      <AlertDialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Conversations</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all conversations? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                clearAllConversations();
                onSelectConversation(null);
                setClearAllDialogOpen(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}