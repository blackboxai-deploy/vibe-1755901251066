import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/ai';
import { Message, ChatSettings } from '@/types/chat';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    if (body.messages.length === 0) {
      return NextResponse.json(
        { error: 'At least one message is required' },
        { status: 400 }
      );
    }

    // Extract and validate messages
    const messages: Message[] = body.messages.map((msg: any, index: number) => {
      if (!msg.content || typeof msg.content !== 'string') {
        throw new Error(`Message at index ${index} must have content`);
      }
      
      if (!msg.role || !['user', 'assistant'].includes(msg.role)) {
        throw new Error(`Message at index ${index} must have a valid role`);
      }

      return {
        id: msg.id || `msg-${Date.now()}-${index}`,
        role: msg.role,
        content: msg.content.trim(),
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      };
    });

    // Extract settings with defaults
    const settings: ChatSettings = {
      systemPrompt: body.settings?.systemPrompt || 
        "You are a helpful AI assistant. Provide clear, accurate, and helpful responses to user questions. Be conversational but professional.",
      model: body.settings?.model || "openrouter/anthropic/claude-sonnet-4",
      temperature: typeof body.settings?.temperature === 'number' 
        ? Math.max(0, Math.min(2, body.settings.temperature))
        : 0.7,
      maxTokens: typeof body.settings?.maxTokens === 'number'
        ? Math.max(1, Math.min(4000, body.settings.maxTokens))
        : 2000,
    };

    // Filter to only user and assistant messages for the API
    const apiMessages = messages.filter(msg => 
      msg.role === 'user' || msg.role === 'assistant'
    );

    if (apiMessages.length === 0) {
      return NextResponse.json(
        { error: 'No valid user or assistant messages found' },
        { status: 400 }
      );
    }

    // Call AI service
    const response = await AIService.sendMessage(apiMessages, settings);

    if (!response || response.trim().length === 0) {
      return NextResponse.json(
        { error: 'AI service returned empty response' },
        { status: 500 }
      );
    }

    // Return successful response
    return NextResponse.json({
      message: response.trim(),
      model: settings.model,
      usage: {
        prompt_tokens: apiMessages.reduce((sum, msg) => sum + msg.content.length, 0),
        completion_tokens: response.length,
      },
    });

  } catch (error) {
    console.error('Chat API Error:', error);

    // Handle different types of errors
    if (error instanceof Error) {
      // Validation errors
      if (error.message.includes('Message at index') || 
          error.message.includes('required') ||
          error.message.includes('valid')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      // AI service errors
      if (error.message.includes('API request failed') ||
          error.message.includes('AI service')) {
        return NextResponse.json(
          { error: error.message },
          { status: 502 }
        );
      }

      // Network/timeout errors
      if (error.message.includes('fetch') || 
          error.message.includes('timeout') ||
          error.message.includes('network')) {
        return NextResponse.json(
          { error: 'Network error. Please try again.' },
          { status: 503 }
        );
      }

      // Generic error with message
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Fallback for unknown errors
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Health check endpoint
export async function GET() {
  try {
    const isHealthy = await AIService.testConnection();
    
    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      ai_service: isHealthy ? 'connected' : 'disconnected',
    }, {
      status: isHealthy ? 200 : 503
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, {
      status: 503
    });
  }
}