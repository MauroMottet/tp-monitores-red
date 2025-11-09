// Estados posibles de un nodo
export type NodeStatus = 'online' | 'offline' | 'degraded';

// Tipos de eventos del sistema
export type EventType = 
| 'NODE_STATUS_CHANGE' 
| 'LATENCY_UPDATE' 
| 'CONNECTION_CHANGE' 
| 'ALARM';

// Niveles de severidad de alarmas
export type AlarmSeverity = 'info' | 'warning' | 'critical';

// Estructura de un nodo de red (desde el backend)
export interface NetworkNode {
  id: number;
  name: string;
  status: NodeStatus;
  connections: number;
  latency: number; // en milisegundos
  timestamp: string; // ISO string del backend
  trend?: 'improving' | 'worsening' | 'stable'; // tendencia de latencia
}

// Datos específicos según tipo de evento
export interface NodeStatusChangeData {
  status: NodeStatus;
  latency: number;
  connections: number;
}

export interface LatencyUpdateData {
  latency: number;
  status: NodeStatus;
  connections: number;
}

export interface ConnectionChangeData {
  connections: number;
  status: NodeStatus;
  latency: number;
}

export interface AlarmData {
  severity: AlarmSeverity;
  message: string;
  nodeId: number;
  nodeName: string;
}

// Estructura base de un evento (desde el backend)
export interface NetworkEvent {
  type: EventType;
  timestamp: string; // ISO string
  nodeId: number;
  data: Record<string, any>;
}

// Para compatibilidad con tu código frontend existente
export interface KafkaEvent extends NetworkEvent {
  id?: string;
  metadata?: Record<string, any>;
}

// Callback para suscriptores de eventos
export type EventCallback = (event: NetworkEvent) => void;

// Estadísticas generales de la red
export interface NetworkStats {
  totalNodes: number;
  activeNodes: number;
  averageLatency: number;
  totalConnections: number;
  activeAlarms: number;
}

// Punto de datos para el gráfico de latencia
export interface LatencyDataPoint {
  timestamp: string;
  [nodeId: string]: number | string; // latencia de cada nodo
}

// Entrada del log de eventos
export interface EventLogEntry {
  id: string;
  timestamp: string;
  type: EventType;
  nodeId: number;
  nodeName: string;
  description: string;
  severity: AlarmSeverity;
}