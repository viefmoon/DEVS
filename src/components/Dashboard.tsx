import React, { useState, useEffect } from 'react';
import { format, subHours, subDays, subWeeks, subMonths } from 'date-fns';
import { Settings, LayoutDashboard, LineChart as ChartIcon, Building2, Factory, Thermometer, Droplets, Gauge, Wind, X, Clock, LogOut } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';
import { Configuration } from './Configuration';
import { Analysis } from './Analysis';

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';

type SensorHistoryModalProps = {
  sensor: any | null;
  sensorType: any | null;
  unit: any | null;
  readings: any[];
  onClose: () => void;
  onTimeRangeChange: (range: TimeRange) => void;
  timeRange: TimeRange;
};

function SensorHistoryModal({ sensor, sensorType, unit, readings, onClose, onTimeRangeChange, timeRange }: SensorHistoryModalProps) {
  if (!sensor) return null;

  const timeRanges: { value: TimeRange; label: string }[] = [
    { value: '1h', label: '1 hora' },
    { value: '6h', label: '6 horas' },
    { value: '24h', label: '24 horas' },
    { value: '7d', label: '7 días' },
    { value: '30d', label: '30 días' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 m-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold">{sensor.name}</h3>
            <p className="text-sm text-gray-500">
              {sensorType?.name} • {unit?.symbol}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 flex items-center space-x-2">
          <Clock className="h-5 w-5 text-gray-500" />
          <div className="flex space-x-2">
            {timeRanges.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onTimeRangeChange(value)}
                className={`px-3 py-1 rounded-full text-sm ${
                  timeRange === value
                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={readings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(timestamp) => {
                  const date = new Date(timestamp);
                  return timeRange === '1h' || timeRange === '6h'
                    ? format(date, 'HH:mm')
                    : format(date, 'dd/MM HH:mm');
                }}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(timestamp) => format(new Date(timestamp), 'dd/MM/yyyy HH:mm')}
                formatter={(value) => [`${value} ${unit?.symbol}`, sensor.name]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#4f46e5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [activeView, setActiveView] = useState('overview');
  const [stations, setStations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [sensorTypes, setSensorTypes] = useState([]);
  const [measurementUnits, setMeasurementUnits] = useState([]);
  const [readings, setReadings] = useState({});
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [sensorHistory, setSensorHistory] = useState([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  useEffect(() => {
    fetchData();
    subscribeToReadings();

    return () => {
      supabase.removeAllChannels();
    };
  }, []);

  useEffect(() => {
    if (selectedSensor) {
      fetchSensorHistory(selectedSensor.id);
    }
  }, [timeRange, selectedSensor]);

  const getStartDate = () => {
    const now = new Date();
    switch (timeRange) {
      case '1h':
        return subHours(now, 1);
      case '6h':
        return subHours(now, 6);
      case '24h':
        return subDays(now, 1);
      case '7d':
        return subWeeks(now, 1);
      case '30d':
        return subMonths(now, 1);
      default:
        return subDays(now, 1);
    }
  };

  const fetchData = async () => {
    try {
      const [
        { data: stationsData },
        { data: groupsData },
        { data: sensorsData },
        { data: sensorTypesData },
        { data: measurementUnitsData },
        { data: readingsData }
      ] = await Promise.all([
        supabase.from('stations').select('*'),
        supabase.from('groups').select('*'),
        supabase.from('sensors').select('*'),
        supabase.from('sensor_types').select('*'),
        supabase.from('measurement_units').select('*'),
        supabase.from('readings').select('*').order('timestamp', { ascending: false }).limit(1000)
      ]);

      setStations(stationsData || []);
      setGroups(groupsData || []);
      setSensors(sensorsData || []);
      setSensorTypes(sensorTypesData || []);
      setMeasurementUnits(measurementUnitsData || []);

      const groupedReadings = {};
      readingsData?.forEach(reading => {
        if (!groupedReadings[reading.sensor_id]) {
          groupedReadings[reading.sensor_id] = [];
        }
        groupedReadings[reading.sensor_id].push(reading);
      });
      setReadings(groupedReadings);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const subscribeToReadings = () => {
    const channel = supabase
      .channel('readings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'readings' }, 
        payload => {
          setReadings(prev => {
            const newReadings = { ...prev };
            if (!newReadings[payload.new.sensor_id]) {
              newReadings[payload.new.sensor_id] = [];
            }
            newReadings[payload.new.sensor_id].push(payload.new);
            return newReadings;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchSensorHistory = async (sensorId) => {
    try {
      const { data } = await supabase
        .from('readings')
        .select('*')
        .eq('sensor_id', sensorId)
        .gte('timestamp', format(getStartDate(), "yyyy-MM-dd'T'HH:mm"))
        .order('timestamp', { ascending: true });
      
      setSensorHistory(data || []);
    } catch (error) {
      console.error('Error fetching sensor history:', error);
    }
  };

  const handleSensorClick = async (sensor) => {
    setSelectedSensor(sensor);
    await fetchSensorHistory(sensor.id);
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const getSensorIcon = (sensorTypeId) => {
    switch (sensorTypeId) {
      case 'TEMP':
        return <Thermometer className="h-6 w-6 text-red-500" />;
      case 'HUM':
        return <Droplets className="h-6 w-6 text-blue-500" />;
      case 'PRESS':
        return <Gauge className="h-6 w-6 text-green-500" />;
      case 'CO2':
        return <Wind className="h-6 w-6 text-purple-500" />;
      default:
        return <Gauge className="h-6 w-6 text-gray-500" />;
    }
  };

  const renderOverview = () => {
    return (
      <div className="space-y-6">
        {stations.map(station => (
          <div key={station.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-4">
              <div className="flex items-center space-x-3">
                <Building2 className="h-8 w-8 text-white" />
                <h2 className="text-xl font-bold text-white">{station.name}</h2>
              </div>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups
                .filter(group => group.station_id === station.id)
                .map(group => (
                  <div key={group.id} className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div className="flex items-center space-x-3">
                      <Factory className="h-6 w-6 text-indigo-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {sensors
                        .filter(sensor => sensor.group_id === group.id)
                        .map(sensor => {
                          const type = sensorTypes.find(t => t.id === sensor.sensor_type_id);
                          const unit = measurementUnits.find(u => u.id === sensor.unit_id);
                          const latestReading = readings[sensor.id]?.[readings[sensor.id]?.length - 1];
                          
                          return (
                            <button 
                              key={sensor.id}
                              onClick={() => handleSensorClick(sensor)}
                              className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-left w-full"
                            >
                              <div className="flex items-center space-x-3">
                                {getSensorIcon(sensor.sensor_type_id)}
                                <div>
                                  <h4 className="font-medium text-gray-900">{sensor.name}</h4>
                                  <p className="text-sm text-gray-500">
                                    {type?.name} • {unit?.symbol}
                                  </p>
                                </div>
                              </div>
                              {latestReading && (
                                <div className="text-right">
                                  <p className="text-lg font-semibold text-gray-900">
                                    {latestReading.value} {unit?.symbol}
                                  </p>
                                  <div className="text-xs text-gray-500">
                                    <p>{format(new Date(latestReading.timestamp), 'dd/MM/yyyy')}</p>
                                    <p>{format(new Date(latestReading.timestamp), 'HH:mm:ss')}</p>
                                  </div>
                                </div>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}

        {selectedSensor && (
          <SensorHistoryModal
            sensor={selectedSensor}
            sensorType={sensorTypes.find(t => t.id === selectedSensor.sensor_type_id) || null}
            unit={measurementUnits.find(u => u.id === selectedSensor.unit_id) || null}
            readings={sensorHistory}
            onClose={() => {
              setSelectedSensor(null);
              setSensorHistory([]);
            }}
            onTimeRangeChange={handleTimeRangeChange}
            timeRange={timeRange}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveView('overview')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  activeView === 'overview'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>Overview</span>
              </button>
              <button
                onClick={() => setActiveView('analysis')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  activeView === 'analysis'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChartIcon className="h-5 w-5" />
                <span>Analysis</span>
              </button>
              <button
                onClick={() => setActiveView('configuration')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  activeView === 'configuration'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Settings className="h-5 w-5" />
                <span>Configuration</span>
              </button>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <LogOut className="h-5 w-5" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>

        {activeView === 'overview' && renderOverview()}
        {activeView === 'analysis' && (
          <Analysis
            stations={stations}
            groups={groups}
            sensors={sensors}
            sensorTypes={sensorTypes}
            measurementUnits={measurementUnits}
          />
        )}
        {activeView === 'configuration' && <Configuration />}
      </div>
    </div>
  );
}