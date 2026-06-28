"use client";
// ─── Price Chart Component ────────────────────────────────────────────────────
// Uses lightweight-charts (free, by TradingView team)
// For the full TradingView Charting Library with advanced features:
//   https://www.tradingview.com/charting-library-docs/latest/api/
//   (requires separate license + hosting the library files yourself)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";
import type { OHLCVBar } from "@/lib/birdeye";

interface Props {
  data: OHLCVBar[];
  positive: boolean;
}

export function PriceChart({ data, positive }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#13131a" },
        textColor: "#555",
      },
      grid: {
        vertLines: { color: "#1e1e28" },
        horzLines: { color: "#1e1e28" },
      },
      rightPriceScale: { borderColor: "#1e1e28" },
      timeScale: { borderColor: "#1e1e28" },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#34d399",
      downColor: "#f87171",
      borderUpColor: "#34d399",
      borderDownColor: "#f87171",
      wickUpColor: "#34d399",
      wickDownColor: "#f87171",
    });

    candleSeries.setData(
      data.map((bar) => ({
        time: bar.time as any,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
      }))
    );

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      }
    };
    window.addEventListener("resize", handleResize);
    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      chart.remove();
    };
  }, [data, positive]);

  return <div ref={containerRef} className="w-full h-full" />;
}
