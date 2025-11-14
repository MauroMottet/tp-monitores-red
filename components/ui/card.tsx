import * as React from "react"

import { cn } from "@/lib/utils"

// Card: Contenedor principal con bordes redondeados, sombra y padding vertical
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        // flex-col: layout vertical con gap de 24px entre secciones
        // rounded-xl: bordes muy redondeados (12px)
        // shadow-sm: sombra sutil
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

// CardHeader: Header con grid para título, descripción y acción opcional
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        // @container/card-header: contenedor de consultas para responsive interno
        // grid-rows-[auto_auto]: 2 filas de altura automática
        // has-data-[slot=card-action]: si tiene CardAction, crea 2 columnas [1fr_auto]
        // [.border-b]: si el card tiene clase border-b, agrega pb-6
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

// CardTitle: Título del card en negrita, sin line-height extra
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      // leading-none: line-height ajustado (1) para eliminar espacio extra
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

// CardDescription: Texto descriptivo secundario debajo del título
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      // text-muted-foreground: color secundario/grisáceo
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

// CardAction: Botón/acción posicionado en esquina superior derecha del header
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        // col-start-2: segunda columna del grid
        // row-span-2: ocupa ambas filas (título + descripción)
        // row-start-1: comienza en primera fila
        // self-start: alineado al top, justify-self-end: alineado a la derecha
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

// CardContent: Contenedor principal del contenido del card
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      // px-6: padding horizontal igual al resto de secciones
      className={cn("px-6", className)}
      {...props}
    />
  )
}

// CardFooter: Pie del card, típicamente para acciones o info adicional
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        // flex items-center: layout horizontal centrado
        // [.border-t]: si el card tiene clase border-t, agrega pt-6 para separar
        "flex items-center px-6 [.border-t]:pt-6",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}