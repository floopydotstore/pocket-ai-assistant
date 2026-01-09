import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, Copy, FileText, CheckCircle, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAgentStore } from '@/store/agentStore';
import { TEMPLATES, type Message } from '@/types/agent';
import { streamAgent } from '@/services/aiService';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AgentChat() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const agent = useAgentStore((s) => s.agents.find((a) => a.id === agentId));
  const conversation = useAgentStore((s) => s.getConversation(agentId || ''));
  const addMessage = useAgentStore((s) => s.addMessage);
  const clearConversation = useAgentStore((s) => s.clearConversation);
  const updateAgent = useAgentStore((s) => s.updateAgent);
  const addHistoryEntry = useAgentStore((s) => s.addHistoryEntry);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messages = conversation?.messages || [];
  const template = TEMPLATES.find((t) => t.id === agent?.template);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !agent) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    addMessage(agent.id, userMessage);
    setInput('');
    setIsLoading(true);
    setStreamingContent('');

    let fullResponse = '';

    await streamAgent(
      {
        prompt: agent.prompt,
        userInput: userMessage.content,
        template: agent.template,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
      },
      (chunk) => {
        fullResponse += chunk;
        setStreamingContent(fullResponse);
      },
      () => {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: fullResponse,
          timestamp: new Date().toISOString(),
        };
        addMessage(agent.id, assistantMessage);
        setStreamingContent('');
        setIsLoading(false);

        // Update agent stats
        updateAgent(agent.id, {
          lastRunAt: new Date().toISOString(),
          runCount: agent.runCount + 1,
        });

        // Add to history
        addHistoryEntry({
          id: crypto.randomUUID(),
          agentId: agent.id,
          agentName: agent.name,
          input: userMessage.content,
          output: fullResponse,
          timestamp: new Date().toISOString(),
        });
      },
      (error) => {
        toast({
          title: 'Error',
          description: error,
          variant: 'destructive',
        });
        setIsLoading(false);
        setStreamingContent('');
      }
    );
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ description: 'Copied to clipboard' });
  };

  const handleClear = () => {
    if (agentId) {
      clearConversation(agentId);
      toast({ description: 'Conversation cleared' });
    }
  };

  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Agent not found</p>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-lg sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-lg">
            {template?.icon || '🤖'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground truncate">{agent.name}</h1>
            <p className="text-xs text-muted-foreground">{template?.name}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleClear}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear conversation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
        {messages.length === 0 && !streamingContent ? (
          <EmptyChat template={template} onSuggestionClick={setInput} />
        ) : (
          <div className="space-y-4 max-w-2xl mx-auto">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onCopy={() => handleCopy(message.content)}
              />
            ))}
            {isLoading && !streamingContent && (
              <ThinkingIndicator />
            )}
            {streamingContent && (
              <ChatMessage
                message={{
                  id: 'streaming',
                  role: 'assistant',
                  content: streamingContent,
                  timestamp: new Date().toISOString(),
                }}
                isStreaming
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-4 safe-area-bottom">
        <div className="max-w-2xl mx-auto flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message..."
              rows={1}
              className="w-full px-4 py-3 pr-12 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[48px] max-h-[150px]"
              style={{ height: 'auto' }}
            />
          </div>
          <Button
            variant="default"
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="h-12 w-12 rounded-xl"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({
  message,
  isStreaming,
  onCopy,
}: {
  message: Message;
  isStreaming?: boolean;
  onCopy?: () => void;
}) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 animate-fade-in',
        isUser ? 'flex-row-reverse' : ''
      )}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3',
          isUser
            ? 'gradient-primary text-primary-foreground rounded-br-md'
            : 'bg-muted rounded-bl-md'
        )}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-current opacity-50 animate-pulse ml-1" />
        )}
      </div>
      {!isUser && onCopy && !isStreaming && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity self-end"
          onClick={onCopy}
        >
          <Copy className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

function EmptyChat({
  template,
  onSuggestionClick,
}: {
  template?: typeof TEMPLATES[0];
  onSuggestionClick: (text: string) => void;
}) {
  const suggestions = [
    'Summarize this for me...',
    'Help me write a quick email about...',
    'What are 3 key points about...',
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-3xl mb-4">
        {template?.icon || '🤖'}
      </div>
      <h2 className="text-lg font-semibold mb-2">{template?.name || 'AI Agent'}</h2>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs">
        {template?.description || 'Start a conversation with your AI agent'}
      </p>
      <div className="space-y-2 w-full max-w-sm">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            className="w-full justify-start text-left h-auto py-3 px-4"
            onClick={() => onSuggestionClick(suggestion)}
          >
            <FileText className="w-4 h-4 mr-3 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{suggestion}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
