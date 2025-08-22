'use client';

import { useState, useEffect } from 'react';
import { ChatSettings, SUPPORTED_MODELS, DEFAULT_CHAT_SETTINGS } from '@/types/chat';
import { StorageService } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

interface SettingsPanelProps {
  onSettingsChange?: (settings: ChatSettings) => void;
  className?: string;
}

export function SettingsPanel({ onSettingsChange, className = '' }: SettingsPanelProps) {
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_CHAT_SETTINGS);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const savedSettings = StorageService.getSettings();
    setSettings(savedSettings);
  }, []);

  const handleSettingChange = (key: keyof ChatSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    StorageService.saveSettings(settings);
    setHasUnsavedChanges(false);
    
    if (onSettingsChange) {
      onSettingsChange(settings);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_CHAT_SETTINGS);
    setHasUnsavedChanges(true);
  };

  const handleExport = () => {
    const dataStr = StorageService.exportData();
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `ai-chat-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const success = StorageService.importData(content);
        
        if (success) {
          // Reload settings after import
          const importedSettings = StorageService.getSettings();
          setSettings(importedSettings);
          setHasUnsavedChanges(false);
          
          if (onSettingsChange) {
            onSettingsChange(importedSettings);
          }
          
          alert('Data imported successfully!');
        } else {
          alert('Failed to import data. Please check the file format.');
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import data. Invalid file format.');
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
        {hasUnsavedChanges && (
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              size="sm"
              className="h-8 px-3 text-xs"
            >
              Save
            </Button>
          </div>
        )}
      </div>

      {/* AI Model Selection */}
      <Card className="p-4 space-y-4">
        <div>
          <Label htmlFor="model-select" className="text-sm font-medium">
            AI Model
          </Label>
          <Select
            value={settings.model}
            onValueChange={(value) => handleSettingChange('model', value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select AI model" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div>
                    <div className="font-medium">{model.name}</div>
                    <div className="text-xs text-gray-500">{model.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* System Prompt */}
      <Card className="p-4 space-y-4">
        <div>
          <Label htmlFor="system-prompt" className="text-sm font-medium">
            System Prompt
          </Label>
          <p className="text-xs text-gray-500 mt-1">
            Define how the AI should behave and respond to your messages.
          </p>
          <Textarea
            id="system-prompt"
            value={settings.systemPrompt}
            onChange={(e) => handleSettingChange('systemPrompt', e.target.value)}
            placeholder="Enter system prompt..."
            className="mt-2 min-h-[100px]"
          />
        </div>
      </Card>

      {/* Advanced Settings */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Advanced Settings</Label>
          <Switch
            checked={isAdvancedOpen}
            onCheckedChange={setIsAdvancedOpen}
          />
        </div>

        {isAdvancedOpen && (
          <div className="space-y-4 pt-2">
            <Separator />
            
            {/* Temperature */}
            <div>
              <Label className="text-sm font-medium">
                Temperature: {settings.temperature}
              </Label>
              <p className="text-xs text-gray-500 mt-1 mb-2">
                Controls randomness. Higher values make output more creative.
              </p>
              <Slider
                value={[settings.temperature]}
                onValueChange={(value) => handleSettingChange('temperature', value[0])}
                max={2}
                min={0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Focused (0)</span>
                <span>Balanced (1)</span>
                <span>Creative (2)</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div>
              <Label className="text-sm font-medium">
                Max Tokens: {settings.maxTokens}
              </Label>
              <p className="text-xs text-gray-500 mt-1 mb-2">
                Maximum length of AI responses.
              </p>
              <Slider
                value={[settings.maxTokens]}
                onValueChange={(value) => handleSettingChange('maxTokens', value[0])}
                max={4000}
                min={100}
                step={100}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Short (100)</span>
                <span>Medium (2000)</span>
                <span>Long (4000)</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Actions */}
      <Card className="p-4 space-y-3">
        <div className="space-y-2">
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="w-full text-xs"
          >
            Reset to Defaults
          </Button>
          
          <div className="flex gap-2">
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
            >
              Export Data
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs relative overflow-hidden"
            >
              Import Data
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </Button>
          </div>
        </div>
      </Card>

      {/* Save Notice */}
      {hasUnsavedChanges && (
        <Card className="p-3 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-yellow-800">
              You have unsaved changes
            </div>
            <Button
              onClick={handleSave}
              size="sm"
              className="h-6 px-3 text-xs"
            >
              Save Now
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}