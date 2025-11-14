import { Kafka } from 'kafkajs';

// Configuración del cliente Kafka con broker local y timeouts personalizados
export const kafka = new Kafka({
  brokers: ['localhost:9092'], // Dirección del servidor Kafka
  clientId: 'network-monitor', // Identificador único de esta aplicación
  connectionTimeout: 10000, // Timeout de conexión: 10 segundos
  requestTimeout: 30000, // Timeout de peticiones: 30 segundos
});

// Configuración del producer con opciones de confiabilidad
export const producer = kafka.producer({
  maxInFlightRequests: 5, // Máximo de peticiones simultáneas sin respuesta
  idempotent: true, // Garantiza que los mensajes no se dupliquen
});

// Envía un evento a un topic específico de Kafka
export async function sendEvent(topic: string, value: any) {
  try {
    // Nota: el producer debe estar conectado previamente en index.ts
    await producer.send({
      topic, // Topic destino del mensaje
      messages: [{ value: JSON.stringify(value) }], // Serializa el payload a JSON
    });
    console.log(`📤 Evento enviado a [${topic}]:`, value.type);
  } catch (error) {
    console.error(`❌ Error enviando evento a ${topic}:`, error);
  }
}