-- Create INSERT policy for orders table to allow authenticated users to create orders
CREATE POLICY "Authenticated users can create orders" 
ON public.orders 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);