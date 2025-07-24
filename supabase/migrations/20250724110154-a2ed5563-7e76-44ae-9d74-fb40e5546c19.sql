-- Create orders table for tracking delivery status
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  product_name TEXT NOT NULL,
  product_model TEXT,
  order_amount DECIMAL(10,2) NOT NULL,
  order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  estimated_delivery DATE,
  actual_delivery_date DATE,
  delivery_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (delivery_status IN ('confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled')),
  tracking_number TEXT,
  delivery_address TEXT NOT NULL,
  delivery_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for orders (users can only see their own orders)
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert dummy order data
INSERT INTO public.orders (
  user_id, order_id, customer_name, customer_phone, customer_email, 
  product_name, product_model, order_amount, order_date, estimated_delivery,
  delivery_status, tracking_number, delivery_address, delivery_notes
) VALUES 
  -- These will be associated with actual users when they register
  ('00000000-0000-0000-0000-000000000001', 'ES-2024-001', 'John Smith', '+1-555-0101', 'john@email.com', 'ElectroScoot Pro', 'ES-PRO-2024', 799.99, now() - interval '5 days', current_date + interval '2 days', 'shipped', 'ES24001-TRACK', '123 Main St, New York, NY 10001', 'Leave at front door'),
  ('00000000-0000-0000-0000-000000000001', 'ES-2024-002', 'John Smith', '+1-555-0101', 'john@email.com', 'ElectroScoot Lite', 'ES-LITE-2024', 499.99, now() - interval '10 days', current_date - interval '2 days', 'delivered', 'ES24002-TRACK', '123 Main St, New York, NY 10001', 'Delivered to customer'),
  ('00000000-0000-0000-0000-000000000002', 'ES-2024-003', 'Sarah Johnson', '+91-98765-43210', 'sarah@email.com', 'ElectroScoot Max', 'ES-MAX-2024', 999.99, now() - interval '3 days', current_date + interval '3 days', 'processing', 'ES24003-TRACK', '456 Park Ave, Mumbai, MH 400001', NULL),
  ('00000000-0000-0000-0000-000000000003', 'ES-2024-004', 'Mike Wilson', '+1-555-0102', 'mike@email.com', 'ElectroScoot Pro', 'ES-PRO-2024', 799.99, now() - interval '1 day', current_date + interval '5 days', 'confirmed', 'ES24004-TRACK', '789 Oak St, Los Angeles, CA 90210', NULL),
  ('00000000-0000-0000-0000-000000000004', 'ES-2024-005', 'Emma Davis', '+1-555-0103', 'emma@email.com', 'ElectroScoot Lite', 'ES-LITE-2024', 499.99, now() - interval '7 days', current_date + interval '1 day', 'out_for_delivery', 'ES24005-TRACK', '321 Pine St, Chicago, IL 60601', 'Call before delivery'),
  ('00000000-0000-0000-0000-000000000005', 'ES-2024-006', 'Alex Chen', '+91-98765-43211', 'alex@email.com', 'ElectroScoot Max', 'ES-MAX-2024', 999.99, now() - interval '2 days', current_date + interval '4 days', 'shipped', 'ES24006-TRACK', '654 Elm St, Delhi, DL 110001', NULL);

-- Create index for better performance
CREATE INDEX idx_orders_order_id ON public.orders(order_id);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(delivery_status);

-- Add table comment
COMMENT ON TABLE public.orders IS 'Customer orders with delivery tracking information';