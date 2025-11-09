import { sendEvent } from './kafka';
import type { NetworkNode, NodeStatus, NetworkEvent } from './types.ts';

// Variables globales
let notifySSE: ((event: NetworkEvent) => void) | null = null;
let nodesRef: Map<number, NetworkNode> | null = null;
let simulatorStarted = false;

// 🟡 Cada entrada del set es `${nodeId}:${tipoAlarma}`
const activeAlarms = new Set<string>();

export function setSSENotifier(notifier: (event: NetworkEvent) => void) {
  notifySSE = notifier;
}

export function setNodesRef(nodes: Map<number, NetworkNode>) {
  nodesRef = nodes;
}

const NODES: NetworkNode[] = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  name: `Node-${i + 1}`,
  status: 'online',
  latency: 100,
  connections: 120,
  timestamp: new Date().toISOString(),
}));

function randomStatus(prev: NodeStatus): NodeStatus {
  const transitions: Record<NodeStatus, NodeStatus[]> = {
    online: ['online', 'degraded'],
    degraded: ['online', 'offline', 'degraded'],
    offline: ['degraded', 'offline'],
  };
  const opts = transitions[prev];
  return opts[Math.floor(Math.random() * opts.length)];
}

function randomEventType(): 'NODE_STATUS_CHANGE' | 'LATENCY_UPDATE' | 'CONNECTION_CHANGE' {
  const events = ['NODE_STATUS_CHANGE', 'LATENCY_UPDATE', 'CONNECTION_CHANGE'] as const;
  return events[Math.floor(Math.random() * events.length)];
}

async function handleAlarm(node: NetworkNode, type: string, condition: boolean, severity: string, message: string) {
  const key = `${node.id}:${type}`;
  const isActive = activeAlarms.has(key);

  if (condition && !isActive) {
    // Activar nueva alarma
    activeAlarms.add(key);
    const alarm: NetworkEvent = {
      type: 'ALARM',
      timestamp: new Date().toISOString(),
      nodeId: node.id,
      data: {
        status: node.status,
        latency: node.latency,
        connections: node.connections,
        message,
        severity,
        active: true,
      },
    };
    console.log(`⚠️ Activando alarma (${type}) en Node ${node.id}`);
    await sendEvent('alarm', alarm);
    notifySSE?.(alarm);
  } else if (!condition && isActive) {
    // Resolver alarma
    activeAlarms.delete(key);
    const resolved: NetworkEvent = {
      type: 'ALARM',
      timestamp: new Date().toISOString(),
      nodeId: node.id,
      data: {
        message: `${message} resuelta`,
        severity,
        active: false,
      },
    };
    console.log(`✅ Resolviendo alarma (${type}) en Node ${node.id}`);
    await sendEvent('alarm', resolved);
    notifySSE?.(resolved);
  }
}

export async function startSimulator() {
  if (simulatorStarted) {
    console.log('⚠️ Simulador ya está corriendo');
    return;
  }

  simulatorStarted = true;
  console.log('🎬 Iniciando simulador con SSE y Kafka...');

  setInterval(async () => {
    const node = NODES[Math.floor(Math.random() * NODES.length)];
    const eventType = randomEventType();

    // Actualizamos el nodo
    if (eventType === 'NODE_STATUS_CHANGE') node.status = randomStatus(node.status);
    if (eventType === 'LATENCY_UPDATE') node.latency = Math.floor(50 + Math.random() * 450);
    if (eventType === 'CONNECTION_CHANGE') node.connections = Math.floor(20 + Math.random() * 200);

    node.timestamp = new Date().toISOString();
    if (nodesRef) nodesRef.set(node.id, node);

    // Evento base
    const event: NetworkEvent = {
      type: eventType,
      timestamp: node.timestamp,
      nodeId: node.id,
      data: {
        status: node.status,
        latency: node.latency,
        connections: node.connections,
      },
    };

    // Kafka + SSE
    await sendEvent(eventType.toLowerCase(), event);
    notifySSE?.(event);

    // Condiciones de alarma
    await handleAlarm(node, 'latency', node.latency > 300, 'warning', `Latencia alta: ${node.latency}ms`);
    await handleAlarm(node, 'offline', node.status === 'offline', 'critical', `Nodo fuera de línea`);
    await handleAlarm(node, 'connections', node.connections < 50, 'info', `Conexiones bajas: ${node.connections}`);

    // Log del estado actual
    console.log(`🔁 Evento ${event.type} - Node ${node.id} | Alarmas activas: ${activeAlarms.size}`);
  }, 1000);
}
