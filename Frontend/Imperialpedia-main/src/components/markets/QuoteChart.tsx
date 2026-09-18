"use client";

import React from "react";
import { LightLineChart } from "@/components/charts/LightLineChart";
import type { QuoteChartPoint } from "@/lib/data/marketsLoader";

const Imperialpedia_RED = "#E31937";

export function QuoteChart({ data }: { data: QuoteChartPoint[] }) {
  return (
    <LightLineChart
      data={data}
      height={320}
      stroke={Imperialpedia_RED}
      gridStroke="rgba(255,255,255,0.1)"
      axisColor="rgba(255,255,255,0.5)"
      tooltipBg="#111"
      tooltipBorder="rgba(255,255,255,0.15)"
      tooltipText="#fff"
    />
  );
}
