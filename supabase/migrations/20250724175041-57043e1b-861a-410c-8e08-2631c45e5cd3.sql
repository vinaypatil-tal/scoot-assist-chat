-- Update phone number in first profile record
UPDATE public.profiles 
SET phone_number = '1234567890'
WHERE id = (SELECT id FROM public.profiles ORDER BY created_at LIMIT 1);

-- Insert 12 orders distributed across profile users (3 orders per user)
WITH profile_users AS (
  SELECT user_id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM public.profiles 
  LIMIT 4
)
INSERT INTO public.orders (
  user_id, order_id, customer_name, customer_phone, customer_email,
  product_name, product_model, order_amount, order_date, estimated_delivery,
  delivery_status, tracking_number, delivery_address, delivery_notes
)
SELECT 
  pu.user_id,
  'ES-2025-' || LPAD((1000 + series.n)::text, 4, '0'),
  CASE (series.n % 4)
    WHEN 0 THEN 'John Smith'
    WHEN 1 THEN 'Sarah Johnson'
    WHEN 2 THEN 'Mike Davis'
    ELSE 'Emily Wilson'
  END,
  CASE (series.n % 4)
    WHEN 0 THEN '5551234567'
    WHEN 1 THEN '5552345678'
    WHEN 2 THEN '5553456789'
    ELSE '5554567890'
  END,
  CASE (series.n % 4)
    WHEN 0 THEN 'john.smith@email.com'
    WHEN 1 THEN 'sarah.johnson@email.com'
    WHEN 2 THEN 'mike.davis@email.com'
    ELSE 'emily.wilson@email.com'
  END,
  CASE (series.n % 3)
    WHEN 0 THEN 'ElectroScoot Lite'
    WHEN 1 THEN 'ElectroScoot Pro'
    ELSE 'ElectroScoot Max'
  END,
  CASE (series.n % 3)
    WHEN 0 THEN 'ES-LITE-2025'
    WHEN 1 THEN 'ES-PRO-2025'
    ELSE 'ES-MAX-2025'
  END,
  CASE (series.n % 3)
    WHEN 0 THEN 499.99
    WHEN 1 THEN 799.99
    ELSE 999.99
  END,
  now() - (series.n * interval '2 days'),
  current_date + ((series.n % 10 + 1) * interval '1 day'),
  CASE (series.n % 5)
    WHEN 0 THEN 'confirmed'
    WHEN 1 THEN 'processing'
    WHEN 2 THEN 'shipped'
    WHEN 3 THEN 'out_for_delivery'
    ELSE 'delivered'
  END,
  'ES2025' || LPAD((10000 + series.n * 123)::text, 5, '0') || '-TRK',
  CASE (series.n % 4)
    WHEN 0 THEN '123 Main St, Springfield, IL 62701'
    WHEN 1 THEN '456 Oak Ave, Portland, OR 97205'
    WHEN 2 THEN '789 Pine Rd, Austin, TX 73301'
    ELSE '321 Elm Dr, Denver, CO 80202'
  END,
  CASE 
    WHEN series.n % 5 = 0 THEN 'Leave at front door'
    WHEN series.n % 5 = 1 THEN 'Ring doorbell twice'
    WHEN series.n % 5 = 2 THEN 'Contact customer before delivery'
    WHEN series.n % 5 = 3 THEN 'Fragile - handle with care'
    ELSE NULL
  END
FROM (
  SELECT generate_series(1, 12) as n
) series
CROSS JOIN LATERAL (
  SELECT user_id 
  FROM profile_users 
  WHERE rn = ((series.n - 1) / 3) + 1
) pu;