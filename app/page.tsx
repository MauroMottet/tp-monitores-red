'use client';

import { useEffect, useState } from 'react';
import { kafkaSimulator } from '@/lib/simulador-kafka';
import {
  NetworkNode,
  NetworkStats,
  LatencyDataPoint,
  EventLogEntry,
  KafkaEvent,
  AlarmData,
} from '@/lib/types';
import { StatsOverview } from '@/components/stats-overview';
import { NodeCard } from '@/components/node-card';
import { LatencyChart } from '@/components/latency-chart';
import { EventLog } from '@/components/event-log';
import { Activity } from 'lucide-react';

export default function DashboardPage() {
  // Estados principales
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [stats, setStats] = useState<NetworkStats>({
    totalNodes: 5,
    activeNodes: 0,
    averageLatency: 0,
    totalConnections: 0,
    activeAlarms: 0,
  });
  const [latencyHistory, setLatencyHistory] = useState<LatencyDataPoint[]>([]);
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calcular estadísticas generales
  const calculateStats = (currentNodes: NetworkNode[]): NetworkStats => {
    const activeNodes = currentNodes.filter((n) => n.status === 'online').length;
    const averageLatency =
      currentNodes.reduce((sum, n) => sum + n.latency, 0) / currentNodes.length;
    const totalConnections = currentNodes.reduce((sum, n) => sum + n.connections, 0);

    return {
      totalNodes: currentNodes.length,
      activeNodes,
      averageLatency,
      totalConnections,
      activeAlarms: stats.activeAlarms, // Se actualiza con eventos de alarma
    };
  };

  // Agregar punto de datos al historial de latencia
  const addLatencyDataPoint = (currentNodes: NetworkNode[]) => {
    const dataPoint: LatencyDataPoint = {
      timestamp: Date.now(),
    };

    currentNodes.forEach((node) => {
      dataPoint[node.id] = node.latency;
    });

    setLatencyHistory((prev) => {
      const newHistory = [...prev, dataPoint];
      // Mantener solo los últimos 20 puntos
      return newHistory.slice(-20);
    });
  };

  // Agregar evento al log
  const addEventToLog = (event: KafkaEvent) => {
    const node = kafkaSimulator.getNode(event.nodeId);
    if (!node) return;

    let description = '';
    let severity: 'info' | 'warning' | 'critical' = 'info';

    switch (event.type) {
      case 'NODE_STATUS_CHANGE': {
        const data = event.data as any;
        description = `Estado cambió de ${data.oldStatus} a ${data.newStatus}`;
        severity = data.newStatus === 'offline' ? 'critical' : 'warning';
        break;
      }
      case 'LATENCY_UPDATE': {
        const data = event.data as any;
        description = `Latencia actualizada a ${data.latency}ms`;
        severity = data.latency > 300 ? 'warning' : 'info';
        break;
      }
      case 'CONNECTION_CHANGE': {
        const data = event.data as any;
        description = `Conexiones: ${data.connections}`;
        severity = data.connections < 50 ? 'warning' : 'info';
        break;
      }
      case 'ALARM': {
        const data = event.data as AlarmData;
        description = data.message;
        severity = data.severity;
        break;
      }
    }

    const logEntry: EventLogEntry = {
      id: event.id,
      timestamp: event.timestamp,
      type: event.type,
      nodeId: event.nodeId,
      nodeName: node.name,
      description,
      severity,
    };

    setEventLog((prev) => {
      const newLog = [logEntry, ...prev];
      // Mantener solo los últimos 50 eventos
      return newLog.slice(0, 50);
    });

    // Incrementar contador de alarmas si es una alarma
    if (event.type === 'ALARM') {
      setStats((prev) => ({
        ...prev,
        activeAlarms: prev.activeAlarms + 1,
      }));
    }
  };

  // Inicializar el simulador
  useEffect(() => {
    // Obtener nodos iniciales
    const initialNodes = kafkaSimulator.getNodes();
    setNodes(initialNodes);
    setStats(calculateStats(initialNodes));
    addLatencyDataPoint(initialNodes);
    setIsLoading(false);

    // Suscribirse a todos los eventos
    const unsubscribe = kafkaSimulator.subscribe('*', (event: KafkaEvent) => {
      // Actualizar nodos
      const updatedNodes = kafkaSimulator.getNodes();
      setNodes(updatedNodes);
      setStats(calculateStats(updatedNodes));

      // Agregar al log
      addEventToLog(event);

      // Agregar punto de latencia si es actualización de latencia
      if (event.type === 'LATENCY_UPDATE') {
        addLatencyDataPoint(updatedNodes);
      }
    });

    // Iniciar simulación (eventos cada 2 segundos)
    kafkaSimulator.start(2000);

    // Cleanup al desmontar
    return () => {
      unsubscribe();
      kafkaSimulator.stop();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-lg font-semibold">Inicializando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Sistema de Monitoreo de Red
            </h1>
            <p className="text-muted-foreground mt-1">
              Supervisión en tiempo real de 5 nodos de red
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-muted-foreground">
              Sistema activo
            </span>
          </div>
        </div>

        {/* Estadísticas Generales */}
        <StatsOverview stats={stats} />

        {/* Tarjetas de Nodos */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Estado de los Nodos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {nodes.map((node) => (
              <NodeCard key={node.id} node={node} />
            ))}
          </div>
        </div>

        {/* Gráfico y Log */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de Latencia (2 columnas) */}
          <div className="lg:col-span-2">
            <LatencyChart data={latencyHistory} />
          </div>

          {/* Log de Eventos (1 columna) */}
          <div className="lg:col-span-1">
            <EventLog events={eventLog} />
          </div>
        </div>
      </div>
    </div>
  );
}