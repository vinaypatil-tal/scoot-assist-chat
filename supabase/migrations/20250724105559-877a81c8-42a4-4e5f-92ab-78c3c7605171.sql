-- Admin Setup Migration
-- This migration sets up initial admin data and configurations

-- First, you'll need to create an admin user after someone registers
-- Replace 'YOUR_USER_ID_HERE' with the actual UUID of the user you want to make admin
-- 
-- To find your user ID:
-- 1. Register/login as a user first
-- 2. Go to Supabase Dashboard > Authentication > Users
-- 3. Copy the user ID from there
-- 4. Then run this manually in SQL Editor:
-- INSERT INTO public.user_roles (user_id, role) VALUES ('YOUR_USER_ID_HERE', 'admin');

-- Add comprehensive FAQ data for better testing
INSERT INTO public.faq_items (category_id, question, answer, keywords, display_order) 
SELECT 
  c.id,
  'Battery replacement and warranty information',
  'Battery Warranty: Our batteries are covered for 12 months or 300 charge cycles, whichever comes first. Replacement Options: Genuine replacement batteries cost $199-299, installation service available for $50, DIY replacement kits include tools and instructions. To order: Contact our support team with your scooter model and purchase date.',
  ARRAY['battery replacement', 'new battery', 'battery warranty', 'replacement cost'],
  2
FROM public.faq_categories c WHERE c.name = 'battery';

INSERT INTO public.faq_items (category_id, question, answer, keywords, display_order) 
SELECT 
  c.id,
  'Regular maintenance schedule and tips',
  'Regular Maintenance Schedule: Weekly - Check tire pressure (50 PSI), test brakes, clean with damp cloth. Monthly - Tighten bolts, lubricate folding mechanism, check brake pad wear. Professional Service (every 6 months) - Complete safety inspection, brake adjustment, tire replacement if needed.',
  ARRAY['maintenance', 'service', 'schedule', 'cleaning', 'tire pressure', 'brakes'],
  1
FROM public.faq_categories c WHERE c.name = 'maintenance';

INSERT INTO public.faq_items (category_id, question, answer, keywords, display_order) 
SELECT 
  c.id,
  'Tire puncture and replacement',
  'Flat Tire Solutions: For temporary fixes, small punctures can be repaired with our tire repair kit ($15). Tire Replacement costs: Front tire $45, Rear tire $55, Both tires $85 plus installation. DIY installation takes about 30 minutes with basic tools. Safety Warning: Do not ride on flat or damaged tires.',
  ARRAY['tire puncture', 'flat tire', 'tire replacement', 'wheel', 'tire repair'],
  2
FROM public.faq_categories c WHERE c.name = 'maintenance';

INSERT INTO public.faq_items (category_id, question, answer, keywords, display_order) 
SELECT 
  c.id,
  'Order tracking and delivery status',
  'Delivery Timeline: Standard shipping takes 3-5 business days, Express shipping 1-2 business days, White glove delivery 5-7 business days (includes setup). Track Your Order: Check email for tracking number, use our app Order Status feature, or call customer service. For delivery issues, contact us immediately for damaged packages or missing parts.',
  ARRAY['order', 'delivery', 'shipping', 'tracking', 'status', 'when will it arrive', 'delayed'],
  1
FROM public.faq_categories c WHERE c.name = 'delivery';

INSERT INTO public.faq_items (category_id, question, answer, keywords, display_order) 
SELECT 
  c.id,
  'Safety equipment and accident reporting',
  'Required Safety Gear: Helmet (required by law in most areas), front and rear lights for night riding, reflective clothing recommended. Safety Features: Dual braking system, LED headlight and taillight, bell for pedestrian alerts, speed limiter in app. For accidents: Seek medical attention if injured, move to safety, document with photos. Report incidents to safety@electroscoot.com.',
  ARRAY['accident', 'injury', 'safety', 'helmet', 'lights', 'brakes', 'emergency'],
  1
FROM public.faq_categories c WHERE c.name = 'safety';

INSERT INTO public.faq_items (category_id, question, answer, keywords, display_order) 
SELECT 
  c.id,
  'Speed and performance specifications',
  'Speed Specifications: Maximum speed 15.5 mph (25 km/h), 0-15 mph acceleration in 4.5 seconds. Speed modes: Eco (8 mph), Normal (12 mph), Sport (15.5 mph). Performance factors: Rider weight (optimal under 220 lbs), terrain (hills reduce speed), battery level, tire pressure. Check local laws for speed limits.',
  ARRAY['speed', 'how fast', 'max speed', 'mph', 'acceleration', 'performance'],
  1
FROM public.faq_categories c WHERE c.name = 'general';

INSERT INTO public.faq_items (category_id, question, answer, keywords, display_order) 
SELECT 
  c.id,
  'Weight limits and portability',
  'Weight Limits: Maximum rider weight 220 lbs (100 kg), scooter weight 26.5 lbs (12 kg), additional cargo up to 20 lbs in front basket. Portability: Folds in 3 seconds, includes carrying handle, fits in most car trunks, allowed on public transit. Performance Impact: Heavier riders may experience reduced range and slower acceleration on hills.',
  ARRAY['weight', 'weight limit', 'how much', 'heavy', 'carry', 'portable', 'folding'],
  2
FROM public.faq_categories c WHERE c.name = 'general';

INSERT INTO public.faq_items (category_id, question, answer, keywords, display_order) 
SELECT 
  c.id,
  'Weather resistance and water protection',
  'Water Resistance: IP54 rated - protected against splashing water. Safe in light rain and puddles, but avoid deep water and heavy rain. Never submerge or pressure wash. After wet rides: Dry thoroughly, check electrical connections, store in dry location. Winter Storage: Charge battery monthly, keep in temperature-controlled environment.',
  ARRAY['water', 'rain', 'waterproof', 'wet', 'weather', 'winter', 'storage'],
  3
FROM public.faq_categories c WHERE c.name = 'general';

-- Create an index for better FAQ search performance
CREATE INDEX IF NOT EXISTS idx_faq_items_keywords ON public.faq_items USING GIN(keywords);

-- Update the manual review table to include resolved timestamp trigger
CREATE OR REPLACE FUNCTION public.update_resolved_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_manual_review_resolved_at
BEFORE UPDATE ON public.manual_review_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_resolved_timestamp();

-- Add some helpful comments
COMMENT ON TABLE public.user_roles IS 'Stores user role assignments for admin access control';
COMMENT ON TABLE public.faq_categories IS 'Categories for organizing FAQ items';
COMMENT ON TABLE public.faq_items IS 'Individual FAQ questions and answers with keyword matching';
COMMENT ON TABLE public.manual_review_requests IS 'User requests for manual review when chatbot answers are insufficient';

-- Success message for admin setup
SELECT 'Admin system setup complete! Next steps:' as message, 
       '1. Register a user account through the normal signup process' as step_1,
       '2. Find your user ID in Supabase Dashboard > Authentication > Users' as step_2,
       '3. Run: INSERT INTO public.user_roles (user_id, role) VALUES (''your-user-id-here'', ''admin'');' as step_3,
       '4. Login and you will see the Admin button in the chat header' as step_4;