export type NodeStatus = 'online' | 'offline' | 'degraded';

export interface NetworkNode {
  id: number;
  name: string;
  status: NodeStatus;
  latency: number;
  connections: number;
  timestamp: string;
}

export type EventType =
  | 'NODE_STATUS_CHANGE'
  | 'LATENCY_UPDATE'
  | 'CONNECTION_CHANGE'
  | 'ALARM';

export interface NetworkEvent {
  type: EventType;
  timestamp: string;
  nodeId: number;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}
