import React, { useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useGlobalStats } from "@/hooks/use-global-stats";
import { useOrganisationCreatedEvents, useAttendanceRecordedEvents } from "@/hooks/use-attendance-events";
import { useQuery } from "@tanstack/react-query";
import { useSuiClient } from "@mysten/dapp-kit";
import { CONFIG } from "@/config";
import { Skeleton } from "@/components/ui/skeleton";

// Register Chart.js plugins only once
let chartRegistered = false;
if (!chartRegistered) {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
  );
  chartRegistered = true;
}

// Plugin to create gradient border for the main line
const gradientPlugin = {
  id: 'gradientBorder',
  beforeDraw: (chart: any) => {
    const ctx = chart.ctx;
    const chartArea = chart.chartArea;
    const dataset = chart.data.datasets[0];
    
    if (!chartArea || !dataset) return;
    
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, "rgba(107, 141, 227, 1)"); // #6B8DE3
    gradient.addColorStop(1, "rgba(125, 28, 141, 1)"); // #7D1C8D
    
    // Store gradient for use in dataset
    dataset.borderColor = gradient;
  }
};

export default React.memo(function AnalyticsChart() {
  const { stats, isLoading } = useGlobalStats();
  const client = useSuiClient();
  const [timeSeriesData, setTimeSeriesData] = useState<{
    labels: string[];
    organisations: number[];
    students: number[];
    records: number[];
  }>({
    labels: [],
    organisations: [],
    students: [],
    records: [],
  });

  // Fetch attendance events for time series
  const { data: attendanceEvents } = useQuery({
    queryKey: ["events", "AttendanceRecordedEvent", "analytics", CONFIG.PACKAGE_ID],
    queryFn: async () => {
      if (!CONFIG.PACKAGE_ID) return [];
      const res = await client.queryEvents({
        query: { MoveEventType: `${CONFIG.PACKAGE_ID}::events::AttendanceRecordedEvent` },
        limit: 500,
        order: "descending",
      });
      return (res.data || []).map((e) => ({
        ...(e.parsedJson as any),
        timestamp: Number((e.parsedJson as any).timestamp),
      }));
    },
    enabled: !!CONFIG.PACKAGE_ID,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  // Fetch organisation events for time series
  const { data: orgEvents } = useOrganisationCreatedEvents(500);

  // Fetch student events for time series
  const { data: studentEvents } = useQuery({
    queryKey: ["events", "StudentRegisteredEvent", "analytics", CONFIG.PACKAGE_ID],
    queryFn: async () => {
      if (!CONFIG.PACKAGE_ID) return [];
      const res = await client.queryEvents({
        query: { MoveEventType: `${CONFIG.PACKAGE_ID}::events::StudentRegisteredEvent` },
        limit: 500,
        order: "descending",
      });
      return (res.data || []).map((e) => ({
        ...(e.parsedJson as any),
        timestamp: Number(e.timestampMs) || Date.now(),
      }));
    },
    enabled: !!CONFIG.PACKAGE_ID,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  // Process data into time series (last 7 days)
  useEffect(() => {
    if (isLoading || !attendanceEvents || !orgEvents || !studentEvents) return;

    const now = Date.now();
    const days = 7;
    const labels: string[] = [];
    const orgCounts: number[] = [];
    const studentCounts: number[] = [];
    const recordCounts: number[] = [];

    // Initialize arrays for each day
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      labels.push(date.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
      orgCounts.push(0);
      studentCounts.push(0);
      recordCounts.push(0);
    }

    // Count organisations per day (cumulative)
    orgEvents.forEach((event: any) => {
      if (event.timestampMs) {
        const eventDate = new Date(Number(event.timestampMs));
        const daysAgo = Math.floor((now - eventDate.getTime()) / (24 * 60 * 60 * 1000));
        if (daysAgo >= 0 && daysAgo < days) {
          // Convert daysAgo to array index (labels are in reverse: oldest=0, today=days-1)
          const startIndex = (days - 1) - daysAgo;
          // Cumulative count: from this day forward
          for (let i = startIndex; i < days; i++) {
            orgCounts[i]++;
          }
        }
      }
    });

    // Count students per day (cumulative)
    const studentMap = new Map<number, Set<string>>();
    for (let i = 0; i < days; i++) {
      studentMap.set(i, new Set());
    }

    studentEvents.forEach((event: any) => {
      const eventTimestamp = event.timestamp || event.timestampMs || Date.now();
      const eventDate = new Date(Number(eventTimestamp));
      const daysAgo = Math.floor((now - eventDate.getTime()) / (24 * 60 * 60 * 1000));
      if (daysAgo >= 0 && daysAgo < days) {
        // Convert daysAgo to array index (labels are in reverse: oldest=0, today=days-1)
        const startIndex = (days - 1) - daysAgo;
        // Cumulative count: from this day forward
        for (let i = startIndex; i < days; i++) {
          studentMap.get(i)?.add(event.student);
        }
      }
    });

    for (let i = 0; i < days; i++) {
      studentCounts[i] = studentMap.get(i)?.size || 0;
    }

    // Count attendance records per day
    attendanceEvents.forEach((event: any) => {
      if (event.timestamp) {
        const eventDate = new Date(Number(event.timestamp));
        const daysAgo = Math.floor((now - eventDate.getTime()) / (24 * 60 * 60 * 1000));
        if (daysAgo >= 0 && daysAgo < days) {
          // Convert daysAgo to array index (labels are in reverse: oldest=0, today=days-1)
          const index = (days - 1) - daysAgo;
          recordCounts[index]++;
        }
      }
    });

    setTimeSeriesData({
      labels,
      organisations: orgCounts,
      students: studentCounts,
      records: recordCounts,
    });
  }, [attendanceEvents, orgEvents, studentEvents, isLoading]);

  const chartData = {
    labels: timeSeriesData.labels,
    datasets: [
      {
        label: "Organisations",
        data: timeSeriesData.organisations,
        borderColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return "rgba(107, 141, 227, 1)";
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, "rgba(107, 141, 227, 1)"); // #6B8DE3
          gradient.addColorStop(1, "rgba(125, 28, 141, 1)"); // #7D1C8D
          return gradient;
        },
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return "rgba(107, 141, 227, 0.1)";
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, "rgba(107, 141, 227, 0.3)"); // #6B8DE3
          gradient.addColorStop(1, "rgba(125, 28, 141, 0.1)"); // #7D1C8D
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 4,
        pointRadius: 0,
      },
      {
        label: "Students",
        data: timeSeriesData.students,
        borderColor: "rgba(107, 141, 227, 0.6)",
        backgroundColor: "rgba(107, 141, 227, 0.05)",
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        borderDash: [8, 8],
        pointRadius: 0,
      },
      {
        label: "Attendance Records",
        data: timeSeriesData.records,
        borderColor: "rgba(37, 37, 37, 0.8)", // #252525
        backgroundColor: "rgba(37, 37, 37, 0.1)",
        fill: false,
        tension: 0.4,
        borderWidth: 3,
        borderDash: [8, 8],
        pointRadius: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(29, 29, 29, 0.95)", // #1d1d1d
        titleColor: "rgb(255, 255, 255)",
        bodyColor: "rgb(255, 255, 255)",
        borderColor: "rgba(37, 37, 37, 0.5)", // #252525
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        cornerRadius: 8,
        titleFont: {
          size: 14,
          weight: "bold" as const,
        },
        bodyFont: {
          size: 12,
        },
        callbacks: {
          title: (context: any) => {
            return context[0].label;
          },
          label: (context: any) => {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toLocaleString();
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(37, 37, 37, 1)", // #252525
          lineWidth: 6,
          drawBorder: false,
        },
        ticks: {
          color: "rgba(156, 163, 175, 0.6)", // gray-400
          font: {
            size: 11,
          },
          padding: 10,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(37, 37, 37, 1)", // #252525
          lineWidth: 6,
          drawBorder: false,
        },
        ticks: {
          color: "rgba(156, 163, 175, 0.6)", // gray-400
          font: {
            size: 11,
          },
          padding: 10,
          callback: function (value: any) {
            if (Number(value) >= 1000) {
              return (Number(value) / 1000).toFixed(1) + 'k';
            }
            return value;
          },
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="rounded-lg p-4" style={{ height: '400px' }}>
        <div className="mb-4 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-[calc(100%-80px)] w-full" />
      </div>
    );
  }

  return (
    <div className="rounded-lg p-4" style={{ height: '400px' }}>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-white font-bold text-base">System Analytics</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-gray-400 text-xs">Last 7 Days</div>
          </div>
        </div>
        <div className="text-gray-400 text-sm mt-1 ml-0.5">
          {timeSeriesData.labels[0]} - {timeSeriesData.labels[timeSeriesData.labels.length - 1]}
        </div>
      </div>
      <div className="h-[calc(100%-80px)]">
        <Line data={chartData} options={chartOptions} plugins={[gradientPlugin]} />
      </div>
    </div>
  );
});

