"use client";

import { Skeleton } from "@reelo/ui/components";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function GamesFunnelChart(props: {
  isLoading: boolean;
  attempts: number;
  won: number;
  drawPending: number;
  rateLimited: number;
}) {
  const data = [
    { name: "Attempts", value: props.attempts },
    { name: "Won", value: props.won },
    { name: "Draw pending", value: props.drawPending },
    { name: "Rate limited", value: props.rateLimited },
  ];
  return (
    <div className="h-[280px] w-full">
      {props.isLoading ? (
        <Skeleton className="h-full w-full" />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
