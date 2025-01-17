/*
  # Initial Schema Setup for Sensor Monitoring System

  1. New Tables
    - `sensors`
      - `id` (uuid, primary key)
      - `name` (text) - Sensor name/identifier
      - `type` (text) - Type of sensor (temperature, humidity, etc.)
      - `location` (text) - Physical location of sensor
      - `unit_of_measurement` (text) - Unit for sensor readings
      - `created_at` (timestamp) - Creation timestamp
    
    - `measurements`
      - `id` (uuid, primary key)
      - `sensor_id` (uuid, foreign key)
      - `value` (numeric) - Sensor reading value
      - `timestamp` (timestamp) - When measurement was taken

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
    
  3. Test Data
    - Insert sample sensors
    - Generate historical measurements
*/

-- Create sensors table
CREATE TABLE IF NOT EXISTS sensors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  location text NOT NULL,
  unit_of_measurement text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create measurements table
CREATE TABLE IF NOT EXISTS measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id uuid REFERENCES sensors(id) ON DELETE CASCADE,
  value numeric NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read sensors"
  ON sensors
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read measurements"
  ON measurements
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert sample sensors
INSERT INTO sensors (name, type, location, unit_of_measurement) VALUES
  ('Temp-001', 'temperature', 'Server Room A', '°C'),
  ('Humid-001', 'humidity', 'Server Room A', '%'),
  ('Press-001', 'pressure', 'Server Room A', 'hPa'),
  ('Temp-002', 'temperature', 'Server Room B', '°C'),
  ('CO2-001', 'co2', 'Office Area', 'ppm');

-- Generate historical data function
CREATE OR REPLACE FUNCTION generate_historical_data()
RETURNS void AS $$
DECLARE
  sensor_rec RECORD;
  start_time timestamptz;
  value_base numeric;
  i integer;
BEGIN
  FOR sensor_rec IN SELECT * FROM sensors LOOP
    start_time := now() - interval '30 days';
    
    -- Set base values for different sensor types
    value_base := CASE sensor_rec.type
      WHEN 'temperature' THEN 22.0
      WHEN 'humidity' THEN 45.0
      WHEN 'pressure' THEN 1013.0
      WHEN 'co2' THEN 400.0
      ELSE 0.0
    END;
    
    -- Generate data points
    FOR i IN 1..2880 LOOP -- 96 readings per day for 30 days
      INSERT INTO measurements (sensor_id, value, timestamp)
      VALUES (
        sensor_rec.id,
        value_base + (random() * 10 - 5), -- Add some random variation
        start_time + (i * interval '15 minutes')
      );
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to generate data
SELECT generate_historical_data();