/*
  # Add sensor types and units tables

  1. New Tables
    - `sensor_types`: Stores predefined sensor types
    - `units`: Stores measurement units
  
  2. Changes
    - Update sensors table to reference new tables
    - Migrate existing data to new structure
    
  3. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Create sensor types table
CREATE TABLE sensor_types (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create units table
CREATE TABLE units (
  id text PRIMARY KEY,
  name text NOT NULL,
  symbol text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Add new columns to sensors table
ALTER TABLE sensors 
  ADD COLUMN sensor_type_id text,
  ADD COLUMN unit_id text;

-- Insert sensor types
INSERT INTO sensor_types (id, name, description) VALUES
  ('TEMP', 'Temperature', 'Measures ambient temperature'),
  ('HUM', 'Humidity', 'Measures relative humidity'),
  ('PRESS', 'Pressure', 'Measures atmospheric pressure'),
  ('CO2', 'Carbon Dioxide', 'Measures CO2 concentration');

-- Insert units
INSERT INTO units (id, name, symbol, description) VALUES
  ('CELSIUS', 'Celsius', '°C', 'Temperature in degrees Celsius'),
  ('PERCENT', 'Percentage', '%', 'Relative percentage'),
  ('HPA', 'Hectopascal', 'hPa', 'Pressure in hectopascals'),
  ('PPM', 'Parts per Million', 'ppm', 'Concentration in parts per million');

-- Update existing sensors with new references
UPDATE sensors
SET 
  sensor_type_id = CASE
    WHEN type = 'temperature' THEN 'TEMP'
    WHEN type = 'humidity' THEN 'HUM'
    WHEN type = 'pressure' THEN 'PRESS'
    WHEN type = 'co2' THEN 'CO2'
  END,
  unit_id = CASE
    WHEN units = '°C' THEN 'CELSIUS'
    WHEN units = '%' THEN 'PERCENT'
    WHEN units = 'hPa' THEN 'HPA'
    WHEN units = 'ppm' THEN 'PPM'
  END;

-- Make the new columns required and add foreign key constraints
ALTER TABLE sensors
  ALTER COLUMN sensor_type_id SET NOT NULL,
  ALTER COLUMN unit_id SET NOT NULL,
  ADD CONSTRAINT fk_sensor_type FOREIGN KEY (sensor_type_id) REFERENCES sensor_types(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_unit FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE RESTRICT;

-- Drop old columns
ALTER TABLE sensors
  DROP COLUMN type,
  DROP COLUMN units;

-- Enable RLS on new tables
ALTER TABLE sensor_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
CREATE POLICY "Allow authenticated users to read sensor types"
  ON sensor_types FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read units"
  ON units FOR SELECT TO authenticated USING (true);