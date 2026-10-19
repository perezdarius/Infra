ALTER TABLE public.reports ADD COLUMN barangay text;
COMMENT ON COLUMN public.reports.barangay IS 'Official PSGC barangay name within the service area (Bulan, Sorsogon).';