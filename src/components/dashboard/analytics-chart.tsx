import { useEffect, useRef } from "react";
import { UserStats } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsChartProps {
  stats: UserStats;
}

// Using Chart.js directly since we're using CDN
declare global {
  interface Window {
    Chart: any;
  }
}

export default function AnalyticsChart({ stats }: AnalyticsChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Add Chart.js via CDN if not already loaded
    if (!window.Chart) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/chart.js";
      script.async = true;
      script.onload = initChart;
      document.body.appendChild(script);
    } else {
      initChart();
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (chartInstanceRef.current && stats) {
      updateChart();
    }
  }, [stats]);

  function initChart() {
    if (!chartRef.current) return;

    try {
      const ctx = chartRef.current.getContext("2d");
      if (!ctx) return;

      chartInstanceRef.current = new window.Chart(ctx, {
        type: "line",
        data: {
          labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"],
          datasets: [
            {
              label: "Account Balance",
              data: [0, 0, 0, 0, 0, 0, stats.accountBalance],
              borderColor: "hsl(222.2, 47.4%, 11.2%)",
              backgroundColor: "rgba(24, 24, 27, 0.1)",
              tension: 0.4,
              fill: true,
            },
            {
              label: "Total Profit",
              data: [0, 0, 0, 0, 0, 0, stats.totalProfit],
              borderColor: "#10B981",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top",
            },
            tooltip: {
              mode: "index",
              intersect: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Amount (KSh)",
              },
            },
          },
        },
      });
    } catch (error) {
      toast({
        title: "Failed to initialize chart",
        description: "Chart.js could not be loaded properly.",
        variant: "destructive",
      });
    }
  }

  function updateChart() {
    if (!chartInstanceRef.current) return;

    // Generate some simulated growth data based on current stats
    const accountBalanceData = [
      0,
      0,
      Math.round(stats.accountBalance * 0.2),
      Math.round(stats.accountBalance * 0.4),
      Math.round(stats.accountBalance * 0.6),
      Math.round(stats.accountBalance * 0.8),
      stats.accountBalance,
    ];

    const totalProfitData = [
      0,
      Math.round(stats.totalProfit * 0.1),
      Math.round(stats.totalProfit * 0.25),
      Math.round(stats.totalProfit * 0.45),
      Math.round(stats.totalProfit * 0.65),
      Math.round(stats.totalProfit * 0.85),
      stats.totalProfit,
    ];

    chartInstanceRef.current.data.datasets[0].data = accountBalanceData;
    chartInstanceRef.current.data.datasets[1].data = totalProfitData;
    chartInstanceRef.current.update();
  }

  return <canvas ref={chartRef} className="h-full w-full"></canvas>;
}
