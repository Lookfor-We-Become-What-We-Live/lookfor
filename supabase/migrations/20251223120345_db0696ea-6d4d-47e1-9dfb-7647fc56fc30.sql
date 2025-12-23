-- Add left_at column to track when users leave experiences (for 15-minute cooldown)
ALTER TABLE public.enrollments ADD COLUMN left_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Drop existing enrollment SELECT policies and create more restrictive ones
DROP POLICY IF EXISTS "Hosts can view enrollments for their experiences" ON public.enrollments;
DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.enrollments;

-- Users can only view their own enrollments
CREATE POLICY "Users can view their own enrollments" 
ON public.enrollments 
FOR SELECT 
USING (auth.uid() = user_id);

-- Hosts can view enrollments for experiences they host
CREATE POLICY "Hosts can view enrollments for their experiences" 
ON public.enrollments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM experiences 
    WHERE experiences.id = enrollments.experience_id 
    AND experiences.host_user_id = auth.uid()
  )
);

-- Participants can view other enrollments for experiences they are joined to
CREATE POLICY "Participants can view co-participant enrollments" 
ON public.enrollments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM enrollments AS my_enrollment
    WHERE my_enrollment.experience_id = enrollments.experience_id
    AND my_enrollment.user_id = auth.uid()
    AND my_enrollment.status = 'joined'
  )
);