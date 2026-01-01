import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Content filter for safety
const BLOCKED_PATTERNS = [
  /\b(hate|hateful|racist|sexist)\b/i,
  /\b(exploit|abuse|harass)\b/i,
];

function isContentSafe(input: string): boolean {
  return !BLOCKED_PATTERNS.some(pattern => pattern.test(input));
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, template, agentName, temperature = 0.7, maxTokens = 500 } = await req.json();
    
    console.log('Agent chat request:', { template, agentName, messageCount: messages?.length });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Content safety check on last user message
    const lastUserMessage = messages?.find((m: { role: string }) => m.role === 'user')?.content || '';
    if (!isContentSafe(lastUserMessage)) {
      return new Response(
        JSON.stringify({ error: "Your input contains content that may violate our usage guidelines. Please rephrase your request." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // System prompts for each template type
    const systemPrompts: Record<string, string> = {
      'summarizer': `You are ${agentName || 'Summarizer'}, an expert at summarizing content into clear, concise bullet points. Always provide 3-5 key points that capture the essence of the input. Format your response with bullet points and keep it brief but comprehensive.`,
      'email-draft': `You are ${agentName || 'Email Assistant'}, a professional email writer. Create polite, professional emails based on user requests. Include a subject line, proper greeting, clear body, and professional sign-off. Keep emails concise but complete.`,
      'quick-research': `You are ${agentName || 'Research Assistant'}, a quick research helper. Provide 5 relevant facts or insights about the topic. Be informative but concise. Format with numbered points.`,
      'meeting-notes': `You are ${agentName || 'Meeting Notes Assistant'}, an expert at organizing meeting information. Structure notes with: Key Decisions, Action Items (with owners if possible), and Next Steps. Use markdown formatting for clarity.`,
      'task-planner': `You are ${agentName || 'Task Planner'}, a productivity expert. Break down requests into actionable tasks with priorities (High/Medium/Low), estimated times, and due date suggestions. Use markdown formatting with emojis for priority levels.`,
    };

    const systemPrompt = systemPrompts[template] || `You are ${agentName || 'AI Assistant'}, a helpful AI assistant. Be concise, clear, and helpful. Format responses with markdown when appropriate.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI service unavailable. Please try again." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Streaming response from AI gateway");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Agent chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
