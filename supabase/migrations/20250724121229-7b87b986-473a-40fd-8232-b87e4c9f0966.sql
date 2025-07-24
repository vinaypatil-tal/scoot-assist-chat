-- Insert sample FAQ categories for electric scooters
INSERT INTO public.faq_categories (name, description, icon_name, display_order, is_active) VALUES
('General Information', 'Basic information about electric scooters', 'Info', 1, true),
('Battery & Charging', 'Questions about battery life and charging', 'Battery', 2, true),
('Safety & Maintenance', 'Safety guidelines and maintenance tips', 'Shield', 3, true),
('Troubleshooting', 'Common issues and solutions', 'Wrench', 4, true),
('Orders & Delivery', 'Order status and delivery information', 'Truck', 5, true);

-- Insert sample FAQ items
INSERT INTO public.faq_items (category_id, question, answer, keywords, display_order, is_active) VALUES
-- General Information
((SELECT id FROM public.faq_categories WHERE name = 'General Information'), 
 'What is the maximum speed of ElectroScoot models?', 
 'Our scooters have different maximum speeds: ElectroScoot Lite reaches 15 mph, ElectroScoot Pro reaches 20 mph, and ElectroScoot Max reaches 25 mph.', 
 ARRAY['speed', 'maximum', 'mph', 'fast'], 1, true),

((SELECT id FROM public.faq_categories WHERE name = 'General Information'), 
 'What is the weight limit for the scooters?', 
 'All our ElectroScoot models support riders up to 220 lbs (100 kg). The scooters are designed with robust construction to ensure safety and performance.', 
 ARRAY['weight', 'limit', 'capacity', 'maximum'], 2, true),

((SELECT id FROM public.faq_categories WHERE name = 'General Information'), 
 'What is the range of the electric scooters?', 
 'Range varies by model: ElectroScoot Lite offers 15 miles, ElectroScoot Pro offers 25 miles, and ElectroScoot Max offers 35 miles on a single charge.', 
 ARRAY['range', 'distance', 'miles', 'battery'], 3, true),

-- Battery & Charging
((SELECT id FROM public.faq_categories WHERE name = 'Battery & Charging'), 
 'How long does it take to fully charge the battery?', 
 'Charging times vary by model: Lite takes 3-4 hours, Pro takes 4-5 hours, and Max takes 5-6 hours for a complete charge from empty.', 
 ARRAY['charging', 'time', 'battery', 'hours'], 1, true),

((SELECT id FROM public.faq_categories WHERE name = 'Battery & Charging'), 
 'How long does the battery last?', 
 'Our lithium-ion batteries are designed to last 500-800 charge cycles, which typically translates to 2-3 years of regular use.', 
 ARRAY['battery', 'life', 'lifespan', 'cycles'], 2, true),

((SELECT id FROM public.faq_categories WHERE name = 'Battery & Charging'), 
 'Can I charge the scooter overnight?', 
 'Yes, all our scooters have built-in charging protection that prevents overcharging. It''s safe to charge overnight.', 
 ARRAY['overnight', 'charging', 'safe', 'overcharge'], 3, true),

-- Safety & Maintenance
((SELECT id FROM public.faq_categories WHERE name = 'Safety & Maintenance'), 
 'Do I need to wear a helmet?', 
 'Yes, we strongly recommend wearing a helmet and following local traffic laws. Some areas require helmets by law for electric scooter riders.', 
 ARRAY['helmet', 'safety', 'protection', 'law'], 1, true),

((SELECT id FROM public.faq_categories WHERE name = 'Safety & Maintenance'), 
 'How often should I maintain my scooter?', 
 'We recommend basic maintenance every month: check tire pressure, clean the scooter, and inspect for loose parts. Professional service is recommended every 6 months.', 
 ARRAY['maintenance', 'service', 'monthly', 'tire'], 2, true),

((SELECT id FROM public.faq_categories WHERE name = 'Safety & Maintenance'), 
 'Is the scooter waterproof?', 
 'Our scooters have IP54 water resistance, meaning they can handle light rain but should not be submerged or used in heavy rain.', 
 ARRAY['waterproof', 'water', 'rain', 'IP54'], 3, true),

-- Troubleshooting
((SELECT id FROM public.faq_categories WHERE name = 'Troubleshooting'), 
 'My scooter won''t turn on, what should I do?', 
 'First, check if the battery is charged. If the battery is charged, try holding the power button for 5 seconds. If it still doesn''t work, contact customer support.', 
 ARRAY['power', 'turn on', 'battery', 'troubleshoot'], 1, true),

((SELECT id FROM public.faq_categories WHERE name = 'Troubleshooting'), 
 'The scooter is making strange noises, is this normal?', 
 'Unusual noises are not normal. Check for loose parts, debris in wheels, or worn brake pads. If the noise persists, contact our support team.', 
 ARRAY['noise', 'strange', 'sounds', 'brake'], 2, true),

-- Orders & Delivery
((SELECT id FROM public.faq_categories WHERE name = 'Orders & Delivery'), 
 'How long does delivery take?', 
 'Standard delivery takes 3-7 business days. Express delivery (available in select areas) takes 1-2 business days.', 
 ARRAY['delivery', 'shipping', 'time', 'days'], 1, true),

((SELECT id FROM public.faq_categories WHERE name = 'Orders & Delivery'), 
 'Can I track my order?', 
 'Yes! You''ll receive a tracking number once your order ships. You can also check your order status in our app or website.', 
 ARRAY['tracking', 'order', 'status', 'number'], 2, true);