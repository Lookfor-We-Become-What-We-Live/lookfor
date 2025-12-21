-- Drop the existing public SELECT policy
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.experience_comments;

-- Create a new policy requiring authentication
CREATE POLICY "Comments are viewable by authenticated users"
ON public.experience_comments
FOR SELECT
USING (auth.uid() IS NOT NULL);