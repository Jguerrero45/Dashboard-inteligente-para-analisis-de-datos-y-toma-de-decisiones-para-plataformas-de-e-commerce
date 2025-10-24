"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const trafficData = [
  { hora: "00:00", organico: 120, directo: 80, redes: 150, pago: 90 },
  { hora: "04:00", organico: 80, directo: 50, redes: 100, pago: 60 },
  { hora: "08:00", organico: 250, directo: 180, redes: 280, pago: 200 },
  { hora: "12:00", organico: 380, directo: 280, redes: 420, pago: 320 },
  { hora: "16:00", organico: 420, directo: 320, redes: 480, pago: 380 },
  { hora: "20:00", organico: 350, directo: 250, redes: 400, pago: 300 },
]

export function TrafficChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fuentes de Tráfico</CardTitle>
        <CardDescription>Análisis de visitas por canal durante el día</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            organico: {
              label: "Orgánico",
              color: "hsl(var(--chart-1))",
            },
            directo: {
              label: "Directo",
              color: "hsl(var(--chart-2))",
            },
            redes: {
              label: "Redes Sociales",
              color: "hsl(var(--chart-3))",
            },
            pago: {
              label: "Publicidad",
              color: "hsl(var(--chart-4))",
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trafficData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hora" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line type="monotone" dataKey="organico" stroke="var(--color-organico)" strokeWidth={2} name="Orgánico" />
              <Line type="monotone" dataKey="directo" stroke="var(--color-directo)" strokeWidth={2} name="Directo" />
              <Line type="monotone" dataKey="redes" stroke="var(--color-redes)" strokeWidth={2} name="Redes Sociales" />
              <Line type="monotone" dataKey="pago" stroke="var(--color-pago)" strokeWidth={2} name="Publicidad" />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
