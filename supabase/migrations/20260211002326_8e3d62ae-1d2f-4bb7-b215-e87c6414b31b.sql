
-- Avatar uploads table for image verification
CREATE TABLE public.avatar_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_approval',
  denial_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_avatar_uploads_user_id ON public.avatar_uploads(user_id);
CREATE INDEX idx_avatar_uploads_status ON public.avatar_uploads(status);

-- Enable RLS
ALTER TABLE public.avatar_uploads ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own uploads"
  ON public.avatar_uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all uploads"
  ON public.avatar_uploads FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Moderators can view all uploads"
  ON public.avatar_uploads FOR SELECT
  USING (has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Users can insert their own uploads"
  ON public.avatar_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update uploads"
  ON public.avatar_uploads FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Moderators can update uploads"
  ON public.avatar_uploads FOR UPDATE
  USING (has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Admins can delete uploads"
  ON public.avatar_uploads FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile photos
CREATE POLICY "Users can upload their own profile photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can view profile photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own profile photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can delete any profile photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'profile-photos' AND has_role(auth.uid(), 'admin'::app_role));

-- Add last_seen column to profiles for "senaste inloggade"
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Case-insensitive unique index on username
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles (LOWER(username));
