-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create FAQ categories table
CREATE TABLE public.faq_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create FAQ items table
CREATE TABLE public.faq_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.faq_categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- Policies for user_roles (users can view their own roles)
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policies for FAQ categories (public read, admin write)
CREATE POLICY "Anyone can view active FAQ categories" 
ON public.faq_categories 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage FAQ categories" 
ON public.faq_categories 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Policies for FAQ items (public read, admin write)
CREATE POLICY "Anyone can view active FAQ items" 
ON public.faq_items 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage FAQ items" 
ON public.faq_items 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at
CREATE TRIGGER update_faq_categories_updated_at
BEFORE UPDATE ON public.faq_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faq_items_updated_at
BEFORE UPDATE ON public.faq_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default FAQ categories
INSERT INTO public.faq_categories (name, description, icon_name, display_order) VALUES
  ('battery', 'Battery and charging related questions', 'Battery', 1),
  ('location', 'GPS and location tracking questions', 'MapPin', 2),
  ('maintenance', 'Maintenance and repair questions', 'Wrench', 3),
  ('delivery', 'Order and delivery questions', 'Package', 4),
  ('safety', 'Safety and emergency questions', 'AlertTriangle', 5),
  ('general', 'General questions about scooter features', 'Clock', 6);

-- Insert some default FAQ items
INSERT INTO public.faq_items (category_id, question, answer, keywords, display_order) 
SELECT 
  c.id,
  'Battery not charging properly',
  'For battery issues: Check if the charger is properly connected and the outlet is working. Use only the original charger. Charging time is typically 4-6 hours.',
  ARRAY['battery', 'charge', 'charging', 'power', 'not charging'],
  1
FROM public.faq_categories c WHERE c.name = 'battery';

INSERT INTO public.faq_items (category_id, question, answer, keywords, display_order) 
SELECT 
  c.id,
  'Cannot find my scooter location',
  'GPS Tracking Issues: Ensure Bluetooth is enabled and you are within 30 feet. Check if scooter is powered on. Force-close and restart the app.',
  ARRAY['gps', 'location', 'find', 'tracking', 'lost', 'app', 'bluetooth'],
  1
FROM public.faq_categories c WHERE c.name = 'location';