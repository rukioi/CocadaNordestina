import * as React from "react"
import { ResponsiveContainer } from "recharts"

import { cn } from "@/lib/utils"

// Interfaces para tipagem correta dos charts
export interface ChartConfig {
  [key: string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
    color?: string
    theme?: Record<string, string>
  }
}

export interface ChartTooltipPayload {
  value: number | string
  name: string
  color: string
  dataKey: string
  payload: Record<string, unknown>
}

export interface ChartTooltipProps {
  active?: boolean
  payload?: ChartTooltipPayload[]
  label?: string | number
  labelKey?: string
  nameKey?: string
  indicator?: "line" | "dot" | "dashed"
  hideLabel?: boolean
  hideIndicator?: boolean
  className?: string
}

export interface ChartLegendPayload {
  value: string
  type: string
  id: string
  color: string
}

export interface ChartLegendProps {
  payload?: ChartLegendPayload[]
  verticalAlign?: "top" | "middle" | "bottom"
  className?: string
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<typeof ResponsiveContainer>["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <div
      data-chart={chartId}
      ref={ref}
      className={cn(
        "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
        className
      )}
      {...props}
    >
      <ChartStyle id={chartId} config={config} />
      <ResponsiveContainer>{children}</ResponsiveContainer>
    </div>
  )
})
ChartContainer.displayName = "ChartContainer"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, configItem]) => configItem.theme || configItem.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(config)
          .filter(([_, configItem]) => configItem.theme || configItem.color)
          .map(([key, configItem]) => {
            const color = configItem.color || `hsl(var(--chart-${key}))`
            return `
              [data-chart="${id}"] .recharts-layer .recharts-area.recharts-area-${key} {
                fill: ${color};
                fill-opacity: 0.4;
              }
              [data-chart="${id}"] .recharts-layer .recharts-line.recharts-line-${key} {
                stroke: ${color};
              }
              [data-chart="${id}"] .recharts-layer .recharts-bar.recharts-bar-${key} {
                fill: ${color};
              }
            `
          })
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  ChartTooltipProps
>(({ active, payload, label, indicator = "dot", hideLabel = false, hideIndicator = false, className, ...props }, ref) => {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}
      {...props}
    >
      {!hideLabel && label && (
        <div className="font-medium text-foreground">{label}</div>
      )}
      <div className="grid gap-1.5">
        {payload.map((item: ChartTooltipPayload, index: number) => (
          <div
            key={`${item.dataKey}-${index}`}
            className="flex w-full items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground"
          >
            {!hideIndicator && (
              <div
                className={cn(
                  "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                  {
                    "h-2.5 w-2.5": indicator === "dot",
                    "w-1": indicator === "line",
                    "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
                  }
                )}
                style={
                  {
                    "--color-bg": item.color,
                    "--color-border": item.color,
                  } as React.CSSProperties
                }
              />
            )}
            <div className="flex flex-1 justify-between leading-none">
              <div className="grid gap-1.5">
                <span className="text-muted-foreground">{item.name}</span>
              </div>
              <span className="font-mono font-medium tabular-nums text-foreground">
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})
ChartTooltip.displayName = "ChartTooltip"

const ChartLegend = React.forwardRef<
  HTMLDivElement,
  ChartLegendProps
>(({ payload, verticalAlign = "bottom", className, ...props }, ref) => {
  if (!payload?.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center gap-4", className)}
      {...props}
    >
      {payload.map((item: ChartLegendPayload) => (
        <div key={item.value} className="flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground">
          <div
            className="h-2 w-2 shrink-0 rounded-[2px]"
            style={{
              backgroundColor: item.color,
            }}
          />
          <span className="text-muted-foreground">{item.value}</span>
        </div>
      ))}
    </div>
  )
})
ChartLegend.displayName = "ChartLegend"

export {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartStyle,
}