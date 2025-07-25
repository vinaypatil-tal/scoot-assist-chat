-- Add policy to allow all authenticated users to view all orders
CREATE POLICY "All authenticated users can view all orders" 
ON public.orders 
FOR SELECT 
USING (auth.role() = 'authenticated');