'use client';

import { NetworkNode } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Wifi,
  WifiOff,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

interface NodeCardProps {
  node: NetworkNode;
}

export function NodeCard({ node }: NodeCardProps) {
  // Determinar el color según el estado
  const getStatusColor = () => {
    switch (node.status) {
      case 'online':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
    }
  };

  // Determinar el texto del estado
  const getStatusText = () => {
    switch (node.status) {
      case 'online':
        return 'En Línea';
      case 'degraded':
        return 'Degradado';
      case 'offline':
        return 'Fuera de Línea';
    }
  };

  // Determinar el icono del estado
  const getStatusIcon = () => {
    switch (node.status) {
      case 'online':
        return <Wifi className="h-5 w-5" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5" />;
      case 'offline':
        return <WifiOff className="h-5 w-5" />;
    }
  };

  // Determinar el icono de tendencia
  const getTrendIcon = () => {
    switch (node.trend) {
      case 'improving':
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      case 'worsening':
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  // Determinar el color de la latencia
  const getLatencyColor = () => {
    if (node.latency < 150) return 'text-green-600 dark:text-green-400';
    if (node.latency < 300) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Calcular tiempo desde la última actualización
  const getTimeSinceUpdate = () => {
    try {
      const lastUpdateTime = new Date(node.timestamp).getTime();
      const seconds = Math.floor((Date.now() - lastUpdateTime) / 1000);
      return seconds;
    } catch (error) {
      return 0;
    }
  };

  return (
    <Card className="relative overflow-hidden">
      {/* Barra de color lateral según estado */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusColor()}`} />

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{node.name}</CardTitle>
          <Badge
            variant={
              node.status === 'online'
                ? 'default'
                : node.status === 'degraded'
                ? 'secondary'
                : 'destructive'
            }
            className="flex items-center gap-1"
          >
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Latencia */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Latencia</p>
              <p className={`text-lg font-bold ${getLatencyColor()}`}>
                {node.latency}
                <span className="text-xs font-normal ml-1">ms</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1" title="Tendencia de latencia">
            {getTrendIcon()}
          </div>
        </div>

        {/* Conexiones */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <Wifi className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Conexiones Activas</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-lg font-bold">{node.connections}</p>
              {node.connections < 50 && node.status === 'online' && (
                <span className="text-xs text-orange-600 dark:text-orange-400">
                  ⚠️ Bajo
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Barra de estado de conexiones */}
        <div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                node.connections < 50
                  ? 'bg-orange-500'
                  : node.connections < 150
                  ? 'bg-blue-500'
                  : 'bg-green-500'
              }`}
              style={{
                width: `${Math.min((node.connections / 300) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Última actualización */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-muted-foreground">
            Actualizado hace {getTimeSinceUpdate()}s
          </p>
        </div>
      </CardContent>
    </Card>
  );
}