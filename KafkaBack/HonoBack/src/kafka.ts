import { Kafka } from 'kafkajs';

export const kafka = new Kafka({
  brokers: ['localhost:9092'],
  clientId: 'network-monitor',
  connectionTimeout: 10000,
  requestTimeout: 30000,
});

export const producer = kafka.producer({
  maxInFlightRequests: 5,
  idempotent: true,
});

export async function sendEvent(topic: string, value: any) {
  try {
    // El producer ya debe estar conectado desde index.ts
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(value) }],
    });
    console.log(`📤 Evento enviado a [${topic}]:`, value.type);
  } catch (error) {
    console.error(`❌ Error enviando evento a ${topic}:`, error);
  }
}