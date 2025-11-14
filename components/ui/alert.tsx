import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// CVA: Define variantes del alert con clases base y opcionales
const alertVariants = cva(
  // Clases base: grid condicional según presencia de SVG (ícono)
  // Sin ícono: grid-cols-[0_1fr] (columna invisible)
  // Con ícono: grid-cols-[calc(var(--spacing)*4)_1fr] (columna de ~16px)
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        // Variante por defecto: colores de card
        default: "bg-card text-card-foreground",
        // Variante destructiva: texto rojo, descripción con 90% opacidad
        destructive:
          "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Componente principal Alert: contenedor con role="alert" para accesibilidad
function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"              // Identificador para CSS y selección
      role="alert"                   // ARIA role para lectores de pantalla
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

// AlertTitle: título en negrita, segunda columna del grid
function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        // col-start-2: empieza después del ícono
        // line-clamp-1: trunca con ... si excede 1 línea
        // min-h-4: altura mínima de 16px
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className
      )}
      {...props}
    />
  )
}

// AlertDescription: descripción en texto secundario, segunda columna
function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        // text-muted-foreground: color secundario
        // col-start-2: alineado con título
        // [&_p]:leading-relaxed: párrafos con interlineado mayor
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }