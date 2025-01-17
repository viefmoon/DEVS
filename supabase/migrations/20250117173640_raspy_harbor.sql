/*
  # Add Insert Policies

  1. Changes
    - Add INSERT policies for all tables to allow authenticated users to create new records
    
  2. Security
    - Only authenticated users can insert new records
    - Each table gets its own policy for better control
*/

-- Add insert policies for stations
CREATE POLICY "Allow authenticated users to insert stations"
  ON stations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add insert policies for groups
CREATE POLICY "Allow authenticated users to insert groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add insert policies for sensors
CREATE POLICY "Allow authenticated users to insert sensors"
  ON sensors
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add insert policies for sensor_types
CREATE POLICY "Allow authenticated users to insert sensor types"
  ON sensor_types
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add insert policies for measurement_units
CREATE POLICY "Allow authenticated users to insert measurement units"
  ON measurement_units
  FOR INSERT
  TO authenticated
  WITH CHECK (true);