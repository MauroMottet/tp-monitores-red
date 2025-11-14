"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

// ScrollArea: Contenedor de área de scroll personalizada usando Radix UI
function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      // relative: para posicionar absolutamente la scrollbar
      className={cn("relative", className)}
      {...props}
    >
      {/* Viewport: área visible que contiene el contenido scrolleable */}
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className={cn(
          // size-full: ocupa 100% width y height del contenedor
          // rounded-[inherit]: hereda border-radius del padre
          // focus-visible: ring de 3px al enfocar con teclado
          // outline-none: elimina outline nativo del navegador
          "focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {/* ScrollBar: barra de scroll personalizada (vertical por defecto) */}
      <ScrollBar />
      {/* Corner: esquina donde se encuentran scrollbars vertical y horizontal */}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

// ScrollBar: Barra de scroll personalizada con orientación configurable
function ScrollBar({
  className,
  orientation = "vertical", // vertical u horizontal
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        // flex: layout flexible
        // touch-none: desactiva interacciones táctiles nativas
        // p-px: padding de 1px
        // select-none: no seleccionable con cursor
        "flex touch-none p-px transition-colors select-none",
        // Vertical: altura completa, ancho 10px, borde izquierdo transparente
        orientation === "vertical" &&
          "h-full w-2.5 border-l border-l-transparent",
        // Horizontal: altura 10px, columna flexible, borde superior transparente
        orientation === "horizontal" &&
          "h-2.5 flex-col border-t border-t-transparent",
        className
      )}
      {...props}
    >
      {/* Thumb: el "pulgar" que se arrastra dentro de la scrollbar */}
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        // flex-1: ocupa espacio disponible proporcionalmente al contenido
        // rounded-full: completamente redondeado
        // bg-border: color de borde estándar
        className="bg-border relative flex-1 rounded-full"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}
export { ScrollArea, ScrollBar }