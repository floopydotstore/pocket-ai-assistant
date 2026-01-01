/**
 * AI Service - Connects to Lovable AI Gateway via edge function
 */

import { supabase } from '@/integrations/supabase/client';
import type { AgentTemplate } from '@/types/agent';

interface AIRequest {
  prompt: string;
  userInput: string;
  template: AgentTemplate;
  agentName?: string;
  temperature?: number;
  maxTokens?: number;
}

interface AIResponse {
  content: string;
  error?: string;
}

type Message = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-chat`;

export async function runAgent(request: AIRequest): Promise<AIResponse> {
  const { userInput, template, agentName, prompt, temperature = 0.7, maxTokens = 500 } = request;

  try {
    const messages: Message[] = [
      { role: 'user', content: `${prompt}\n\nUser input: ${userInput}` }
    ];

    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ 
        messages, 
        template, 
        agentName,
        temperature,
        maxTokens 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        content: '', 
        error: errorData.error || 'Failed to get AI response' 
      };
    }

    // Parse streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      return { content: '', error: 'No response stream' };
    }

    const decoder = new TextDecoder();
    let fullContent = '';
    let textBuffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) fullContent += content;
        } catch {
          // Incomplete JSON, continue
        }
      }
    }

    return { content: fullContent };
  } catch (error) {
    console.error('AI Service Error:', error);
    return {
      content: '',
      error: 'Failed to process your request. Please try again.',
    };
  }
}

export async function streamAgent(
  request: AIRequest,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: string) => void
): Promise<void> {
  const { userInput, template, agentName, prompt, temperature = 0.7, maxTokens = 500 } = request;

  try {
    const messages: Message[] = [
      { role: 'user', content: `${prompt}\n\nUser input: ${userInput}` }
    ];

    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ 
        messages, 
        template, 
        agentName,
        temperature,
        maxTokens 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      onError(errorData.error || 'Failed to get AI response');
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError('No response stream');
      return;
    }

    const decoder = new TextDecoder();
    let textBuffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') {
          onComplete();
          return;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onChunk(content);
        } catch {
          // Incomplete JSON, continue
        }
      }
    }

    onComplete();
  } catch (error) {
    console.error('Stream Error:', error);
    onError('Failed to stream response.');
  }
}
