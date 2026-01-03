-- Add is_public column to agents table
ALTER TABLE public.agents ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Create index for faster public agent queries
CREATE INDEX idx_agents_is_public ON public.agents(is_public) WHERE is_public = true;

-- Add policy for viewing public agents (anyone authenticated can view public agents)
CREATE POLICY "Anyone can view public agents"
ON public.agents
FOR SELECT
TO authenticated
USING (is_public = true);