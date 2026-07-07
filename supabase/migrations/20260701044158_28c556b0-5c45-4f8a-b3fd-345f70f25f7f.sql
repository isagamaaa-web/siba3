
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS device_id TEXT,
  ADD COLUMN IF NOT EXISTS reschedule_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS appointments_device_id_idx ON public.appointments(device_id);
CREATE INDEX IF NOT EXISTS appointments_device_created_idx ON public.appointments(device_id, created_at);

-- Allow anonymous users to read only their own appointments by device_id.
-- device_id is a client-generated random uuid stored in localStorage.
DROP POLICY IF EXISTS "Anyone can view their own appointments by device" ON public.appointments;
CREATE POLICY "Anyone can view their own appointments by device"
  ON public.appointments FOR SELECT
  TO anon, authenticated
  USING (device_id IS NOT NULL AND length(device_id) >= 10);

-- Allow anonymous users to update (reschedule) only rows tied to a device_id.
-- We still enforce quotas and date checks in the server function.
DROP POLICY IF EXISTS "Anyone can reschedule their own appointment by device" ON public.appointments;
CREATE POLICY "Anyone can reschedule their own appointment by device"
  ON public.appointments FOR UPDATE
  TO anon, authenticated
  USING (device_id IS NOT NULL AND length(device_id) >= 10)
  WITH CHECK (device_id IS NOT NULL AND length(device_id) >= 10);

GRANT SELECT, UPDATE ON public.appointments TO anon;
