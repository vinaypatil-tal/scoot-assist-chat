-- Create function to assign sample orders to new users
CREATE OR REPLACE FUNCTION public.assign_sample_orders_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  user_phone TEXT;
  user_name TEXT;
BEGIN
  -- Get user data from the profiles table or auth metadata
  SELECT 
    COALESCE(NEW.email, ''),
    COALESCE(NEW.phone, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Customer')
  INTO user_email, user_phone, user_name;

  -- Assign 1-2 sample orders to new users (50% chance of getting orders)
  IF random() > 0.5 THEN
    INSERT INTO public.orders (
      user_id, order_id, customer_name, customer_phone, customer_email,
      product_name, product_model, order_amount, order_date, estimated_delivery,
      delivery_status, tracking_number, delivery_address, delivery_notes
    ) VALUES (
      NEW.id,
      'ES-' || date_part('year', now())::text || '-' || LPAD((random() * 9999)::text, 3, '0'),
      user_name,
      user_phone,
      user_email,
      CASE (random() * 3)::int
        WHEN 0 THEN 'ElectroScoot Lite'
        WHEN 1 THEN 'ElectroScoot Pro'
        ELSE 'ElectroScoot Max'
      END,
      CASE (random() * 3)::int
        WHEN 0 THEN 'ES-LITE-2024'
        WHEN 1 THEN 'ES-PRO-2024'
        ELSE 'ES-MAX-2024'
      END,
      CASE (random() * 3)::int
        WHEN 0 THEN 499.99
        WHEN 1 THEN 799.99
        ELSE 999.99
      END,
      now() - (random() * interval '10 days'),
      current_date + (random() * interval '7 days')::int,
      CASE (random() * 5)::int
        WHEN 0 THEN 'confirmed'
        WHEN 1 THEN 'processing'
        WHEN 2 THEN 'shipped'
        WHEN 3 THEN 'out_for_delivery'
        ELSE 'delivered'
      END,
      'ES' || date_part('year', now())::text || LPAD((random() * 99999)::text, 5, '0') || '-TRACK',
      COALESCE(NEW.raw_user_meta_data ->> 'address', '123 Main St, Sample City, SC 12345'),
      CASE WHEN random() > 0.7 THEN 'Leave at front door' ELSE NULL END
    );
    
    -- 30% chance of getting a second order
    IF random() > 0.7 THEN
      INSERT INTO public.orders (
        user_id, order_id, customer_name, customer_phone, customer_email,
        product_name, product_model, order_amount, order_date, estimated_delivery,
        delivery_status, tracking_number, delivery_address, delivery_notes
      ) VALUES (
        NEW.id,
        'ES-' || date_part('year', now())::text || '-' || LPAD((random() * 9999)::text, 3, '0'),
        user_name,
        user_phone,
        user_email,
        CASE (random() * 3)::int
          WHEN 0 THEN 'ElectroScoot Lite'
          WHEN 1 THEN 'ElectroScoot Pro'
          ELSE 'ElectroScoot Max'
        END,
        CASE (random() * 3)::int
          WHEN 0 THEN 'ES-LITE-2024'
          WHEN 1 THEN 'ES-PRO-2024'
          ELSE 'ES-MAX-2024'
        END,
        CASE (random() * 3)::int
          WHEN 0 THEN 499.99
          WHEN 1 THEN 799.99
          ELSE 999.99
        END,
        now() - (random() * interval '20 days'),
        current_date - (random() * interval '5 days')::int,
        'delivered',
        'ES' || date_part('year', now())::text || LPAD((random() * 99999)::text, 5, '0') || '-TRACK',
        COALESCE(NEW.raw_user_meta_data ->> 'address', '123 Main St, Sample City, SC 12345'),
        'Delivered successfully'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to automatically assign sample orders to new users
CREATE TRIGGER assign_sample_orders_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_sample_orders_to_user();

-- Add some test order IDs that users can search for
COMMENT ON TABLE public.orders IS 'Customer orders with delivery tracking. Test order IDs: ES-2024-001, ES-2024-002, ES-2024-003, ES-2024-004, ES-2024-005, ES-2024-006';