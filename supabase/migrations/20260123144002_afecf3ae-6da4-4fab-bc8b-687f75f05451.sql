-- Add DELETE policy to profiles table for GDPR compliance and user data control
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);