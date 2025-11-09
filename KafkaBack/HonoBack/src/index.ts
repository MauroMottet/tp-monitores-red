/// <reference types="bun" />

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { startSimulator, setSSENotifier, setNodesRef } from './simulator';
import { kafka, producer } from './kafka';
import { spawn } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';
import type { NetworkNode, NetworkEvent } from './types';

const app = new Hono();

// Habilitar CORS
app.use('*', cors({
  origin: ['http://localhost:3001', 'http://localhost:3000', '*'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Estado global de los nodos
let nodes: Map<number, NetworkNode> = new Map(
  Array.from({ length: 5 }, (_, i) => [
    i + 1,
    {
      id: i + 1,
      name: `Node-${i + 1}`,
      status: 'online' as const,
      latency: 100,
      connections: 120,
      timestamp: new Date().toISOString(),
    },
  ])
);

// Listeners para SSE
const sseListeners: Set<(data: NetworkEvent) => void> = new Set();

// Función para notificar a todos los clientes SSE
function notifySSEClients(event: NetworkEvent) {
  sseListeners.forEach(listener => listener(event));
}

// ========== ENDPOINTS ==========

app.get('/', (c) => c.text('✅ Kafka simulator running...'));

// Endpoint para obtener todos los nodos
app.get('/nodes', (c) => {
  const nodeArray = Array.from(nodes.values());
  return c.json(nodeArray);
});

// Endpoint para obtener un nodo específico
app.get('/nodes/:id', (c) => {
  const id = parseInt(c.req.param('id'));
  const node = nodes.get(id);
  
  if (!node) {
    return c.json({ error: 'Node not found' }, 404);
  }
  
  return c.json(node);
});

// Server-Sent Events para actualizaciones en tiempo real
app.get('/events', (c) => {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  let isClosed = false;
  
  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl;
      console.log(`🔌 Cliente SSE conectado. Total listeners: ${sseListeners.size + 1}`);
      
      const listener = (event: NetworkEvent) => {
        if (isClosed || !controller) return;

        const message = `data: ${JSON.stringify(event)}\n\n`;
        try {
          controller.enqueue(encoder.encode(message));
        } catch (e) {
          isClosed = true;
          sseListeners.delete(listener);
        }
      };

      sseListeners.add(listener);

      // Marcar como cerrado cuando se desconecta
      (c.req.raw as any).on?.('close', () => {
        isClosed = true;
        sseListeners.delete(listener);
        console.log(`❌ Cliente SSE desconectado. Total listeners: ${sseListeners.size}`);
      });

      (c.req.raw as any).on?.('error', () => {
        isClosed = true;
        sseListeners.delete(listener);
      });
    },
  });

  return c.body(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
});

// ========== INICIALIZACIÓN KAFKA ==========

// Función para encontrar Kafka (relativo al proyecto)
function findKafkaPath(): string {
  const kafkaPath = join(import.meta.dir, '../../kafka_2.13-4.1.0');

  if (existsSync(join(kafkaPath, 'bin/kafka-server-start.sh'))) {
    console.log(`✅ Kafka encontrado en: ${kafkaPath}`);
    return kafkaPath;
  }

  throw new Error(`❌ No se encontró Kafka en ${kafkaPath}`);
}

// Función para iniciar Kafka Server
async function startKafkaServer(kafkaPath: string) {
  return new Promise<void>((resolve, reject) => {
    try {
      console.log('🔄 Iniciando Kafka Server...');
      
      const kafkaServerPath = join(kafkaPath, 'bin/kafka-server-start.sh');
      const kafkaConfig = join(kafkaPath, 'config/server.properties');

      const kafkaServer = spawn('sh', [kafkaServerPath, kafkaConfig], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
      });

      let isResolved = false;
      let output = '';

      kafkaServer.stdout?.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        
        if (!isResolved && (output.includes('started') || output.includes('Kafka version'))) {
          isResolved = true;
          console.log('✅ Kafka Server iniciado');
          resolve();
        }
      });

      kafkaServer.stderr?.on('data', (data) => {
        const chunk = data.toString();
        console.log('KAFKA LOG:', chunk.trim());
      });

      kafkaServer.on('error', (err) => {
        console.error('❌ Error iniciando Kafka Server:', err);
        if (!isResolved) {
          isResolved = true;
          reject(err);
        }
      });

      kafkaServer.on('close', (code) => {
        console.log(`Proceso Kafka cerrado con código: ${code}`);
      });

      // Timeout de 20 segundos
      setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          console.log('⚠️ Kafka timeout (20s) - continuando de todas formas');
          resolve();
        }
      }, 20000);
    } catch (error) {
      reject(error);
    }
  });
}

// Función para inicializar Kafka Client
async function initializeKafkaClient() {
  try {
    console.log('🔄 Conectando producer de Kafka...');
    await producer.connect();
    console.log('✅ Producer conectado a Kafka');
  } catch (error) {
    console.error('❌ Error conectando producer:', error);
    console.log('⚠️ Continuando de todas formas (simulación sin Kafka real)');
  }
}

// Bootstrap
async function bootstrap() {
  try {
    const kafkaPath = findKafkaPath();
    
    await startKafkaServer(kafkaPath);
    console.log('⏳ Esperando a que Kafka esté listo...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    await initializeKafkaClient();
    
    // Registrar la referencia de nodos en el simulador
    setNodesRef(nodes);
    
    // Registrar el notificador de SSE
    setSSENotifier((event: NetworkEvent) => {
      notifySSEClients(event);
    });
    
    // Iniciar el simulador automáticamente
    startSimulator();
    
    Bun.serve({
      port: 3000,
      fetch: app.fetch,
      idleTimeout: 255,
    });

    console.log('🚀 Servidor Hono escuchando en http://localhost:3000');
  } catch (error) {
    console.error('❌ Error en bootstrap:', error);
    console.log('⚠️ Iniciando servidor sin Kafka...');
    
    // Registrar la referencia de nodos en el simulador
    setNodesRef(nodes);
    
    // Registrar el notificador de SSE
    setSSENotifier((event: NetworkEvent) => {
      notifySSEClients(event);
    });
    
    // Iniciar el simulador automáticamente
    startSimulator();
    
    Bun.serve({
      port: 3000,
      fetch: app.fetch,
      idleTimeout: 255,
    });

    console.log('🚀 Servidor Hono escuchando en http://localhost:3000 (modo simulación)');
  }
}

bootstrap();