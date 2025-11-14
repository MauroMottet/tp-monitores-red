'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { EventLogEntry } from '@/lib/types';
import {
  AlertTriangle,
  Info,
  XCircle,
  Activity,
  Wifi,
  Network,
} from 'lucide-react';

interface EventLogProps {
  events: EventLogEntry[];
}

export function EventLog({ events }: EventLogProps) {
  // Retorna ícono según tipo de evento (cambio de estado, latencia, conexión, alarma)
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'NODE_STATUS_CHANGE':
        return <Wifi className="h-4 w-4" />;
      case 'LATENCY_UPDATE':
        return <Activity className="h-4 w-4" />;
      case 'CONNECTION_CHANGE':
        return <Network className="h-4 w-4" />;
      case 'ALARM':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  // Clases Tailwind para color de fondo, texto y borde según severidad
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-700';
    }
  };

  // Badge visual con ícono y texto según severidad
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <Badge variant="destructive" className="text-xs">
            <XCircle className="h-3 w-3 mr-1" />
            Crítico
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="secondary" className="text-xs bg-yellow-500 text-white hover:bg-yellow-600">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Advertencia
          </Badge>
        );
      case 'info':
        return (
          <Badge variant="outline" className="text-xs">
            <Info className="h-3 w-3 mr-1" />
            Info
          </Badge>
        );
      default:
        return null;
    }
  };

  // Convierte timestamp ISO a formato HH:MM:SS
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (error) {
      return 'N/A';
    }
  };

  // Traduce tipos de evento a texto legible en español
  const formatEventType = (type: string) => {
    switch (type) {
      case 'NODE_STATUS_CHANGE':
        return 'Cambio de Estado';
      case 'LATENCY_UPDATE':
        return 'Actualización de Latencia';
      case 'CONNECTION_CHANGE':
        return 'Cambio de Conexiones';
      case 'ALARM':
        return 'Alarma';
      default:
        return type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Log de Eventos</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Últimos {events.length} eventos del sistema
            </p>
          </div>
          {/* Contador de eventos en badge */}
          {events.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {events.length} eventos
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* ScrollArea para manejar overflow con altura fija de 500px */}
        <ScrollArea className="h-[500px] pr-4">
          {/* Estado vacío: sin eventos */}
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                No hay eventos registrados aún
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Los eventos aparecerán aquí en tiempo real
              </p>
            </div>
          ) : (
            // Lista de eventos
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  // Borde lateral grueso (4px) con color según severidad
                  className={`p-4 rounded-lg border-l-4 transition-all hover:shadow-md ${getSeverityColor(
                    event.severity
                  )}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Ícono del tipo de evento */}
                      <div className="mt-0.5">{getEventIcon(event.type)}</div>

                      {/* Contenido principal del evento */}
                      <div className="flex-1 min-w-0">
                        {/* Línea 1: Timestamp + nombre del nodo */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground">
                            {formatTime(event.timestamp)}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs font-semibold">
                            {event.nodeName}
                          </span>
                        </div>
                        {/* Línea 2: Tipo de evento formateado */}
                        <p className="text-sm font-medium mb-1">
                          {formatEventType(event.type)}
                        </p>
                        {/* Línea 3: Descripción detallada */}
                        <p className="text-sm">{event.description}</p>
                      </div>
                    </div>

                    {/* Badge de severidad a la derecha */}
                    <div className="flex-shrink-0">
                      {getSeverityBadge(event.severity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}