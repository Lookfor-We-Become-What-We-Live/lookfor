-- Create a security definer function to check if a user is enrolled in an experience
CREATE OR REPLACE FUNCTION public.is_enrolled_in_experience(_user_id uuid, _experience_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.enrollments
    WHERE user_id = _user_id
      AND experience_id = _experience_id
      AND status = 'joined'
  )
$$;

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Participants can view co-participant enrollments" ON public.enrollments;

-- Recreate policy using the security definer function
CREATE POLICY "Participants can view co-participant enrollments" 
ON public.enrollments 
FOR SELECT 
USING (
  public.is_enrolled_in_experience(auth.uid(), experience_id)
);