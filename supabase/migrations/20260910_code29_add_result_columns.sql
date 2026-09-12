-- Add result tracking columns to malaria_blood_samples
ALTER TABLE IF EXISTS public.malaria_blood_samples ADD COLUMN IF NOT EXISTS result text NOT NULL DEFAULT 'Pending';
ALTER TABLE IF EXISTS public.malaria_blood_samples ADD COLUMN IF NOT EXISTS result_updated_at timestamptz;
ALTER TABLE IF EXISTS public.malaria_blood_samples ADD COLUMN IF NOT EXISTS result_updated_by uuid REFERENCES public.employee_master(id) ON DELETE SET NULL;

-- Add result tracking columns to tb_records
ALTER TABLE IF EXISTS public.tb_records ADD COLUMN IF NOT EXISTS result text NOT NULL DEFAULT 'Pending';
ALTER TABLE IF EXISTS public.tb_records ADD COLUMN IF NOT EXISTS result_updated_at timestamptz;
ALTER TABLE IF EXISTS public.tb_records ADD COLUMN IF NOT EXISTS result_updated_by uuid REFERENCES public.employee_master(id) ON DELETE SET NULL;

-- Add result tracking columns to tb_suspected_patient_register (for codebase compatibility)
ALTER TABLE IF EXISTS public.tb_suspected_patient_register ADD COLUMN IF NOT EXISTS result text NOT NULL DEFAULT 'Pending';
ALTER TABLE IF EXISTS public.tb_suspected_patient_register ADD COLUMN IF NOT EXISTS result_updated_at timestamptz;
ALTER TABLE IF EXISTS public.tb_suspected_patient_register ADD COLUMN IF NOT EXISTS result_updated_by uuid REFERENCES public.employee_master(id) ON DELETE SET NULL;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
