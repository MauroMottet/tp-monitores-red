'use client';

import { useEffect, useState, useRef } from 'react';
import {
  NetworkNode,
  NetworkStats,
  LatencyDataPoint,
  EventLogEntry,
  NetworkEvent,
} from '@/lib/types';
import { StatsOverview } from '@/components/stats-overview';
import { NodeCard } from '@/components/node-card';
import { LatencyChart } from '@/components/latency-chart';
import { EventLog } from '@/components/event-log';
import { Activity } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export default function DashboardPage() {
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

  // contador de alarmas persistente
  const alarmsCountRef = useRef<number>(0);
  const processedEventsRef = useRef<Map<string, boolean>>(new Map());

  // helper para calcular estadísticas
  const calculateStats = (currentNodes: NetworkNode[]): NetworkStats => {
    const activeNodes = currentNodes.filter((n) => n.status === 'online').length;
    const averageLatency =
      currentNodes.length > 0
        ? currentNodes.reduce((sum, n) => sum + n.latency, 0) / currentNodes.length
        : 0;
    const totalConnections = currentNodes.reduce((sum, n) => sum + n.connections, 0);

    return {
      totalNodes: currentNodes.length,
      activeNodes,
      averageLatency,
      totalConnections,
      activeAlarms: alarmsCountRef.current,
    };
  };

  const addLatencyDataPoint = (currentNodes: NetworkNode[]) => {
    const dataPoint: LatencyDataPoint = {
      timestamp: new Date().toISOString(),
    };

    currentNodes.forEach((node) => {
      dataPoint[`Node-${node.id}`] = node.latency;
    });

    setLatencyHistory((prev) => {
      const newHistory = [...prev, dataPoint];
      return newHistory.slice(-20);
    });
  };

  const addEventToLog = (event: NetworkEvent, currentNodes: NetworkNode[]) => {
  if (event.type === 'ALARM') {
    const isActive = event.data.active === true;
    const isResolved = event.data.active === false;

    // Incrementar si se activa una alarma
    if (isActive) {
      alarmsCountRef.current += 1;
    }

    // Decrementar si se resuelve una alarma
    if (isResolved && alarmsCountRef.current > 0) {
      alarmsCountRef.current -= 1;
    }

    // Actualizar stats en ambos casos
    setStats((prev) => ({
      ...prev,
      activeAlarms: alarmsCountRef.current,
    }));

    return;
  }

  // 🔹 Para el resto de eventos, mantener tu lógica actual
  const node = currentNodes.find((n) => n.id === event.nodeId);
  if (!node) return;

  let description = '';
  let severity: 'info' | 'warning' | 'critical' = 'info';

  switch (event.type) {
    case 'NODE_STATUS_CHANGE': {
      const data = event.data;
      description = `Estado: ${data.status}`;
      severity =
        data.status === 'offline'
          ? 'critical'
          : data.status === 'degraded'
          ? 'warning'
          : 'info';
      break;
    }
    case 'LATENCY_UPDATE': {
      const data = event.data;
      description = `Latencia: ${data.latency}ms`;
      severity = data.latency > 300 ? 'warning' : 'info';
      break;
    }
    case 'CONNECTION_CHANGE': {
      const data = event.data;
      description = `Conexiones: ${data.connections}`;
      severity = data.connections < 50 ? 'warning' : 'info';
      break;
    }
  }

  const logEntry: EventLogEntry = {
    id: `${event.nodeId}-${event.timestamp}`,
    timestamp: event.timestamp,
    type: event.type,
    nodeId: event.nodeId,
    nodeName: node.name,
    description,
    severity,
  };

  setEventLog((prev) => [logEntry, ...prev].slice(0, 50));
};


  const fetchInitialNodes = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/nodes`);
      const data = await response.json();
      setNodes(data);
      setStats(calculateStats(data));
      addLatencyDataPoint(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error obteniendo nodos:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialNodes();

    console.log('📡 Conectando a SSE en:', `${BACKEND_URL}/events`);
    const eventSource = new EventSource(`${BACKEND_URL}/events`);

    eventSource.onmessage = (event) => {
      try {
        const networkEvent: NetworkEvent = JSON.parse(event.data);
        const eventKey = `${networkEvent.nodeId}-${networkEvent.type}-${networkEvent.timestamp}`;

        if (processedEventsRef.current.has(eventKey)) return;
        processedEventsRef.current.set(eventKey, true);
        if (processedEventsRef.current.size > 1000) processedEventsRef.current.clear();

        let updatedNodesForLog: NetworkNode[] = [];

        setNodes((prevNodes) => {
          const updatedNodes = prevNodes.map((node) => {
            if (node.id === networkEvent.nodeId) {
              return {
                ...node,
                status: networkEvent.data.status ?? node.status,
                latency: networkEvent.data.latency ?? node.latency,
                connections: networkEvent.data.connections ?? node.connections,
              };
            }
            return node;
          });

          updatedNodesForLog = updatedNodes;
          setStats(calculateStats(updatedNodes));

          if (networkEvent.type === 'LATENCY_UPDATE') {
            addLatencyDataPoint(updatedNodes);
          }

          return updatedNodes;
        });

        addEventToLog(networkEvent, updatedNodesForLog);
      } catch (error) {
        console.error('Error procesando evento SSE:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('❌ Error SSE:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
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

        <StatsOverview stats={stats} />

        <div>
          <h2 className="text-xl font-semibold mb-4">Estado de los Nodos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {nodes.map((node) => (
              <NodeCard key={node.id} node={node} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LatencyChart data={latencyHistory} />
          </div>

          <div className="lg:col-span-1">
            <EventLog events={eventLog} />
          </div>
        </div>
      </div>
    </div>
  );
}
