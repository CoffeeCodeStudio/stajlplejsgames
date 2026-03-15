
-- Add length constraints to profile text fields using validation trigger
-- (Using trigger instead of CHECK constraints for better compatibility)

CREATE OR REPLACE FUNCTION public.validate_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.bio IS NOT NULL AND length(NEW.bio) > 5000 THEN
    RAISE EXCEPTION 'bio exceeds maximum length of 5000 characters';
  END IF;
  IF NEW.status_message IS NOT NULL AND length(NEW.status_message) > 200 THEN
    RAISE EXCEPTION 'status_message exceeds maximum length of 200 characters';
  END IF;
  IF NEW.interests IS NOT NULL AND length(NEW.interests) > 1000 THEN
    RAISE EXCEPTION 'interests exceeds maximum length of 1000 characters';
  END IF;
  IF NEW.spanar_in IS NOT NULL AND length(NEW.spanar_in) > 500 THEN
    RAISE EXCEPTION 'spanar_in exceeds maximum length of 500 characters';
  END IF;
  IF NEW.city IS NOT NULL AND length(NEW.city) > 100 THEN
    RAISE EXCEPTION 'city exceeds maximum length of 100 characters';
  END IF;
  IF NEW.occupation IS NOT NULL AND length(NEW.occupation) > 100 THEN
    RAISE EXCEPTION 'occupation exceeds maximum length of 100 characters';
  END IF;
  IF NEW.relationship IS NOT NULL AND length(NEW.relationship) > 100 THEN
    RAISE EXCEPTION 'relationship exceeds maximum length of 100 characters';
  END IF;
  IF NEW.personality IS NOT NULL AND length(NEW.personality) > 200 THEN
    RAISE EXCEPTION 'personality exceeds maximum length of 200 characters';
  END IF;
  IF NEW.hair_color IS NOT NULL AND length(NEW.hair_color) > 100 THEN
    RAISE EXCEPTION 'hair_color exceeds maximum length of 100 characters';
  END IF;
  IF NEW.body_type IS NOT NULL AND length(NEW.body_type) > 100 THEN
    RAISE EXCEPTION 'body_type exceeds maximum length of 100 characters';
  END IF;
  IF NEW.clothing IS NOT NULL AND length(NEW.clothing) > 200 THEN
    RAISE EXCEPTION 'clothing exceeds maximum length of 200 characters';
  END IF;
  IF NEW.likes IS NOT NULL AND length(NEW.likes) > 500 THEN
    RAISE EXCEPTION 'likes exceeds maximum length of 500 characters';
  END IF;
  IF NEW.eats IS NOT NULL AND length(NEW.eats) > 500 THEN
    RAISE EXCEPTION 'eats exceeds maximum length of 500 characters';
  END IF;
  IF NEW.listens_to IS NOT NULL AND length(NEW.listens_to) > 500 THEN
    RAISE EXCEPTION 'listens_to exceeds maximum length of 500 characters';
  END IF;
  IF NEW.prefers IS NOT NULL AND length(NEW.prefers) > 500 THEN
    RAISE EXCEPTION 'prefers exceeds maximum length of 500 characters';
  END IF;
  IF NEW.gender IS NOT NULL AND length(NEW.gender) > 50 THEN
    RAISE EXCEPTION 'gender exceeds maximum length of 50 characters';
  END IF;
  IF NEW.age IS NOT NULL AND (NEW.age < 13 OR NEW.age > 120) THEN
    RAISE EXCEPTION 'age must be between 13 and 120';
  END IF;
  IF NEW.username IS NOT NULL AND length(NEW.username) > 50 THEN
    RAISE EXCEPTION 'username exceeds maximum length of 50 characters';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_profile_fields_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_profile_fields();
