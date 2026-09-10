-- Add test result tracking columns to malaria_blood_samples
ALTER TABLE public.malaria_blood_samples ADD COLUMN IF NOT EXISTS test_result text;
ALTER TABLE public.malaria_blood_samples ADD COLUMN IF NOT EXISTS tested_on date;
ALTER TABLE public.malaria_blood_samples ADD COLUMN IF NOT EXISTS tested_by uuid REFERENCES public.employee_master(id) ON DELETE SET NULL;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
