'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

export default function VitalsChart({ history = [] }) {
  // 1. Process actual history
  const historyLimit = 10;
  const actualData = history.slice(-historyLimit).map((item, idx) => ({
    name: item.timestamp 
      ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
      : `t-${history.length - idx}`,
    'Heart Rate': item.heart_rate,
    'Temperature': item.temperature,
    'SpO2': item.spo2,
    'Heart Rate (Forecast)': null,
    'Temperature (Forecast)': null,
    'SpO2 (Forecast)': null,
  }));

  // 2. Generate Future Forecast (3 cycles of 15 seconds)
  const forecastData = [];
  if (actualData.length >= 2) {
    const lastItem = actualData[actualData.length - 1];
    
    // Connect the actual line to the forecast line by setting the last historical point's forecast key
    lastItem['Heart Rate (Forecast)'] = lastItem['Heart Rate'];
    lastItem['Temperature (Forecast)'] = lastItem['Temperature'];
    lastItem['SpO2 (Forecast)'] = lastItem['SpO2'];

    // Calculate slopes based on last 4 elements (or available)
    const n = Math.min(4, actualData.length);
    const firstRef = actualData[actualData.length - n];
    
    const hrSlope = (lastItem['Heart Rate'] - firstRef['Heart Rate']) / (n - 1 || 1);
    const tempSlope = (lastItem['Temperature'] - firstRef['Temperature']) / (n - 1 || 1);
    const spo2Slope = (lastItem['SpO2'] - firstRef['SpO2']) / (n - 1 || 1);

    for (let i = 1; i <= 3; i++) {
      // Linear projection
      let hrPred = Math.round(lastItem['Heart Rate'] + hrSlope * i);
      let tempPred = parseFloat((lastItem['Temperature'] + tempSlope * i).toFixed(1));
      let spo2Pred = Math.round(lastItem['SpO2'] + spo2Slope * i);

      // Clinical bounds check
      hrPred = Math.max(40, Math.min(220, hrPred));
      tempPred = Math.max(34.0, Math.min(43.0, tempPred));
      spo2Pred = Math.max(50, Math.min(100, spo2Pred));

      forecastData.push({
        name: `t+${i * 15}s (Pred)`,
        'Heart Rate': null,
        'Temperature': null,
        'SpO2': null,
        'Heart Rate (Forecast)': hrPred,
        'Temperature (Forecast)': tempPred,
        'SpO2 (Forecast)': spo2Pred,
      });
    }
  }

  const chartData = [...actualData, ...forecastData];

  const finalChartData = chartData.length > 0 ? chartData : [
    { name: '0', 'Heart Rate': 75, 'Temperature': 36.8, 'SpO2': 98, 'Heart Rate (Forecast)': null, 'Temperature (Forecast)': null, 'SpO2 (Forecast)': null },
    { name: '15s', 'Heart Rate': 77, 'Temperature': 36.9, 'SpO2': 97, 'Heart Rate (Forecast)': null, 'Temperature (Forecast)': null, 'SpO2 (Forecast)': null }
  ];

  return (
    <div style={{ width: '100%', minWidth: 0, height: '300px', backgroundColor: 'transparent' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={finalChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="name" stroke="#6B7280" tick={{ fontSize: 11 }} />
          <YAxis stroke="#6B7280" tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E5E7EB',
              color: '#1A1A1A',
              borderRadius: '8px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: '#6B7280', marginTop: 10 }} />
          
          {/* Actual Vitals (Solid lines) */}
          <Line
            type="monotone"
            dataKey="Heart Rate"
            stroke="#DC2626"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Temperature"
            stroke="#F59E0B"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="SpO2"
            stroke="#0E6B50"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 6 }}
          />

          {/* Forecasted Vitals (Dashed lines) */}
          <Line
            type="monotone"
            dataKey="Heart Rate (Forecast)"
            stroke="#DC2626"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ r: 2 }}
            activeDot={false}
          />
          <Line
            type="monotone"
            dataKey="Temperature (Forecast)"
            stroke="#F59E0B"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ r: 2 }}
            activeDot={false}
          />
          <Line
            type="monotone"
            dataKey="SpO2 (Forecast)"
            stroke="#0E6B50"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ r: 2 }}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
