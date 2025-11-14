import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// CVA: Define variantes del badge con estilos base y opcionales
const badgeVariants = cva(
  // Clases base:
  // - Layout: inline-flex centrado con gap entre elementos
  // - Forma: rounded-full (bordes completamente redondeados)
  // - Tamaño: px-2 py-0.5, text-xs
  // - SVG: size-3 (12px), sin eventos de puntero, gap de 4px
  // - Estados focus: ring de 3px con color ring/50
  // - Estados inválidos: ring y border destructivo
  // - Transiciones suaves en color y box-shadow
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        // Default: fondo primario, sin borde visible
        // [a&]: si el badge es un link (<a>), aplica hover
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        // Secondary: fondo secundario
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        // Destructive: rojo/error, ring especial en focus
        // dark:bg-destructive/60: más transparente en dark mode
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        // Outline: solo borde, fondo transparente
        // Hover con fondo accent
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false, // Si true, usa Slot de Radix (fusiona props con hijo)
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  // Si asChild=true, Slot permite que el badge tome la forma del componente hijo
  // Útil para hacer badges clickeables: <Badge asChild><a href="...">Text</a></Badge>
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"              // Identificador para CSS y selección
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }