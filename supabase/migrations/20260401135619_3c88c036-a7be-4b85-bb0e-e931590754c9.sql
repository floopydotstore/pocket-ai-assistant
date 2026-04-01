-- Drop the overly permissive "Anyone can view likes" policy
DROP POLICY IF EXISTS "Anyone can view likes" ON public.agent_likes;

-- Users can only view their own likes
CREATE POLICY "Users can view their own likes" ON public.agent_likes
FOR SELECT USING (auth.uid() = user_id);
