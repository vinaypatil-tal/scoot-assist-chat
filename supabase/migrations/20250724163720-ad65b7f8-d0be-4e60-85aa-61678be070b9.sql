-- Temporarily allow all operations on FAQ tables for development
-- This allows the simple admin login to work without Supabase auth

-- Update FAQ categories policies to allow all operations without authentication
DROP POLICY IF EXISTS "Admins can manage FAQ categories" ON public.faq_categories;
DROP POLICY IF EXISTS "Anyone can view active FAQ categories" ON public.faq_categories;

CREATE POLICY "Allow all operations on FAQ categories" 
ON public.faq_categories 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Update FAQ items policies to allow all operations without authentication  
DROP POLICY IF EXISTS "Admins can manage FAQ items" ON public.faq_items;
DROP POLICY IF EXISTS "Anyone can view active FAQ items" ON public.faq_items;

CREATE POLICY "Allow all operations on FAQ items" 
ON public.faq_items 
FOR ALL 
USING (true) 
WITH CHECK (true);