import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Settings } from 'lucide-react';

export function Configuration() {
  const [activeTab, setActiveTab] = useState('stations');
  const [stations, setStations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [sensorTypes, setSensorTypes] = useState([]);
  const [measurementUnits, setMeasurementUnits] = useState([]);

  // State for new entities
  const [newStation, setNewStation] = useState({ id: '', name: '' });
  const [newGroup, setNewGroup] = useState({ id: '', name: '', station_id: '' });
  const [newSensor, setNewSensor] = useState({
    id: '',
    name: '',
    sensor_type_id: '',
    unit_id: '',
    sampling_interval: 300,
    requires_calibration: false,
    recommended_calibration_interval: null,
    group_id: '',
  });
  const [newSensorType, setNewSensorType] = useState({ id: '', name: '', description: '' });
  const [newMeasurementUnit, setNewMeasurementUnit] = useState({
    id: '',
    name: '',
    symbol: '',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const fetchStations = supabase.from('stations').select('*').order('name');
    const fetchGroups = supabase.from('groups').select('*').order('name');
    const fetchSensors = supabase.from('sensors').select('*').order('name');
    const fetchSensorTypes = supabase.from('sensor_types').select('*').order('name');
    const fetchMeasurementUnits = supabase.from('measurement_units').select('*').order('name');

    const [
      { data: stationsData },
      { data: groupsData },
      { data: sensorsData },
      { data: sensorTypesData },
      { data: measurementUnitsData },
    ] = await Promise.all([
      fetchStations,
      fetchGroups,
      fetchSensors,
      fetchSensorTypes,
      fetchMeasurementUnits,
    ]);

    setStations(stationsData || []);
    setGroups(groupsData || []);
    setSensors(sensorsData || []);
    setSensorTypes(sensorTypesData || []);
    setMeasurementUnits(measurementUnitsData || []);
  };

  const handleCreateStation = async () => {
    if (!newStation.id || !newStation.name) return;
    
    try {
      const { error } = await supabase
        .from('stations')
        .insert([{ id: newStation.id, name: newStation.name }]);

      if (error) throw error;
      
      setNewStation({ id: '', name: '' });
      await fetchData();
    } catch (error) {
      console.error('Error creating station:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroup.id || !newGroup.name || !newGroup.station_id) return;
    
    try {
      const { error } = await supabase
        .from('groups')
        .insert([{ 
          id: newGroup.id,
          name: newGroup.name,
          station_id: newGroup.station_id 
        }]);

      if (error) throw error;
      
      setNewGroup({ id: '', name: '', station_id: '' });
      await fetchData();
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleCreateSensor = async () => {
    if (!newSensor.id || !newSensor.name || !newSensor.sensor_type_id || !newSensor.unit_id || !newSensor.group_id) return;
    
    try {
      const { error } = await supabase
        .from('sensors')
        .insert([{ 
          id: newSensor.id,
          name: newSensor.name,
          sensor_type_id: newSensor.sensor_type_id,
          unit_id: newSensor.unit_id,
          sampling_interval: newSensor.sampling_interval,
          requires_calibration: newSensor.requires_calibration,
          recommended_calibration_interval: newSensor.recommended_calibration_interval,
          group_id: newSensor.group_id
        }]);

      if (error) throw error;
      
      setNewSensor({
        id: '',
        name: '',
        sensor_type_id: '',
        unit_id: '',
        sampling_interval: 300,
        requires_calibration: false,
        recommended_calibration_interval: null,
        group_id: '',
      });
      await fetchData();
    } catch (error) {
      console.error('Error creating sensor:', error);
    }
  };

  const handleCreateSensorType = async () => {
    if (!newSensorType.id || !newSensorType.name) return;
    
    try {
      const { error } = await supabase
        .from('sensor_types')
        .insert([newSensorType]);

      if (error) throw error;
      
      setNewSensorType({ id: '', name: '', description: '' });
      await fetchData();
    } catch (error) {
      console.error('Error creating sensor type:', error);
    }
  };

  const handleCreateMeasurementUnit = async () => {
    if (!newMeasurementUnit.id || !newMeasurementUnit.name || !newMeasurementUnit.symbol) return;
    
    try {
      const { error } = await supabase
        .from('measurement_units')
        .insert([newMeasurementUnit]);

      if (error) throw error;
      
      setNewMeasurementUnit({ id: '', name: '', symbol: '', description: '' });
      await fetchData();
    } catch (error) {
      console.error('Error creating measurement unit:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h1 className="text-2xl font-bold flex items-center">
            <Settings className="mr-2" />
            Configuración
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {['stations', 'groups', 'sensors', 'sensor types', 'measurement units'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`${
                    activeTab === tab
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4">
            {activeTab === 'stations' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Station ID (e.g., EST-1)"
                    value={newStation.id}
                    onChange={(e) => setNewStation({ ...newStation, id: e.target.value })}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Station Name"
                    value={newStation.name}
                    onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleCreateStation}
                    className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Station
                  </button>
                </div>
                <div className="bg-white rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stations.map((station) => (
                        <tr key={station.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{station.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{station.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === 'groups' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="Group ID (e.g., GRP-1)"
                    value={newGroup.id}
                    onChange={(e) => setNewGroup({ ...newGroup, id: e.target.value })}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Group Name"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <select
                    value={newGroup.station_id}
                    onChange={(e) => setNewGroup({ ...newGroup, station_id: e.target.value })}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">Select Station</option>
                    {stations.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleCreateGroup}
                    className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Group
                  </button>
                </div>
                <div className="bg-white rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Station</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {groups.map((group) => (
                        <tr key={group.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{group.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{group.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {stations.find(s => s.id === group.station_id)?.name}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === 'sensors' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Sensor ID (e.g., SEN-1)"
                      value={newSensor.id}
                      onChange={(e) => setNewSensor({ ...newSensor, id: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Sensor Name"
                      value={newSensor.name}
                      onChange={(e) => setNewSensor({ ...newSensor, name: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <select
                      value={newSensor.sensor_type_id}
                      onChange={(e) => setNewSensor({ ...newSensor, sensor_type_id: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">Select Sensor Type</option>
                      {sensorTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newSensor.unit_id}
                      onChange={(e) => setNewSensor({ ...newSensor, unit_id: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">Select Unit</option>
                      {measurementUnits.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name} ({unit.symbol})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-4">
                    <select
                      value={newSensor.group_id}
                      onChange={(e) => setNewSensor({ ...newSensor, group_id: e.target.value })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">Select Group</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name} ({stations.find(s => s.id === group.station_id)?.name})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Sampling Interval (seconds)"
                      value={newSensor.sampling_interval}
                      onChange={(e) => setNewSensor({ ...newSensor, sampling_interval: parseInt(e.target.value) })}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newSensor.requires_calibration}
                        onChange={(e) => setNewSensor({ ...newSensor, requires_calibration: e.target.checked })}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label className="text-sm text-gray-700">Requires Calibration</label>
                    </div>
                    {newSensor.requires_calibration && (
                      <input
                        type="number"
                        placeholder="Calibration Interval (days)"
                        value={newSensor.recommended_calibration_interval || ''}
                        onChange={(e) => setNewSensor({ ...newSensor, recommended_calibration_interval: parseInt(e.target.value) })}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    )}
                  </div>
                </div>
                <button
                  onClick={handleCreateSensor}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Sensor
                </button>
                <div className="bg-white rounded-lg overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interval</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sensors.map((sensor) => (
                        <tr key={sensor.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sensor.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sensor.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {sensorTypes.find(t => t.id === sensor.sensor_type_id)?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {measurementUnits.find(u => u.id === sensor.unit_id)?.symbol}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {groups.find(g => g.id === sensor.group_id)?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {sensor.sampling_interval}s
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === 'sensor types' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Type ID (e.g., TEMP)"
                    value={newSensorType.id}
                    onChange={(e) => setNewSensorType({ ...newSensorType, id: e.target.value.toUpperCase() })}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Type Name"
                    value={newSensorType.name}
                    onChange={(e) => setNewSensorType({ ...newSensorType, name: e.target.value })}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={newSensorType.description}
                    onChange={(e) => setNewSensorType({ ...newSensorType, description: e.target.value })}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={handleCreateSensorType}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Sensor Type
                </button>
                <div className="bg-white rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sensorTypes.map((type) => (
                        <tr key={type.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{type.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{type.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{type.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === 'measurement units' && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="Unit ID (e.g., CELSIUS)"
                    value={newMeasurementUnit.id}
                    onChange={(e) => setNewMeasurementUnit({ ...newMeasurementUnit, id: e.target.value.toUpperCase() })}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Unit Name"
                    value={newMeasurementUnit.name}
                    onChange={(e) => setNewMeasurementUnit({ ...newMeasurementUnit, name: e.target.value })}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Symbol (e.g., °C)"
                    value={newMeasurementUnit.symbol}
                    onChange={(e) => setNewMeasurementUnit({ ...newMeasurementUnit, symbol: e.target.value })}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={newMeasurementUnit.description}
                    onChange={(e) => setNewMeasurementUnit({ ...newMeasurementUnit, description: e.target.value })}
                    className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={handleCreateMeasurementUnit}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Measurement Unit
                </button>
                <div className="bg-white rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {measurementUnits.map((unit) => (
                        <tr key={unit.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{unit.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{unit.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{unit.symbol}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{unit.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}