import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_TEMPLATES = ['summarizer', 'email-draft', 'quick-research', 'meeting-notes', 'task-planner'];
const MAX_MESSAGE_LENGTH = 5000;
const MAX_AGENT_NAME_LENGTH = 100;
const MAX_MESSAGES = 50;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Authentication ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- Parse & Validate Input ---
    const body = await req.json();
    const { messages, template, agentName, temperature = 0.7, maxTokens = 500 } = body;

    // Validate messages array
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (messages.length > MAX_MESSAGES) {
      return new Response(
        JSON.stringify({ error: `Too many messages (max ${MAX_MESSAGES})` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    for (const msg of messages) {
      if (!msg.role || !msg.content || typeof msg.content !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Invalid message format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (msg.content.length > MAX_MESSAGE_LENGTH) {
        return new Response(
          JSON.stringify({ error: `Message too long (max ${MAX_MESSAGE_LENGTH} chars)` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate agentName
    if (agentName && (typeof agentName !== 'string' || agentName.length > MAX_AGENT_NAME_LENGTH)) {
      return new Response(
        JSON.stringify({ error: 'Invalid agent name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate template
    if (template && !ALLOWED_TEMPLATES.includes(template)) {
      // Allow custom templates but sanitize - just use default prompt
    }

    // Validate numeric params
    const safeTemp = Math.max(0, Math.min(2, Number(temperature) || 0.7));
    const safeMaxTokens = Math.max(50, Math.min(2000, Number(maxTokens) || 500));

    console.log('Agent chat request:', { template, agentName: agentName?.substring(0, 20), messageCount: messages.length, userId: claimsData.claims.sub });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    // System prompts for each template type
    const sanitizedName = agentName ? agentName.replace(/[<>{}[\]]/g, '') : '';
    const systemPrompts: Record<string, string> = {
      'summarizer': `You are ${sanitizedName || 'Summarizer'}, an expert at summarizing content into clear, concise bullet points. Always provide 3-5 key points that capture the essence of the input. Format your response with bullet points and keep it brief but comprehensive.`,
      'email-draft': `You are ${sanitizedName || 'Email Assistant'}, a professional email writer. Create polite, professional emails based on user requests. Include a subject line, proper greeting, clear body, and professional sign-off. Keep emails concise but complete.`,
      'quick-research': `You are ${sanitizedName || 'Research Assistant'}, a quick research helper. Provide 5 relevant facts or insights about the topic. Be informative but concise. Format with numbered points.`,
      'meeting-notes': `You are ${sanitizedName || 'Meeting Notes Assistant'}, an expert at organizing meeting information. Structure notes with: Key Decisions, Action Items (with owners if possible), and Next Steps. Use markdown formatting for clarity.`,
      'task-planner': `You are ${sanitizedName || 'Task Planner'}, a productivity expert. Break down requests into actionable tasks with priorities (High/Medium/Low), estimated times, and due date suggestions. Use markdown formatting with emojis for priority levels.`,
    };

    const systemPrompt = systemPrompts[template] || `You are ${sanitizedName || 'AI Assistant'}, a helpful AI assistant. Be concise, clear, and helpful. Format responses with markdown when appropriate.`;

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
        temperature: safeTemp,
        max_tokens: safeMaxTokens,
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
      JSON.stringify({ error: "An error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
