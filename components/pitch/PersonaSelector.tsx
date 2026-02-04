"use client"

import { Target, TrendingUp, Zap } from "lucide-react"

export type Persona = "angel" | "vc" | "product"

interface PersonaSelectorProps {
  selected: Persona
  onSelect: (persona: Persona) => void
}

const personas = [
  {
    id: "angel" as Persona,
    name: "Angel Investor",
    description: "Focused on vision, passion, and founder-market fit",
    icon: Target,
    color: "text-chart-4",
    bgColor: "bg-chart-4/20",
    borderColor: "border-chart-4",
  },
  {
    id: "vc" as Persona,
    name: "VC Partner",
    description: "Focused on unit economics, scalability, and market size",
    icon: TrendingUp,
    color: "text-chart-2",
    bgColor: "bg-chart-2/20",
    borderColor: "border-chart-2",
  },
  {
    id: "product" as Persona,
    name: "Product-Led",
    description: "Focused on product differentiation and user experience",
    icon: Zap,
    color: "text-primary",
    bgColor: "bg-primary/20",
    borderColor: "border-primary",
  },
]

export function PersonaSelector({ selected, onSelect }: PersonaSelectorProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {personas.map((persona) => {
        const Icon = persona.icon
        const isSelected = selected === persona.id
        return (
          <button
            key={persona.id}
            onClick={() => onSelect(persona.id)}
            className={`rounded-lg border-2 p-4 text-left transition-all ${
              isSelected
                ? `${persona.borderColor} bg-card`
                : "border-border bg-card hover:border-muted-foreground"
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${persona.bgColor}`}>
              <Icon className={`h-5 w-5 ${persona.color}`} />
            </div>
            <h3 className="mt-3 font-semibold text-card-foreground">{persona.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{persona.description}</p>
          </button>
        )
      })}
    </div>
  )
}
