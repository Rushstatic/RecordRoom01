-- Add result tracking columns to malaria_blood_samples
ALTER TABLE public.malaria_blood_samples ADD COLUMN IF NOT EXISTS result text NOT NULL DEFAULT 'Pending';
ALTER TABLE public.malaria_blood_samples ADD COLUMN IF NOT EXISTS result_updated_at timestamptz;
ALTER TABLE public.malaria_blood_samples ADD COLUMN IF NOT EXISTS result_updated_by uuid REFERENCES public.employee_master(id) ON DELETE SET NULL;

-- Add result tracking columns to tb_suspected_patient_register
ALTER TABLE public.tb_suspected_patient_register ADD COLUMN IF NOT EXISTS result text NOT NULL DEFAULT 'Pending';
ALTER TABLE public.tb_suspected_patient_register ADD COLUMN IF NOT EXISTS result_updated_at timestamptz;
ALTER TABLE public.tb_suspected_patient_register ADD COLUMN IF NOT EXISTS result_updated_by uuid REFERENCES public.employee_master(id) ON DELETE SET NULL;

-- If they already exist as test_result, tested_on, tested_by, drop them to avoid confusion, or assume they are dropped.
ALTER TABLE public.malaria_blood_samples DROP COLUMN IF EXISTS test_result;
ALTER TABLE public.malaria_blood_samples DROP COLUMN IF EXISTS tested_on;
ALTER TABLE public.malaria_blood_samples DROP COLUMN IF EXISTS tested_by;

ALTER TABLE public.tb_suspected_patient_register DROP COLUMN IF EXISTS test_result;
ALTER TABLE public.tb_suspected_patient_register DROP COLUMN IF EXISTS tested_on;
ALTER TABLE public.tb_suspected_patient_register DROP COLUMN IF EXISTS tested_by;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
