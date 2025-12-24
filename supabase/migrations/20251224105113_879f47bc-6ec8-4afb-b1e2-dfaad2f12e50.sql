-- Add RLS policy so authenticated users can see host profiles
CREATE POLICY "Authenticated users can view host profiles of experiences" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM experiences exp
    WHERE exp.host_user_id = profiles.user_id
  )
  AND auth.uid() IS NOT NULL
);