-- Remove the policy that allows reported users to view reports against them
-- This protects reporter anonymity and prevents potential retaliation
DROP POLICY IF EXISTS "Reported users can view reports against them" ON public.user_reports;