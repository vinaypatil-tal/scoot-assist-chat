-- First, let's see what profile records exist and delete the 2nd one
-- We'll delete the record with the second oldest created_at timestamp
DELETE FROM public.profiles 
WHERE id = (
  SELECT id FROM public.profiles 
  ORDER BY created_at 
  LIMIT 1 OFFSET 1
);

-- Remove the automatic profile insertion trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the trigger function as well
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Insert 2 new profile records with specified phone numbers
-- We'll use random UUIDs for user_id since they need to link to actual auth users
INSERT INTO public.profiles (user_id, phone_number, full_name) VALUES 
(gen_random_uuid(), '9999999999', 'Test User 1'),
(gen_random_uuid(), '8888888888', 'Test User 2');