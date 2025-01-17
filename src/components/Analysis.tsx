import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, ChevronDown, ChevronRight, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Props = {
  stations: any[];
  groups: any[];
  sensors: any[];
  sensorTypes: any[];
  measurementUnits: any[];
};

export function Analysis({ stations, groups, sensors, sensorTypes, measurementUnits }: Props) {
  const [readings, setReadings] = useState<{ [key: string]: any[] }>({});
  const [selectedSensors, setSelectedSensors] = useState<Set<string>>(new Set());
  const [expandedStations, setExpandedStations] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState({
    start: format(new Date(Date.now() - 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
    end: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  });
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  const lineColors = ['#4f46e5', '#e11d48', '#059669', '#d97706', '#7c3aed', '#be123c', '#0891b2'];

  useEffect(() => {
    if (selectedSensors.size > 0) {
      fetchReadings();
    }
  }, [selectedSensors, dateRange]);

  useEffect(() => {
    const subscription = supabase
      .channel('readings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'readings' }, 
        payload => {
          if (payload.new && selectedSensors.has(payload.new.sensor_id)) {
            setReadings(prev => ({
              ...prev,
              [payload.new.sensor_id]: [...(prev[payload.new.sensor_id] || []), payload.new]
            }));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedSensors]);

  useEffect(() => {
    // Transform readings into chart data
    const timestamps = new Set<string>();
    const sensorReadings: { [key: string]: { [key: string]: number } } = {};

    // Collect all timestamps and readings
    Object.entries(readings).forEach(([sensorId, sensorData]) => {
      if (selectedSensors.has(sensorId)) {
        sensorData.forEach(reading => {
          const timestamp = reading.timestamp;
          timestamps.add(timestamp);
          if (!sensorReadings[timestamp]) {
            sensorReadings[timestamp] = {};
          }
          sensorReadings[timestamp][sensorId] = reading.value;
        });
      }
    });

    // Create sorted chart data
    const newChartData = Array.from(timestamps)
      .sort()
      .map(timestamp => ({
        timestamp,
        ...sensorReadings[timestamp]
      }));

    setChartData(newChartData);
  }, [readings, selectedSensors]);

  const fetchReadings = async () => {
    setLoading(true);
    try {
      const promises = Array.from(selectedSensors).map(sensorId =>
        supabase
          .from('readings')
          .select('*')
          .eq('sensor_id', sensorId)
          .gte('timestamp', dateRange.start)
          .lte('timestamp', dateRange.end)
          .order('timestamp', { ascending: true })
      );

      const results = await Promise.all(promises);
      const newReadings = {};
      Array.from(selectedSensors).forEach((sensorId, index) => {
        newReadings[sensorId] = results[index].data || [];
      });
      setReadings(newReadings);
    } catch (error) {
      console.error('Error fetching readings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStation = (stationId: string) => {
    setExpandedStations(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(stationId)) {
        newExpanded.delete(stationId);
      } else {
        newExpanded.add(stationId);
      }
      return newExpanded;
    });
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(groupId)) {
        newExpanded.delete(groupId);
      } else {
        newExpanded.add(groupId);
      }
      return newExpanded;
    });
  };

  const toggleSensor = (sensorId: string) => {
    setSelectedSensors(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(sensorId)) {
        newSelected.delete(sensorId);
      } else if (newSelected.size < 5) {
        newSelected.add(sensorId);
      }
      return newSelected;
    });
  };

  const exportData = () => {
    const selectedSensorsList = Array.from(selectedSensors);
    const sensorNames = selectedSensorsList.map(id => sensors.find(s => s.id === id)?.name || id);
    
    const csv = [
      ['Timestamp', ...sensorNames],
      ...chartData.map(dataPoint => {
        const row = [format(new Date(dataPoint.timestamp), 'yyyy-MM-dd HH:mm:ss')];
        selectedSensorsList.forEach(sensorId => {
          row.push(dataPoint[sensorId]?.toString() || '');
        });
        return row;
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sensor-data-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg shadow col-span-1">
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Stations</h2>
          <div className="space-y-2">
            {stations.map(station => (
              <div key={station.id} className="space-y-2">
                <button
                  onClick={() => toggleStation(station.id)}
                  className="flex items-center space-x-2 w-full text-left hover:bg-gray-50 p-2 rounded"
                >
                  {expandedStations.has(station.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span>{station.name}</span>
                </button>
                
                {expandedStations.has(station.id) && (
                  <div className="ml-6 space-y-2">
                    {groups
                      .filter(group => group.station_id === station.id)
                      .map(group => (
                        <div key={group.id}>
                          <button
                            onClick={() => toggleGroup(group.id)}
                            className="flex items-center space-x-2 w-full text-left hover:bg-gray-50 p-2 rounded"
                          >
                            {expandedGroups.has(group.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <span>{group.name}</span>
                          </button>
                          
                          {expandedGroups.has(group.id) && (
                            <div className="ml-6 space-y-2">
                              {sensors
                                .filter(sensor => sensor.group_id === group.id)
                                .map(sensor => (
                                  <button
                                    key={sensor.id}
                                    onClick={() => toggleSensor(sensor.id)}
                                    className={`w-full text-left p-2 rounded ${
                                      selectedSensors.has(sensor.id)
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'hover:bg-gray-50'
                                    }`}
                                  >
                                    <div className="text-sm">{sensor.name}</div>
                                    <div className="text-xs text-gray-500">
                                      {sensorTypes.find(t => t.id === sensor.sensor_type_id)?.name} • 
                                      {measurementUnits.find(u => u.id === sensor.unit_id)?.symbol}
                                    </div>
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Date Range</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-sm text-gray-600">Start</label>
                <input
                  type="datetime-local"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">End</label>
                <input
                  type="datetime-local"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <button
            onClick={exportData}
            disabled={selectedSensors.size === 0}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow col-span-1 md:col-span-3">
        {selectedSensors.size > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {Array.from(selectedSensors).map((sensorId, index) => {
                const sensor = sensors.find(s => s.id === sensorId);
                return (
                  <div
                    key={sensorId}
                    className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1"
                    style={{ borderLeft: `4px solid ${lineColors[index % lineColors.length]}` }}
                  >
                    <span className="text-sm">{sensor?.name}</span>
                    <button
                      onClick={() => toggleSensor(sensorId)}
                      className="ml-2 text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : selectedSensors.size === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Select one or more sensors to view data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(timestamp) => format(new Date(timestamp), 'HH:mm')}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(timestamp) => format(new Date(timestamp), 'yyyy-MM-dd HH:mm')}
              />
              <Legend />
              {Array.from(selectedSensors).map((sensorId, index) => {
                const sensor = sensors.find(s => s.id === sensorId);
                return (
                  <Line
                    key={sensorId}
                    type="monotone"
                    dataKey={sensorId}
                    name={sensor?.name || sensorId}
                    stroke={lineColors[index % lineColors.length]}
                    dot={false}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}