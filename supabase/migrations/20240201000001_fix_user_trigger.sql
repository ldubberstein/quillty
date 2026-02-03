-- Fix the handle_new_user trigger to use provided username from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_username TEXT;
BEGIN
  -- Use username from metadata if provided, otherwise generate a safe one
  new_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    -- Generate username from email: take part before @, remove invalid chars, add random suffix
    REGEXP_REPLACE(
      LOWER(SPLIT_PART(COALESCE(NEW.email, 'user'), '@', 1)),
      '[^a-z0-9_]',
      '',
      'g'
    ) || '_' || SUBSTR(REPLACE(NEW.id::text, '-', ''), 1, 8)
  );

  -- Ensure username is at least 3 chars
  IF LENGTH(new_username) < 3 THEN
    new_username := 'user_' || SUBSTR(REPLACE(NEW.id::text, '-', ''), 1, 8);
  END IF;

  -- Truncate to 30 chars max
  new_username := SUBSTR(new_username, 1, 30);

  INSERT INTO public.users (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    new_username,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
