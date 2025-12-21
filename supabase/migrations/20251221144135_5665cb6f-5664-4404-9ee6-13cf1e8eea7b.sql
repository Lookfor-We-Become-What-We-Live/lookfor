-- Allow experience hosts to view enrollments for their own experiences
CREATE POLICY "Hosts can view enrollments for their experiences" 
ON public.enrollments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.experiences 
    WHERE experiences.id = enrollments.experience_id 
    AND experiences.host_user_id = auth.uid()
  )
);