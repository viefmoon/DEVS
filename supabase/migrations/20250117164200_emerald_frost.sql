/*
  # Update schema for stations and groups

  1. New Tables
    - `stations`
      - `id` (uuid, primary key)
      - `name` (text, station name)
    - `groups`
      - `id` (uuid, primary key)
      - `name` (text, group name)
      - `station_id` (uuid, foreign key to stations)
    - Update `sensors` table with new fields
      - Add `group_id` (uuid, foreign key to groups)
      - Add `sampling_interval` (integer, seconds)
      - Add `requires_calibration` (boolean)
      - Add `recommended_calibration_interval` (integer, days, nullable)
      - Add `last_calibration_date` (timestamptz, nullable)
    - Rename `measurements` to `readings`
      - Rename table and update structure
      - Use serial id instead of uuid

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
*/

-- Create stations table
CREATE TABLE IF NOT EXISTS stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  station_id uuid REFERENCES stations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create new sensors table with updated schema
CREATE TABLE IF NOT EXISTS new_sensors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  units text NOT NULL,
  sampling_interval integer NOT NULL,
  requires_calibration boolean NOT NULL DEFAULT false,
  recommended_calibration_interval integer,
  last_calibration_date timestamptz,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create new readings table (previously measurements)
CREATE TABLE IF NOT EXISTS readings (
  id bigserial PRIMARY KEY,
  sensor_id uuid REFERENCES new_sensors(id) ON DELETE CASCADE,
  value numeric NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE new_sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read stations"
  ON stations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read groups"
  ON groups
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read sensors"
  ON new_sensors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read readings"
  ON readings
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert sample data
INSERT INTO stations (name) VALUES
  ('Main Facility'),
  ('Secondary Facility');

DO $$ 
DECLARE
  main_station_id uuid;
  secondary_station_id uuid;
  group_id_1 uuid;
  group_id_2 uuid;
  group_id_3 uuid;
  sensor_id uuid;
BEGIN
  -- Get station IDs
  SELECT id INTO main_station_id FROM stations WHERE name = 'Main Facility';
  SELECT id INTO secondary_station_id FROM stations WHERE name = 'Secondary Facility';
  
  -- Create groups
  INSERT INTO groups (name, station_id) VALUES
    ('Production Line A', main_station_id) RETURNING id INTO group_id_1;
  INSERT INTO groups (name, station_id) VALUES
    ('Production Line B', main_station_id) RETURNING id INTO group_id_2;
  INSERT INTO groups (name, station_id) VALUES
    ('Storage Area', secondary_station_id) RETURNING id INTO group_id_3;
    
  -- Insert sensors
  INSERT INTO new_sensors (name, type, units, sampling_interval, requires_calibration, recommended_calibration_interval, group_id) VALUES
    ('Temperature Sensor 1', 'temperature', '°C', 300, true, 90, group_id_1),
    ('Humidity Sensor 1', 'humidity', '%', 300, true, 90, group_id_1),
    ('Pressure Sensor 1', 'pressure', 'hPa', 300, true, 180, group_id_1),
    ('Temperature Sensor 2', 'temperature', '°C', 300, true, 90, group_id_2),
    ('CO2 Sensor 1', 'co2', 'ppm', 60, true, 30, group_id_2),
    ('Temperature Sensor 3', 'temperature', '°C', 900, true, 90, group_id_3),
    ('Humidity Sensor 2', 'humidity', '%', 900, true, 90, group_id_3);

  -- Generate sample readings
  FOR sensor_id IN SELECT id FROM new_sensors LOOP
    INSERT INTO readings (sensor_id, value, timestamp)
    SELECT
      sensor_id,
      CASE 
        WHEN (SELECT type FROM new_sensors WHERE id = sensor_id) = 'temperature' THEN 20 + (random() * 10)
        WHEN (SELECT type FROM new_sensors WHERE id = sensor_id) = 'humidity' THEN 40 + (random() * 20)
        WHEN (SELECT type FROM new_sensors WHERE id = sensor_id) = 'pressure' THEN 1000 + (random() * 25)
        WHEN (SELECT type FROM new_sensors WHERE id = sensor_id) = 'co2' THEN 350 + (random() * 100)
      END,
      now() - (interval '1 hour' * generate_series(0, 24))
    FROM generate_series(1, 24);
  END LOOP;
END $$;