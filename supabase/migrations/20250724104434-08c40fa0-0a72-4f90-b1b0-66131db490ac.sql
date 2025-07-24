-- Create manual_review_requests table
CREATE TABLE public.manual_review_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  phone_number TEXT,
  original_query TEXT NOT NULL,
  chat_context TEXT,
  chatbot_response TEXT,
  user_feedback TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  admin_response TEXT,
  admin_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.manual_review_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for manual_review_requests
CREATE POLICY "Users can view their own review requests" 
ON public.manual_review_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own review requests" 
ON public.manual_review_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_manual_review_requests_updated_at
BEFORE UPDATE ON public.manual_review_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_manual_review_requests_status ON public.manual_review_requests(status);
CREATE INDEX idx_manual_review_requests_created_at ON public.manual_review_requests(created_at DESC);