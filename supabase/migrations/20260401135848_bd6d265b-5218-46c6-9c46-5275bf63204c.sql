-- Allow authenticated users to see likes on public agents (for like counts)
CREATE POLICY "Authenticated users can view likes on public agents" ON public.agent_likes
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.agents
    WHERE agents.id = agent_likes.agent_id
    AND agents.is_public = true
  )
);
