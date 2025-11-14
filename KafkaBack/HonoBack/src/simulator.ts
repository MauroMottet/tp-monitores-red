import { sendEvent } from './kafka';
import type { NetworkNode, NodeStatus, NetworkEvent } from './types.ts';

// Referencias globales inyectadas desde el módulo principal
let notifySSE: ((event: NetworkEvent) => void) | null = null; // Función para notificar a clientes SSE
let nodesRef: Map<number, NetworkNode> | null = null; // Referencia al Map de nodos del servidor
let simulatorStarted = false; // Flag para evitar múltiples instancias del simulador

// Set para rastrear alarmas activas: formato "nodeId:tipoAlarma" (ej: "1:latency")
const activeAlarms = new Set<string>();

// Inyecta la función notificadora de SSE desde el módulo principal
export function setSSENotifier(notifier: (event: NetworkEvent) => void) {
  notifySSE = notifier;
}

// Inyecta la referencia al Map de nodos desde el módulo principal
export function setNodesRef(nodes: Map<number, NetworkNode>) {
  nodesRef = nodes;
}

// Datos mock de 5 nodos de red para la simulación
const NODES: NetworkNode[] = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  name: `Node-${i + 1}`,
  status: 'online',
  latency: 100,
  connections: 120,
  timestamp: new Date().toISOString(),
}));

// Genera un cambio de estado realista basado en el estado actual
function randomStatus(prev: NodeStatus): NodeStatus {
  const transitions: Record<NodeStatus, NodeStatus[]> = {
    online: ['online', 'degraded'], // Online puede mantenerse o degradarse
    degraded: ['online', 'offline', 'degraded'], // Degraded puede recuperarse, caer o mantenerse
    offline: ['degraded', 'offline'], // Offline solo puede recuperarse a degraded o mantenerse
  };
  const opts = transitions[prev];
  return opts[Math.floor(Math.random() * opts.length)];
}

// Selecciona aleatoriamente un tipo de evento a simular
function randomEventType(): 'NODE_STATUS_CHANGE' | 'LATENCY_UPDATE' | 'CONNECTION_CHANGE' {
  const events = ['NODE_STATUS_CHANGE', 'LATENCY_UPDATE', 'CONNECTION_CHANGE'] as const;
  return events[Math.floor(Math.random() * events.length)];
}

// Gestiona la activación y resolución de alarmas basadas en condiciones
async function handleAlarm(node: NetworkNode, type: string, condition: boolean, severity: string, message: string) {
  const key = `${node.id}:${type}`; // Identificador único de la alarma
  const isActive = activeAlarms.has(key); // Verifica si la alarma ya está activa

  if (condition && !isActive) {
    // Condición cumplida y alarma NO activa → Activar nueva alarma
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
    await sendEvent('alarm', alarm); // Envía a Kafka
    notifySSE?.(alarm); // Notifica a clientes SSE
  } else if (!condition && isActive) {
    // Condición NO cumplida y alarma activa → Resolver alarma
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
    await sendEvent('alarm', resolved); // Envía a Kafka
    notifySSE?.(resolved); // Notifica a clientes SSE
  }
}

// Inicia el loop de simulación que genera eventos cada segundo
export async function startSimulator() {
  if (simulatorStarted) {
    console.log('⚠️ Simulador ya está corriendo');
    return;
  }

  simulatorStarted = true;
  console.log('🎬 Iniciando simulador con SSE y Kafka...');

  // Ejecuta simulación cada 1 segundo
  setInterval(async () => {
    // Selecciona un nodo aleatorio y un tipo de evento aleatorio
    const node = NODES[Math.floor(Math.random() * NODES.length)];
    const eventType = randomEventType();

    // Actualiza las propiedades del nodo según el tipo de evento
    if (eventType === 'NODE_STATUS_CHANGE') node.status = randomStatus(node.status);
    if (eventType === 'LATENCY_UPDATE') node.latency = Math.floor(50 + Math.random() * 450); // 50-500ms
    if (eventType === 'CONNECTION_CHANGE') node.connections = Math.floor(20 + Math.random() * 200); // 20-220

    // Actualiza timestamp y sincroniza con el Map global de nodos
    node.timestamp = new Date().toISOString();
    if (nodesRef) nodesRef.set(node.id, node);

    // Construye el evento de red
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

    // Envía el evento a Kafka y notifica a clientes SSE
    await sendEvent(eventType.toLowerCase(), event);
    notifySSE?.(event);

    // Evalúa condiciones de alarma y gestiona su activación/resolución
    await handleAlarm(node, 'latency', node.latency > 300, 'warning', `Latencia alta: ${node.latency}ms`);
    await handleAlarm(node, 'offline', node.status === 'offline', 'critical', `Nodo fuera de línea`);
    await handleAlarm(node, 'connections', node.connections < 50, 'info', `Conexiones bajas: ${node.connections}`);

    // Log del estado actual de la simulación
    console.log(`🔁 Evento ${event.type} - Node ${node.id} | Alarmas activas: ${activeAlarms.size}`);
  }, 1000);
}