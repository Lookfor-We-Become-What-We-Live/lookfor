-- Allow reported users to view reports filed against them
CREATE POLICY "Reported users can view reports against them"
ON public.user_reports
FOR SELECT
USING (auth.uid() = reported_user_id);