/**
 * AI Service - Abstracted AI integration layer
 * 
 * This service provides a mock implementation by default.
 * To connect a real AI API (OpenAI, Azure, Anthropic, etc.):
 * 
 * 1. Replace the mockResponse function with actual API calls
 * 2. Add your API key to environment variables
 * 3. Handle rate limiting and errors appropriately
 * 
 * Example for OpenAI:
 * const response = await fetch('https://api.openai.com/v1/chat/completions', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
 *   },
 *   body: JSON.stringify({
 *     model: 'gpt-4',
 *     messages: [{ role: 'user', content: prompt }],
 *     temperature,
 *     max_tokens: maxTokens,
 *   }),
 * });
 */

import type { AgentTemplate } from '@/types/agent';

interface AIRequest {
  prompt: string;
  userInput: string;
  template: AgentTemplate;
  temperature?: number;
  maxTokens?: number;
}

interface AIResponse {
  content: string;
  error?: string;
}

// Content filter for safety
const BLOCKED_PATTERNS = [
  /\b(hate|hateful|racist|sexist)\b/i,
  /\b(illegal|crime|violence|harm)\b/i,
  /\b(exploit|abuse|harass)\b/i,
];

function isContentSafe(input: string): boolean {
  return !BLOCKED_PATTERNS.some(pattern => pattern.test(input));
}

// Mock responses based on template type
function getMockResponse(template: AgentTemplate, userInput: string): string {
  const responses: Record<AgentTemplate, (input: string) => string> = {
    'summarizer': (input) => {
      const words = input.split(' ').slice(0, 20).join(' ');
      return `**Summary:**\n\n• Main point: ${words}...\n• Key insight: The content discusses important concepts.\n• Conclusion: Further analysis may be beneficial.`;
    },
    'email-draft': (input) => {
      return `**Subject: Follow-up on ${input.slice(0, 30)}...**\n\nHi,\n\nI hope this email finds you well. I wanted to follow up regarding our recent discussion about ${input.slice(0, 50)}...\n\nPlease let me know if you have any questions or if there's anything else I can help with.\n\nBest regards,\n[Your Name]`;
    },
    'quick-research': (input) => {
      return `**Quick Research: ${input.slice(0, 30)}...**\n\n1. **Fact 1:** This is a relevant finding about the topic.\n2. **Fact 2:** Additional context provides more understanding.\n3. **Fact 3:** Historical perspective adds depth.\n4. **Fact 4:** Current trends show interesting patterns.\n5. **Fact 5:** Future implications are worth considering.\n\n*Note: This is mock data. Connect a real AI API for accurate research.*`;
    },
    'meeting-notes': (input) => {
      return `**Meeting Notes Summary**\n\n**Date:** Today\n**Topic:** ${input.slice(0, 30)}...\n\n**Key Decisions:**\n• Decision point identified from discussion\n• Agreement reached on next steps\n\n**Action Items:**\n- [ ] Follow up on main topic (Owner: TBD)\n- [ ] Schedule next meeting (Owner: TBD)\n- [ ] Share documentation (Owner: TBD)\n\n**Next Steps:**\nReview and confirm action items by end of week.`;
    },
    'task-planner': (input) => {
      return `**Task Plan: ${input.slice(0, 30)}...**\n\n**Priority Tasks:**\n\n1. 🔴 **High Priority:** Break down the main objective\n   - Due: This week\n   - Estimated time: 2 hours\n\n2. 🟡 **Medium Priority:** Research and gather resources\n   - Due: Next week\n   - Estimated time: 3 hours\n\n3. 🟢 **Normal Priority:** Create initial draft\n   - Due: Flexible\n   - Estimated time: 1 hour\n\n4. 🔵 **Low Priority:** Review and refine\n   - Due: Ongoing\n   - Estimated time: 30 min\n\n5. ⚪ **Optional:** Share for feedback\n   - Due: As needed`;
    },
  };

  return responses[template](userInput);
}

// Simulate network delay
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function runAgent(request: AIRequest): Promise<AIResponse> {
  const { userInput, template } = request;

  // Content safety check
  if (!isContentSafe(userInput)) {
    return {
      content: '',
      error: 'Your input contains content that may violate our usage guidelines. Please rephrase your request.',
    };
  }

  try {
    // Simulate API latency (300-800ms)
    await delay(300 + Math.random() * 500);

    // Get mock response
    const content = getMockResponse(template, userInput);

    return { content };
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
  const { userInput, template } = request;

  if (!isContentSafe(userInput)) {
    onError('Your input contains content that may violate our usage guidelines.');
    return;
  }

  try {
    await delay(200);
    
    const fullResponse = getMockResponse(template, userInput);
    const words = fullResponse.split(' ');

    for (let i = 0; i < words.length; i++) {
      await delay(30 + Math.random() * 20);
      onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
    }

    onComplete();
  } catch (error) {
    console.error('Stream Error:', error);
    onError('Failed to stream response.');
  }
}
