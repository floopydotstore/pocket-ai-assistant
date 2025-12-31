export type AgentTemplate = 
  | 'summarizer'
  | 'email-draft'
  | 'quick-research'
  | 'meeting-notes'
  | 'task-planner';

export interface Agent {
  id: string;
  name: string;
  template: AgentTemplate;
  prompt: string;
  temperature: number;
  maxTokens: number;
  createdAt: string;
  lastRunAt?: string;
  runCount: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  agentId: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface HistoryEntry {
  id: string;
  agentId: string;
  agentName: string;
  input: string;
  output: string;
  timestamp: string;
}

export interface Template {
  id: AgentTemplate;
  name: string;
  description: string;
  icon: string;
  samplePrompt: string;
  sampleOutput: string;
  category: string;
}

export const TEMPLATES: Template[] = [
  {
    id: 'summarizer',
    name: 'Summarizer',
    description: 'Condense long text into key points',
    icon: '📝',
    samplePrompt: 'Summarize the following text into 3 concise bullet points.',
    sampleOutput: '• Main point one\n• Key insight two\n• Important conclusion three',
    category: 'Productivity',
  },
  {
    id: 'email-draft',
    name: 'Email Draft',
    description: 'Generate professional email responses',
    icon: '✉️',
    samplePrompt: 'Draft a polite follow-up email in 3 sentences.',
    sampleOutput: 'Subject: Following Up on Our Conversation\n\nHi [Name],\n\nI wanted to follow up on our recent discussion...',
    category: 'Communication',
  },
  {
    id: 'quick-research',
    name: 'Quick Research',
    description: 'Get fast facts and summaries on topics',
    icon: '🔍',
    samplePrompt: 'Give me 5 quick facts with sources about this topic.',
    sampleOutput: '1. Fact one (Source: Wikipedia)\n2. Fact two (Source: Britannica)\n...',
    category: 'Research',
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Structure meeting notes and action items',
    icon: '📋',
    samplePrompt: 'Extract action items and key decisions from these meeting notes.',
    sampleOutput: '**Action Items:**\n- [ ] Task 1 (Owner: John)\n- [ ] Task 2 (Owner: Jane)\n\n**Key Decisions:**\n...',
    category: 'Productivity',
  },
  {
    id: 'task-planner',
    name: 'Task Planner',
    description: 'Break down goals into actionable tasks',
    icon: '✅',
    samplePrompt: 'Break this goal into 5 actionable steps with priorities.',
    sampleOutput: '1. **High Priority:** First step\n2. **Medium Priority:** Second step\n...',
    category: 'Productivity',
  },
];
