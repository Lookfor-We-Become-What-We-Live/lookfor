-- Drop the existing public SELECT policy on experiences
DROP POLICY IF EXISTS "Experiences are viewable by everyone" ON public.experiences;

-- Create new policy requiring authentication
CREATE POLICY "Experiences are viewable by authenticated users"
ON public.experiences
FOR SELECT
USING (auth.uid() IS NOT NULL);