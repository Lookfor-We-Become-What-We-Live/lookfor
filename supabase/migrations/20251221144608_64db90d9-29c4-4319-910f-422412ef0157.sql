-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a new policy: users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy: users can view profiles of hosts for experiences they're enrolled in
CREATE POLICY "Users can view host profiles of enrolled experiences" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments e
    JOIN public.experiences exp ON e.experience_id = exp.id
    WHERE e.user_id = auth.uid()
    AND exp.host_user_id = profiles.user_id
  )
);

-- Create policy: users can view profiles of others enrolled in the same experience
CREATE POLICY "Users can view profiles of co-participants" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.enrollments my_enrollment
    JOIN public.enrollments other_enrollment ON my_enrollment.experience_id = other_enrollment.experience_id
    WHERE my_enrollment.user_id = auth.uid()
    AND other_enrollment.user_id = profiles.user_id
  )
);

-- Create policy: hosts can view profiles of users enrolled in their experiences
CREATE POLICY "Hosts can view profiles of enrolled users" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.experiences exp
    JOIN public.enrollments e ON exp.id = e.experience_id
    WHERE exp.host_user_id = auth.uid()
    AND e.user_id = profiles.user_id
  )
);