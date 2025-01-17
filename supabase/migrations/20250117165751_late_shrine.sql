/*
  # Rename units table to measurement_units

  1. Changes
    - Rename units table to measurement_units
    - Update foreign key constraint in sensors table
    - Update RLS policy
*/

-- Rename the table
ALTER TABLE units RENAME TO measurement_units;

-- Update the foreign key constraint in sensors table
ALTER TABLE sensors 
  DROP CONSTRAINT fk_unit,
  ADD CONSTRAINT fk_measurement_unit FOREIGN KEY (unit_id) REFERENCES measurement_units(id) ON DELETE RESTRICT;

-- Drop and recreate the policy for the renamed table
DROP POLICY IF EXISTS "Allow authenticated users to read units" ON measurement_units;
CREATE POLICY "Allow authenticated users to read measurement units"
  ON measurement_units FOR SELECT TO authenticated USING (true);