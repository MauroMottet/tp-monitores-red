import {
  NetworkNode,
  NodeStatus,
  EventType,
  KafkaEvent,
  EventCallback,
  AlarmSeverity,
  NodeStatusChangeData,
  LatencyUpdateData,
  ConnectionChangeData,
  AlarmData,
} from './types';

// Clase principal del simulador de Kafka
export class KafkaSimulator {
  private nodes: Map<string, NetworkNode>;
  private subscribers: Map<string, EventCallback[]>;
  private intervalId: NodeJS.Timeout | null = null;
  private eventCounter: number = 0;

  constructor() {
    this.nodes = new Map();
    this.subscribers = new Map();
    this.initializeNodes();
  }

  // Inicializar los 5 nodos con valores iniciales
  private initializeNodes(): void {
    const nodeNames = ['Node-A', 'Node-B', 'Node-C', 'Node-D', 'Node-E'];
    
    nodeNames.forEach((name, index) => {
      const node: NetworkNode = {
        id: `node-${index + 1}`,
        name,
        status: 'online',
        connections: this.randomInt(50, 200),
        latency: this.randomInt(50, 150),
        lastUpdate: Date.now(),
        trend: 'stable',
      };
      this.nodes.set(node.id, node);
    });
  }

  // Generar número aleatorio entre min y max
  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Generar un ID único para cada evento
  private generateEventId(): string {
    return `event-${++this.eventCounter}-${Date.now()}`;
  }

