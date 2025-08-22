'use client';

import { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ConversationList } from '@/components/sidebar/ConversationList';
import { SettingsPanel } from '@/components/sidebar/SettingsPanel';
import { useConversations } from '@/hooks/useConversations';
import { ChatSettings } from '@/types/chat';
import { StorageService } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent } from '@/components/ui/sheet';

export default function ChatApp() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [settings, setSettings] = useState<ChatSettings | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { 
    createConversation, 
    activeConversationId: storedActiveId,
    setActiveConversation 
  } = useConversations();

  // Load initial settings and active conversation
  useEffect(() => {
    const savedSettings = StorageService.getSettings();
    setSettings(savedSettings);

    const savedActiveId = StorageService.getActiveConversationId();
    if (savedActiveId) {
      setActiveConversationId(savedActiveId);
    }
  }, []);

  // Sync with stored active conversation
  useEffect(() => {
    if (storedActiveId !== activeConversationId) {
      setActiveConversationId(storedActiveId);
    }
  }, [storedActiveId]);

  const handleSelectConversation = (id: string | null) => {
    setActiveConversationId(id);
    setActiveConversation(id);
    setSidebarOpen(false); // Close mobile sidebar
  };

  const handleSettingsChange = (newSettings: ChatSettings) => {
    setSettings(newSettings);
  };

  const handleNewConversation = (firstMessage?: string) => {
    const message = firstMessage ? {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: firstMessage,
      timestamp: new Date(),
    } : undefined;

    const newConversation = createConversation(message);
    setActiveConversationId(newConversation.id);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-80 lg:bg-white lg:border-r lg:border-gray-200">
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="conversations" className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="conversations" className="text-xs">
                  Conversations
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-xs">
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <TabsContent value="conversations" className="h-full m-0 p-4">
                <ConversationList onSelectConversation={handleSelectConversation} />
              </TabsContent>
              
              <TabsContent value="settings" className="h-full m-0 p-4">
                <SettingsPanel onSettingsChange={handleSettingsChange} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <Tabs defaultValue="conversations" className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="conversations" className="text-xs">
                  Conversations
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-xs">
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <TabsContent value="conversations" className="h-full m-0 p-4">
                <ConversationList onSelectConversation={handleSelectConversation} />
              </TabsContent>
              
              <TabsContent value="settings" className="h-full m-0 p-4">
                <SettingsPanel onSettingsChange={handleSettingsChange} />
              </TabsContent>
            </div>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                Menu
              </Button>
              
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Chat</h1>
                <p className="text-xs text-gray-500">
                  {activeConversationId ? 'Conversation active' : 'Start a new conversation'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* New Chat Button */}
              <Button
                onClick={() => handleNewConversation()}
                size="sm"
                className="hidden sm:inline-flex"
              >
                New Chat
              </Button>
              
              {/* Mobile New Chat */}
              <Button
                onClick={() => handleNewConversation()}
                size="sm"
                className="sm:hidden"
              >
                New
              </Button>
            </div>
          </div>
        </header>

        {/* Chat Interface */}
        <main className="flex-1 relative">
          <ChatInterface
            conversationId={activeConversationId}
            settings={settings}
            className="h-full"
          />
        </main>
      </div>
    </div>
  );
}