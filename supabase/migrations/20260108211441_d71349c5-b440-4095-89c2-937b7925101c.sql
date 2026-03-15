-- Allow anyone to insert lajv messages temporarily (for testing)
DROP POLICY IF EXISTS "Authenticated users can insert lajv messages" ON public.lajv_messages;

CREATE POLICY "Anyone can insert lajv messages" 
ON public.lajv_messages 
FOR INSERT 
WITH CHECK (true);

-- Also allow anyone to delete for cleanup
DROP POLICY IF EXISTS "Users can delete their own lajv messages" ON public.lajv_messages;

CREATE POLICY "Anyone can delete lajv messages" 
ON public.lajv_messages 
FOR DELETE 
USING (true);