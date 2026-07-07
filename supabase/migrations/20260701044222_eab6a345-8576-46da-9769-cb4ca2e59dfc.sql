
DROP POLICY IF EXISTS "Anyone can view their own appointments by device" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can reschedule their own appointment by device" ON public.appointments;
REVOKE SELECT, UPDATE ON public.appointments FROM anon;
