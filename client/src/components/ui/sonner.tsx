import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"
import { useTheme } from "@/context/theme"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()
  return (
    <Sonner
      theme={theme}
      richColors
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-text": "var(--success)",
          "--success-bg": "color-mix(in srgb, var(--success) 10%, var(--popover))",
          "--error-text": "var(--danger)",
          "--error-bg": "color-mix(in srgb, var(--danger) 10%, var(--popover))",
          "--warning-text": "var(--warning)",
          "--warning-bg": "color-mix(in srgb, var(--warning) 12%, var(--popover))",
          "--info-text": "var(--info)",
          "--info-bg": "color-mix(in srgb, var(--info) 10%, var(--popover))",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
