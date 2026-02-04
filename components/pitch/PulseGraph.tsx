"use client"

import { useRef, useEffect } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from "chart.js"
import { Line } from "react-chartjs-2"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
)

interface ChunkData {
  index: number
  start: number
  end: number
  engagementScore: number
  weakMoment: boolean
}

interface PulseGraphProps {
  chunks: ChunkData[]
  onPointClick: (index: number) => void
}

export function PulseGraph({ chunks, onPointClick }: PulseGraphProps) {
  const chartRef = useRef<ChartJS<"line">>(null)

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    const handleClick = (event: MouseEvent) => {
      const points = chart.getElementsAtEventForMode(
        event,
        "nearest",
        { intersect: true },
        false
      )
      if (points.length > 0) {
        onPointClick(points[0].index)
      }
    }

    chart.canvas.addEventListener("click", handleClick)
    return () => chart.canvas.removeEventListener("click", handleClick)
  }, [onPointClick])

  const labels = chunks.map((c) => `${Math.round(c.start / 1000)}s`)

  const data = {
    labels,
    datasets: [
      {
        label: "Engagement Score",
        data: chunks.map((c) => c.engagementScore),
        fill: true,
        borderColor: "oklch(0.7 0.15 180)",
        backgroundColor: "oklch(0.7 0.15 180 / 0.1)",
        tension: 0.4,
        pointRadius: chunks.map((c) => (c.weakMoment ? 8 : 4)),
        pointBackgroundColor: chunks.map((c) =>
          c.weakMoment ? "oklch(0.6 0.2 25)" : "oklch(0.7 0.15 180)"
        ),
        pointBorderColor: chunks.map((c) =>
          c.weakMoment ? "oklch(0.6 0.2 25)" : "oklch(0.7 0.15 180)"
        ),
        pointHoverRadius: 10,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "Engagement Pulse Over Time",
        color: "oklch(0.98 0 0)",
        font: { size: 16, weight: "bold" as const },
      },
      tooltip: {
        callbacks: {
          label: (context: { raw: number; dataIndex: number }) => {
            const chunk = chunks[context.dataIndex]
            const score = (context.raw * 100).toFixed(0)
            return chunk.weakMoment
              ? `${score}% (Weak Moment - Click for suggestions)`
              : `${score}%`
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Time (seconds)",
          color: "oklch(0.65 0 0)",
        },
        ticks: { color: "oklch(0.65 0 0)" },
        grid: { color: "oklch(0.28 0.01 260)" },
      },
      y: {
        min: 0,
        max: 1,
        title: {
          display: true,
          text: "Engagement Score",
          color: "oklch(0.65 0 0)",
        },
        ticks: {
          color: "oklch(0.65 0 0)",
          callback: (value: number | string) => `${Number(value) * 100}%`,
        },
        grid: { color: "oklch(0.28 0.01 260)" },
      },
    },
    onClick: () => {},
  }

  return (
    <div className="h-80 w-full rounded-lg border border-border bg-card p-4">
      <Line ref={chartRef} data={data} options={options} />
    </div>
  )
}
