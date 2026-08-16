import { Toaster as Sonner, type ToasterProps } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircleIcon, InformationCircleIcon, TriangleIcon, OctagonXIcon, LoadingIcon } from "@hugeicons/core-free-icons"
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
          <HugeiconsIcon icon={CheckmarkCircleIcon} className="size-4" />
        ),
        info: (
          <HugeiconsIcon icon={InformationCircleIcon} className="size-4" />
        ),
        warning: (
          <HugeiconsIcon icon={TriangleIcon} className="size-4" />
        ),
        error: (
          <HugeiconsIcon icon={OctagonXIcon} className="size-4" />
        ),
        loading: (
          <HugeiconsIcon icon={LoadingIcon} className="size-4 animate-spin" />
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