  // Publicar un evento a todos los suscriptores
  private publishEvent(event: KafkaEvent): void {
    const subscribers = this.subscribers.get(event.type) || [];
    const allSubscribers = this.subscribers.get('*') || [];
    
    [...subscribers, ...allSubscribers].forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error en callback de suscriptor:', error);
      }
    });
  }

  // Simular cambio de estado de un nodo
  private simulateStatusChange(node: NetworkNode): void {
    const oldStatus = node.status;
    const transitions: Record<NodeStatus, NodeStatus[]> = {
      online: ['online', 'online', 'online', 'degraded'], // 75% permanece online
      degraded: ['online', 'degraded', 'offline'], // puede mejorar, mantenerse o empeorar
      offline: ['offline', 'degraded'], // puede recuperarse a degraded
    };

    const possibleStates = transitions[node.status];
    const newStatus = possibleStates[this.randomInt(0, possibleStates.length - 1)];

    if (newStatus !== oldStatus) {
      node.status = newStatus;
      node.lastUpdate = Date.now();

      const event: KafkaEvent = {
        id: this.generateEventId(),
        type: 'NODE_STATUS_CHANGE',
        timestamp: Date.now(),
        nodeId: node.id,
        data: {
          oldStatus,
          newStatus,
        } as NodeStatusChangeData,
      };

      this.publishEvent(event);

      // Generar alarma si el nodo se cae
      if (newStatus === 'offline') {
        this.generateAlarm(node, 'critical', `${node.name} está fuera de línea`);
      } else if (newStatus === 'degraded') {
        this.generateAlarm(node, 'warning', `${node.name} está degradado`);
      }
    }
  }

  // Simular actualización de latencia
  private simulateLatencyUpdate(node: NetworkNode): void {
    const previousLatency = node.latency;
    
    // Ajustar latencia según el estado
    let latencyRange: [number, number];
    switch (node.status) {
      case 'online':
        latencyRange = [50, 200];
        break;
      case 'degraded':
        latencyRange = [200, 400];
        break;
      case 'offline':
        latencyRange = [400, 500];
        break;
    }

    // Cambio gradual de latencia (no saltos bruscos)
    const maxChange = 30;
    const change = this.randomInt(-maxChange, maxChange);
    let newLatency = node.latency + change;
    
    // Mantener dentro del rango
    newLatency = Math.max(latencyRange[0], Math.min(latencyRange[1], newLatency));
    
    node.latency = newLatency;
    node.lastUpdate = Date.now();

    // Calcular tendencia
    if (newLatency < previousLatency - 10) {
      node.trend = 'improving';
    } else if (newLatency > previousLatency + 10) {
      node.trend = 'worsening';
    } else {
      node.trend = 'stable';
    }

    const event: KafkaEvent = {
      id: this.generateEventId(),
      type: 'LATENCY_UPDATE',
      timestamp: Date.now(),
      nodeId: node.id,
      data: {
        latency: newLatency,
        previousLatency,
      } as LatencyUpdateData,
    };

    this.publishEvent(event);

    // Generar alarma si latencia es muy alta
    if (newLatency > 300 && node.status !== 'offline') {
      this.generateAlarm(node, 'warning', `Alta latencia en ${node.name}: ${newLatency}ms`);
    }
  }

  // Simular cambio en número de conexiones
  private simulateConnectionChange(node: NetworkNode): void {
    const previousConnections = node.connections;
    const change = this.randomInt(-20, 30);
    let newConnections = node.connections + change;
    
    // Mantener entre 0 y 300
    newConnections = Math.max(0, Math.min(300, newConnections));
    
    // Si el nodo está offline, reducir conexiones drásticamente
    if (node.status === 'offline') {
      newConnections = Math.floor(newConnections * 0.3);
    }

    node.connections = newConnections;
    node.lastUpdate = Date.now();

    const event: KafkaEvent = {
      id: this.generateEventId(),
      type: 'CONNECTION_CHANGE',
      timestamp: Date.now(),
      nodeId: node.id,
      data: {
        connections: newConnections,
        previousConnections,
      } as ConnectionChangeData,
    };

    this.publishEvent(event);

    // Generar alarma si conexiones son muy bajas
    if (newConnections < 50 && node.status === 'online') {
      this.generateAlarm(node, 'info', `Pocas conexiones en ${node.name}: ${newConnections}`);
    }
  }

  // Generar una alarma
  private generateAlarm(node: NetworkNode, severity: AlarmSeverity, message: string): void {
    const event: KafkaEvent = {
      id: this.generateEventId(),
      type: 'ALARM',
      timestamp: Date.now(),
      nodeId: node.id,
      data: {
        severity,
        message,
        nodeId: node.id,
        nodeName: node.name,
      } as AlarmData,
    };

    this.publishEvent(event);
  }

  // Ciclo principal de simulación
  private simulate(): void {
    this.nodes.forEach(node => {
      // Decidir qué simular (diferentes probabilidades)
      const action = Math.random();
      
      if (action < 0.1) {
        // 10% probabilidad de cambio de estado
        this.simulateStatusChange(node);
      } else if (action < 0.6) {
        // 50% probabilidad de actualización de latencia
        this.simulateLatencyUpdate(node);
      } else {
        // 40% probabilidad de cambio de conexiones
        this.simulateConnectionChange(node);
      }
    });
  }

  // MÉTODOS PÚBLICOS

  // Iniciar la simulación
  start(intervalMs: number = 2000): void {
    if (this.intervalId) {
      console.warn('Simulador ya está en ejecución');
      return;
    }

    console.log('🚀 Simulador de Kafka iniciado');
    this.intervalId = setInterval(() => {
      this.simulate();
    }, intervalMs);

    // Ejecutar una vez inmediatamente
    this.simulate();
  }

  // Detener la simulación
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏸️  Simulador de Kafka detenido');
    }
  }

  // Suscribirse a eventos
  subscribe(eventType: EventType | '*', callback: EventCallback): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    
    this.subscribers.get(eventType)!.push(callback);

    // Retornar función para desuscribirse
    return () => {
      const callbacks = this.subscribers.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Obtener el estado actual de todos los nodos
  getNodes(): NetworkNode[] {
    return Array.from(this.nodes.values());
  }

  // Obtener un nodo específico
  getNode(nodeId: string): NetworkNode | undefined {
    return this.nodes.get(nodeId);
  }
}

// Exportar una instancia única (singleton)
export const kafkaSimulator = new KafkaSimulator();