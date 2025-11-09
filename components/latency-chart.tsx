'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { LatencyDataPoint } from '@/lib/types';

interface LatencyChartProps {
  data: LatencyDataPoint[];
}

// Colores para cada nodo (claves deben coincidir con Node-1, Node-2, etc.)
const NODE_COLORS = {
  'Node-1': '#10b981', // green
  'Node-2': '#3b82f6', // blue
  'Node-3': '#f59e0b', // amber
  'Node-4': '#8b5cf6', // purple
  'Node-5': '#ec4899', // pink
};

// Nombres de nodos para la leyenda
const NODE_NAMES = {
  'Node-1': 'Node-A',
  'Node-2': 'Node-B',
  'Node-3': 'Node-C',
  'Node-4': 'Node-D',
  'Node-5': 'Node-E',
};

export function LatencyChart({ data }: LatencyChartProps) {
  // Formatear el timestamp para el eje X
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Formatear el tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-xs text-muted-foreground mb-2">
            {formatTime(label)}
          </p>
          {payload.map((entry: any) => (
            <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-medium">{entry.name}:</span>
              <span className="text-sm font-bold">{entry.value}ms</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Latencia en Tiempo Real</CardTitle>
        <p className="text-sm text-muted-foreground">
          Histórico de los últimos 20 puntos de datos
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTime}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            <YAxis
              label={{
                value: 'Latencia (ms)',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12 },
              }}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              domain={[0, 500]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 14 }}
              iconType="line"
              formatter={(value) => NODE_NAMES[value as keyof typeof NODE_NAMES]}
            />

            {/* Línea para cada nodo */}
            {Object.entries(NODE_COLORS).map(([nodeId, color]) => (
              <Line
                key={nodeId}
                type="monotone"
                dataKey={nodeId}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name={nodeId}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        {/* Leyenda de rangos de latencia */}
        <div className="mt-4 flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Óptimo (&lt;150ms)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">Aceptable (150-300ms)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Alto (&gt;300ms)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}