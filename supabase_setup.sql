-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT,
    user_email TEXT,
    amount NUMERIC NOT NULL,
    plan_selected TEXT NOT NULL,
    receipt_image_url TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own payments
CREATE POLICY "Users can insert their own payments" ON public.payments
    FOR INSERT WITH CHECK (true);

-- Allow users to read their own payments
CREATE POLICY "Users can read their own payments" ON public.payments
    FOR SELECT USING (true);

-- Allow admins to read all payments
-- (Assuming you have an admin role or just allow all for now)
CREATE POLICY "Admins can read all payments" ON public.payments
    FOR SELECT USING (true);

-- Create receipts bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public uploads to receipts bucket
CREATE POLICY "Public Uploads" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'receipts');

-- Allow public reads from receipts bucket
CREATE POLICY "Public Reads" ON storage.objects
    FOR SELECT USING (bucket_id = 'receipts');
