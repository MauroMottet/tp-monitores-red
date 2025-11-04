'use client';

import { Activity, Wifi, Zap, AlertTriangle } from 'lucide-react';
import { NetworkStats } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';

interface StatsOverviewProps {
  stats: NetworkStats;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Nodos Activos */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Nodos Activos
              </p>
              <p className="text-2xl font-bold mt-2">
                {stats.activeNodes} / {stats.totalNodes}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Wifi className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-500"
                style={{
                  width: `${(stats.activeNodes / stats.totalNodes) * 100}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Latencia Promedio */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Latencia Promedio
              </p>
              <p className="text-2xl font-bold mt-2">
                {stats.averageLatency.toFixed(0)}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  ms
                </span>
              </p>
            </div>
            <div
              className={`h-12 w-12 rounded-full flex items-center justify-center ${
                stats.averageLatency < 150
                  ? 'bg-green-100 dark:bg-green-900/20'
                  : stats.averageLatency < 300
                  ? 'bg-yellow-100 dark:bg-yellow-900/20'
                  : 'bg-red-100 dark:bg-red-900/20'
              }`}
            >
              <Zap
                className={`h-6 w-6 ${
                  stats.averageLatency < 150
                    ? 'text-green-600 dark:text-green-400'
                    : stats.averageLatency < 300
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-muted-foreground">
              {stats.averageLatency < 150
                ? 'Excelente'
                : stats.averageLatency < 300
                ? 'Aceptable'
                : 'Requiere atención'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Total de Conexiones */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Conexiones Totales
              </p>
              <p className="text-2xl font-bold mt-2">
                {stats.totalConnections.toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-muted-foreground">
              {(stats.totalConnections / stats.totalNodes).toFixed(0)} por nodo
              (promedio)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Alarmas Activas */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Alarmas Activas
              </p>
              <p className="text-2xl font-bold mt-2">{stats.activeAlarms}</p>
            </div>
            <div
              className={`h-12 w-12 rounded-full flex items-center justify-center ${
                stats.activeAlarms === 0
                  ? 'bg-gray-100 dark:bg-gray-800'
                  : 'bg-red-100 dark:bg-red-900/20'
              }`}
            >
              <AlertTriangle
                className={`h-6 w-6 ${
                  stats.activeAlarms === 0
                    ? 'text-gray-400 dark:text-gray-600'
                    : 'text-red-600 dark:text-red-400'
                }`}
              />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-muted-foreground">
              {stats.activeAlarms === 0
                ? 'Sistema operando normalmente'
                : 'Requiere revisión'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}