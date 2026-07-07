
-- Tighten anonymous insert policy with non-trivial check
DROP POLICY "Anyone can submit an appointment request" ON public.appointments;

CREATE POLICY "Anyone can submit an appointment request"
ON public.appointments FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(patient_name) BETWEEN 1 AND 120
  AND char_length(patient_phone) BETWEEN 5 AND 30
  AND char_length(service) BETWEEN 1 AND 80
  AND preferred_date >= CURRENT_DATE
  AND status = 'pending'
);

-- Lock down has_role: only authenticated and service_role can execute
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
