-- Create table for storing klotterplanket drawings
CREATE TABLE public.klotter (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  comment TEXT,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.klotter ENABLE ROW LEVEL SECURITY;

-- Create policies for klotter access
CREATE POLICY "Authenticated users can read all klotter" 
ON public.klotter 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create klotter" 
ON public.klotter 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own klotter" 
ON public.klotter 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage bucket for klotter images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('klotter', 'klotter', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for klotter images
CREATE POLICY "Klotter images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'klotter');

CREATE POLICY "Authenticated users can upload klotter images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'klotter' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own klotter images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'klotter' AND auth.uid()::text = (storage.foldername(name))[1]);