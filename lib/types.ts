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

// Estructura de un nodo de red
export interface NetworkNode {
  id: string;
  name: string;
  status: NodeStatus;
  connections: number;
  latency: number; // en milisegundos
  lastUpdate: number; // timestamp
  trend?: 'improving' | 'worsening' | 'stable'; // tendencia de latencia
}

// Datos específicos según tipo de evento
export interface NodeStatusChangeData {
  oldStatus: NodeStatus;
  newStatus: NodeStatus;
}

export interface LatencyUpdateData {
  latency: number;
  previousLatency?: number;
}

export interface ConnectionChangeData {
  connections: number;
  previousConnections?: number;
}

export interface AlarmData {
  severity: AlarmSeverity;
  message: string;
  nodeId: string;
  nodeName: string;
}

// Estructura base de un evento
export interface KafkaEvent {
  id: string;
  type: EventType;
  timestamp: number;
  nodeId: string;
  data: NodeStatusChangeData | LatencyUpdateData | ConnectionChangeData | AlarmData;
  metadata?: Record<string, any>;
}

// Callback para suscriptores de eventos
export type EventCallback = (event: KafkaEvent) => void;

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
  timestamp: number;
  [nodeId: string]: number; // latencia de cada nodo
}

// Entrada del log de eventos
export interface EventLogEntry {
  id: string;
  timestamp: number;
  type: EventType;
  nodeId: string;
  nodeName: string;
  description: string;
  severity: AlarmSeverity;
}