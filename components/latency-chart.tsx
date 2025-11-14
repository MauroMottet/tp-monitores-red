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

// Colores asignados a cada nodo (deben coincidir con las keys en data)
const NODE_COLORS = {
  'Node-1': '#10b981', // verde
  'Node-2': '#3b82f6', // azul
  'Node-3': '#f59e0b', // ámbar
  'Node-4': '#8b5cf6', // púrpura
  'Node-5': '#ec4899', // rosa
};

// Mapeo para mostrar nombres legibles en la leyenda
const NODE_NAMES = {
  'Node-1': 'Node-A',
  'Node-2': 'Node-B',
  'Node-3': 'Node-C',
  'Node-4': 'Node-D',
  'Node-5': 'Node-E',
};

export function LatencyChart({ data }: LatencyChartProps) {
  // Convierte timestamp ISO a formato HH:MM:SS para el eje X
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Tooltip personalizado con estilo dark mode y valores formateados
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          {/* Timestamp del punto */}
          <p className="text-xs text-muted-foreground mb-2">
            {formatTime(label)}
          </p>
          {/* Lista de nodos con sus valores */}
          {payload.map((entry: any) => (
            <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
              {/* Círculo de color del nodo */}
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
        {/* Container responsive para que el gráfico se adapte al ancho */}
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            {/* Grilla con líneas punteadas */}
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            
            {/* Eje X: timestamps formateados */}
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTime}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
            />
            
            {/* Eje Y: latencia en ms, rango 0-500ms */}
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
            
            {/* Tooltip customizado al hacer hover */}
            <Tooltip content={<CustomTooltip />} />
            
            {/* Leyenda con nombres mapeados (Node-A, Node-B, etc.) */}
            <Legend
              wrapperStyle={{ fontSize: 14 }}
              iconType="line"
              formatter={(value) => NODE_NAMES[value as keyof typeof NODE_NAMES]}
            />

            {/* Genera una línea por cada nodo con su color asignado */}
            {Object.entries(NODE_COLORS).map(([nodeId, color]) => (
              <Line
                key={nodeId}
                type="monotone"           // Curva suave
                dataKey={nodeId}          // Key en el objeto data
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3 }}            // Radio de los puntos
                activeDot={{ r: 5 }}      // Radio al hacer hover
                name={nodeId}
                connectNulls              // Conecta línea aunque haya valores null
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        {/* Leyenda visual de umbrales de latencia */}
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