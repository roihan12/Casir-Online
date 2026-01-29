
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const HourlyTrafficChart = ({ hourlyData }) => {
  console.log("HourlyTrafficChart data:", hourlyData);

  // Handle both array and object formats
  let chartData = [];
  
  if (Array.isArray(hourlyData)) {
    // If it's already an array, usage depends on its content. but let's assume it might be the right shape
    chartData = hourlyData;
  } else if (typeof hourlyData === 'object' && hourlyData !== null) {
      // Transform object { "00": 1, ... } to array
      chartData = Object.entries(hourlyData).map(([hour, count]) => ({
        hour: hour,
        count: count
      }));
  }

  // Sort by hour
  chartData = chartData.sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm h-full">
      <h3 className="text-base font-medium mb-4">Traffic per Jam</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="hour" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#6B7280' }}
              interval={2} // Show every 2nd label to avoid crowding
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <Tooltip 
              cursor={{ fill: '#F3F4F6' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            <Bar 
              dataKey="count" 
              fill="#8B5CF6" 
              radius={[4, 4, 0, 0]} 
              name="Transaksi"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default HourlyTrafficChart;
