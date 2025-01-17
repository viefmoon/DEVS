/*
  # Update schema to use string IDs

  1. Changes
    - Drop existing tables in correct order
    - Recreate tables with string IDs
    - Update foreign key relationships
    - Add sample data with formatted string IDs

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Drop existing tables in correct order
DROP TABLE IF EXISTS readings CASCADE;
DROP TABLE IF EXISTS measurements CASCADE;
DROP TABLE IF EXISTS new_sensors CASCADE;
DROP TABLE IF EXISTS sensors CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS stations CASCADE;

-- Create stations table with string ID
CREATE TABLE stations (
  id text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create groups table with string ID
CREATE TABLE groups (
  id text PRIMARY KEY,
  name text NOT NULL,
  station_id text REFERENCES stations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create sensors table with string ID
CREATE TABLE sensors (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  units text NOT NULL,
  sampling_interval integer NOT NULL,
  requires_calibration boolean NOT NULL DEFAULT false,
  recommended_calibration_interval integer,
  last_calibration_date timestamptz,
  group_id text REFERENCES groups(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create readings table
CREATE TABLE readings (
  id bigserial PRIMARY KEY,
  sensor_id text REFERENCES sensors(id) ON DELETE CASCADE,
  value numeric NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read stations"
  ON stations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read groups"
  ON groups FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read sensors"
  ON sensors FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read readings"
  ON readings FOR SELECT TO authenticated USING (true);

-- Insert sample data
INSERT INTO stations (id, name) VALUES
  ('EST-1', 'Main Facility'),
  ('EST-2', 'Secondary Facility');

DO $$ 
DECLARE
  group_id_1 text := 'GRP-1';
  group_id_2 text := 'GRP-2';
  group_id_3 text := 'GRP-3';
  sensor_id text;
BEGIN
  -- Create groups
  INSERT INTO groups (id, name, station_id) VALUES
    (group_id_1, 'Production Line A', 'EST-1'),
    (group_id_2, 'Production Line B', 'EST-1'),
    (group_id_3, 'Storage Area', 'EST-2');
    
  -- Insert sensors
  INSERT INTO sensors (id, name, type, units, sampling_interval, requires_calibration, recommended_calibration_interval, group_id) VALUES
    ('SEN-1', 'Temperature Sensor 1', 'temperature', '°C', 300, true, 90, group_id_1),
    ('SEN-2', 'Humidity Sensor 1', 'humidity', '%', 300, true, 90, group_id_1),
    ('SEN-3', 'Pressure Sensor 1', 'pressure', 'hPa', 300, true, 180, group_id_1),
    ('SEN-4', 'Temperature Sensor 2', 'temperature', '°C', 300, true, 90, group_id_2),
    ('SEN-5', 'CO2 Sensor 1', 'co2', 'ppm', 60, true, 30, group_id_2),
    ('SEN-6', 'Temperature Sensor 3', 'temperature', '°C', 900, true, 90, group_id_3),
    ('SEN-7', 'Humidity Sensor 2', 'humidity', '%', 900, true, 90, group_id_3);

  -- Generate sample readings
  FOR sensor_id IN SELECT id FROM sensors LOOP
    INSERT INTO readings (sensor_id, value, timestamp)
    SELECT
      sensor_id,
      CASE 
        WHEN (SELECT type FROM sensors WHERE id = sensor_id) = 'temperature' THEN 20 + (random() * 10)
        WHEN (SELECT type FROM sensors WHERE id = sensor_id) = 'humidity' THEN 40 + (random() * 20)
        WHEN (SELECT type FROM sensors WHERE id = sensor_id) = 'pressure' THEN 1000 + (random() * 25)
        WHEN (SELECT type FROM sensors WHERE id = sensor_id) = 'co2' THEN 350 + (random() * 100)
      END,
      now() - (interval '1 hour' * generate_series(0, 24))
    FROM generate_series(1, 24);
  END LOOP;
END $$;