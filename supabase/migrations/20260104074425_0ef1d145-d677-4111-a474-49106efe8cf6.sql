-- Add display_name to agents table for creator info
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS creator_name text;

-- Create agent_likes table for favorite/like functionality
CREATE TABLE public.agent_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(agent_id, user_id)
);

-- Enable RLS on agent_likes
ALTER TABLE public.agent_likes ENABLE ROW LEVEL SECURITY;

-- Users can view all likes (to show counts)
CREATE POLICY "Anyone can view likes" ON public.agent_likes
FOR SELECT USING (true);

-- Users can create their own likes
CREATE POLICY "Users can create their own likes" ON public.agent_likes
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete their own likes" ON public.agent_likes
FOR DELETE USING (auth.uid() = user_id);

-- Create user_templates table for custom user templates
CREATE TABLE public.user_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  icon text DEFAULT '🤖',
  sample_prompt text,
  sample_output text,
  category text DEFAULT 'Custom',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on user_templates
ALTER TABLE public.user_templates ENABLE ROW LEVEL SECURITY;

-- Users can view their own templates
CREATE POLICY "Users can view their own templates" ON public.user_templates
FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own templates
CREATE POLICY "Users can create their own templates" ON public.user_templates
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own templates
CREATE POLICY "Users can update their own templates" ON public.user_templates
FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own templates
CREATE POLICY "Users can delete their own templates" ON public.user_templates
FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at on user_templates
CREATE TRIGGER update_user_templates_updated_at
BEFORE UPDATE ON public.user_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();