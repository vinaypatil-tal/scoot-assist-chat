-- Delete the 2nd oldest profile record
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

-- Temporarily disable the foreign key constraint to insert test data
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Insert 2 new profile records with specified phone numbers
INSERT INTO public.profiles (user_id, phone_number, full_name) VALUES 
(gen_random_uuid(), '9999999999', 'Test User 1'),
(gen_random_uuid(), '8888888888', 'Test User 2');

-- Re-enable the foreign key constraint (optional - depends on if you want to keep it)
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey 
-- FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;