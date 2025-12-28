import { useMemo, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { ChevronLeft, Printer, Download, Calendar as CalendarIcon, X, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { useAttendanceRecordedEvents, useStudentRegisteredEvents } from "@/hooks/use-attendance-events";
import { useOrganisationObject } from "@/hooks/use-attendance-objects";
import { Skeleton } from "@/components/ui/skeleton";
import PageBackground from "@/components/PageBackground";
import ErrorBoundary from "@/components/ErrorBoundary";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalyticsPage() {
  const { id: orgId } = useParams();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  
  const { data: orgData, isLoading: orgLoading } = useOrganisationObject(orgId);
  const { data: attendanceEvents } = useAttendanceRecordedEvents(orgId, 1000);
  const { data: studentEvents } = useStudentRegisteredEvents(orgId, 500);
  
  const orgName = orgData?.fields?.name ?? orgId ?? "Organisation";
  
  // Date range state
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Filter attendance events by date range
  const filteredAttendanceEvents = useMemo(() => {
    if (!attendanceEvents) return [];
    
    if (!startDate && !endDate) {
      return attendanceEvents;
    }

    return attendanceEvents.filter((event) => {
      const eventDate = new Date(Number(event.timestamp));
      const eventTime = eventDate.getTime();
      
      const startTime = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : 0;
      const endTime = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Number.MAX_SAFE_INTEGER;
      
      return eventTime >= startTime && eventTime <= endTime;
    });
  }, [attendanceEvents, startDate, endDate]);

  // Calculate attendance count per student (using filtered events)
  const studentAttendanceCounts = useMemo(() => {
    const counts = new Map<string, { name: string; count: number }>();
    
    // Initialize with student names
    (studentEvents ?? []).forEach((student) => {
      counts.set(student.student, {
        name: student.name,
        count: 0,
      });
    });

    // Count attendance records per student (using filtered events)
    filteredAttendanceEvents.forEach((event) => {
      const existing = counts.get(event.student);
      if (existing) {
        existing.count++;
      } else {
        // Student not found in events, use address
        counts.set(event.student, {
          name: event.student.slice(0, 8) + "...",
          count: 1,
        });
      }
    });

    return Array.from(counts.values())
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [filteredAttendanceEvents, studentEvents]);

  // Get top 10 highest and lowest for charts
  const topStudents = useMemo(() => {
    return studentAttendanceCounts.slice(0, 10);
  }, [studentAttendanceCounts]);

  const bottomStudents = useMemo(() => {
    const sorted = [...studentAttendanceCounts].sort((a, b) => a.count - b.count);
    return sorted.slice(0, 10).reverse(); // Reverse to show lowest to highest
  }, [studentAttendanceCounts]);

  // Split all students into top and bottom for printing
  const { topStudentsForPrint, bottomStudentsForPrint } = useMemo(() => {
    const sorted = [...studentAttendanceCounts].sort((a, b) => b.count - a.count);
    const midPoint = Math.ceil(sorted.length / 2);
    
    return {
      topStudentsForPrint: sorted.slice(0, midPoint), // Top half (highest to lowest)
      bottomStudentsForPrint: sorted.slice(midPoint).reverse(), // Bottom half (lowest to highest)
    };
  }, [studentAttendanceCounts]);

  // Calculate overall attendance percentage for gauge chart
  const overallAttendancePercentage = useMemo(() => {
    if (studentAttendanceCounts.length === 0 || filteredAttendanceEvents.length === 0) return 0;
    
    // Calculate average attendance per student
    const totalAttendance = studentAttendanceCounts.reduce((sum, s) => sum + s.count, 0);
    const averageAttendance = totalAttendance / studentAttendanceCounts.length;
    
    // Find the maximum attendance count to use as baseline (100%)
    const maxAttendance = Math.max(...studentAttendanceCounts.map(s => s.count), 1);
    
    // Calculate percentage: (average / max) * 100
    // This shows how close the average is to the best-performing student
    // Cap at 100% and ensure minimum of 0%
    const percentage = Math.min(100, Math.max(0, Math.round((averageAttendance / maxAttendance) * 100)));
    
    return percentage;
  }, [studentAttendanceCounts, filteredAttendanceEvents]);

  // Helper function to get gauge color based on percentage
  function getGaugeColor(percentage: number): string {
    if (percentage >= 80) return "#22c55e"; // green
    if (percentage >= 60) return "#eab308"; // yellow
    if (percentage >= 40) return "#f97316"; // orange
    return "#ef4444"; // red
  }

  // Get status text and color
  const attendanceStatus = useMemo(() => {
    const percentage = overallAttendancePercentage;
    if (percentage >= 80) return { text: "Excellent", color: "text-green-500" };
    if (percentage >= 60) return { text: "Good", color: "text-yellow-500" };
    if (percentage >= 40) return { text: "Fair", color: "text-orange-500" };
    return { text: "Needs Improvement", color: "text-red-500" };
  }, [overallAttendancePercentage]);

  // Gauge chart data (semi-circular gauge)
  const gaugeData = useMemo(() => {
    const percentage = overallAttendancePercentage;
    return [
      { name: "Attendance", value: percentage, fill: getGaugeColor(percentage) },
      { name: "Remaining", value: 100 - percentage, fill: "transparent" }
    ];
  }, [overallAttendancePercentage]);

  // Helper function for better name truncation (middle truncation for long names)
  const truncateName = (name: string, maxLength: number = 20): string => {
    if (name.length <= maxLength) return name;
    const start = Math.floor((maxLength - 3) / 2);
    const end = name.length - Math.ceil((maxLength - 3) / 2);
    return `${name.slice(0, start)}...${name.slice(end)}`;
  };

  // Chart data with improved labels and tooltip support
  const chartData = useMemo(() => {
    if (topStudents.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    return {
      labels: topStudents.map((s) => truncateName(s.name, 18)),
      datasets: [
        {
          label: "Attendance Count",
          data: topStudents.map((s) => s.count),
          backgroundColor: "rgba(107, 141, 227, 0.8)", // #6B8DE3
          borderColor: "rgba(107, 141, 227, 1)",
          borderWidth: 1,
          barThickness: 'flex' as const,
          maxBarThickness: 50,
          categoryPercentage: 0.7,
          barPercentage: 0.8,
        },
      ],
    };
  }, [topStudents]);

  const bottomChartData = useMemo(() => {
    if (bottomStudents.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    return {
      labels: bottomStudents.map((s) => truncateName(s.name, 18)),
      datasets: [
        {
          label: "Attendance Count",
          data: bottomStudents.map((s) => s.count),
          backgroundColor: "rgba(251, 146, 60, 0.8)", // orange
          borderColor: "rgba(251, 146, 60, 1)",
          borderWidth: 1,
          barThickness: 'flex' as const,
          maxBarThickness: 50,
          categoryPercentage: 0.7,
          barPercentage: 0.8,
        },
      ],
    };
  }, [bottomStudents]);

  // Chart options for top students chart
  const topChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(29, 29, 29, 0.95)",
        titleColor: "rgb(255, 255, 255)",
        bodyColor: "rgb(255, 255, 255)",
        borderColor: "rgba(37, 37, 37, 0.5)",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          title: (context: any) => {
            // Show full student name in tooltip
            const index = context[0].dataIndex;
            return topStudents[index]?.name || context[0].label;
          },
          label: (context: any) => {
            return `Attendance: ${context.parsed.y}`;
          },
        },
      },
    },
    backgroundColor: "transparent",
    scales: {
      x: {
        grid: {
          color: "rgba(37, 37, 37, 1)",
          lineWidth: 1,
          drawBorder: false,
        },
        ticks: {
          color: "rgba(156, 163, 175, 0.6)",
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(37, 37, 37, 1)",
          lineWidth: 1,
          drawBorder: false,
        },
        ticks: {
          color: "rgba(156, 163, 175, 0.6)",
          font: {
            size: 11,
          },
          stepSize: 1,
        },
      },
    },
  }), [topStudents]);

  // Chart options for bottom students chart
  const bottomChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(29, 29, 29, 0.95)",
        titleColor: "rgb(255, 255, 255)",
        bodyColor: "rgb(255, 255, 255)",
        borderColor: "rgba(37, 37, 37, 0.5)",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          title: (context: any) => {
            // Show full student name in tooltip
            const index = context[0].dataIndex;
            return bottomStudents[index]?.name || context[0].label;
          },
          label: (context: any) => {
            return `Attendance: ${context.parsed.y}`;
          },
        },
      },
    },
    backgroundColor: "transparent",
    scales: {
      x: {
        grid: {
          color: "rgba(37, 37, 37, 1)",
          lineWidth: 1,
          drawBorder: false,
        },
        ticks: {
          color: "rgba(156, 163, 175, 0.6)",
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(37, 37, 37, 1)",
          lineWidth: 1,
          drawBorder: false,
        },
        ticks: {
          color: "rgba(156, 163, 175, 0.6)",
          font: {
            size: 11,
          },
          stepSize: 1,
        },
      },
    },
  }), [bottomStudents]);

  const handlePrint = useCallback(() => {
    if (!printRef.current) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Clone the content and modify it for printing
    const contentClone = printRef.current.cloneNode(true) as HTMLElement;
    
    // Show print-only elements, hide no-print elements
    const printOnlyElements = contentClone.querySelectorAll('.print-only');
    const noPrintElements = contentClone.querySelectorAll('.no-print');
    const printHeader = contentClone.querySelector('.print-header');
    const printFooter = contentClone.querySelector('.print-footer');
    
    if (printHeader) printHeader.setAttribute('style', 'display: block !important;');
    if (printFooter) printFooter.setAttribute('style', 'display: block !important;');
    printOnlyElements.forEach(el => el.setAttribute('style', 'display: block !important;'));
    noPrintElements.forEach(el => el.setAttribute('style', 'display: none !important;'));

    const printStyles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; background: white; color: black; }
        .print-header { margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 15px; text-align: center; }
        .print-header h1 { font-size: 28px; font-weight: bold; margin-bottom: 8px; }
        .print-header p { font-size: 14px; color: #666; }
        .print-section { margin-bottom: 30px; page-break-inside: avoid; }
        .print-section-title { font-size: 20px; font-weight: bold; margin-bottom: 15px; margin-top: 30px; border-bottom: 2px solid #000; padding-bottom: 8px; page-break-after: avoid; }
        .print-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; page-break-inside: auto; }
        .print-table thead { display: table-header-group; }
        .print-table tbody { display: table-row-group; }
        .print-table tr { page-break-inside: avoid; page-break-after: auto; }
        .print-table th, .print-table td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
        .print-table th { background-color: #f2f2f2; font-weight: bold; }
        .print-table td { background-color: white; }
        .print-footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ccc; font-size: 12px; color: #666; }
        .no-print + div { margin-top: 0 !important; }
        @media print {
          .no-print + div { margin-top: 0 !important; }
        }
        .no-print { display: none !important; }
        .print-only { display: block !important; }
        canvas { display: none !important; }
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .print-section { page-break-inside: avoid; }
          .print-table { page-break-inside: auto; }
          .print-table thead { display: table-header-group; }
          .print-table tbody tr { page-break-inside: avoid; }
        }
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Analytics Report - ${orgName}</title>
          ${printStyles}
        </head>
        <body>
          ${contentClone.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  }, [orgName]);

  const handleDownload = useCallback(() => {
    const data = {
      organisation: orgName,
      generatedAt: new Date().toISOString(),
      totalStudents: studentAttendanceCounts.length,
      totalRecords: filteredAttendanceEvents.length,
      dateRange: {
        start: startDate ? format(startDate, "yyyy-MM-dd") : null,
        end: endDate ? format(endDate, "yyyy-MM-dd") : null,
      },
      allStudents: studentAttendanceCounts.map((s, idx) => ({
        rank: idx + 1,
        name: s.name,
        attendanceCount: s.count,
      })),
      topStudents: topStudentsForPrint.map((s, idx) => ({
        rank: idx + 1,
        name: s.name,
        attendanceCount: s.count,
      })),
      bottomStudents: bottomStudentsForPrint.map((s, idx) => ({
        rank: topStudentsForPrint.length + idx + 1,
        name: s.name,
        attendanceCount: s.count,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${orgName}_analytics_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [orgName, studentAttendanceCounts, filteredAttendanceEvents, topStudentsForPrint, bottomStudentsForPrint, startDate, endDate]);

  if (orgLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <PageBackground />
      
      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/organisations/${orgId}`)}
            className="md:h-11 md:w-11 flex-shrink-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">Analytics Report - {orgName}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
              View attendance statistics and student performance metrics
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Desktop: Print and Download JSON buttons */}
          <Button onClick={handlePrint} variant="outline" size="sm" className="hidden md:flex md:h-11 text-xs sm:text-sm">
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
          <Button onClick={handleDownload} variant="outline" size="sm" className="hidden md:flex md:h-11 text-xs sm:text-sm">
            <Download className="mr-2 h-4 w-4" />
            Download JSON
          </Button>
          {/* Mobile: Single Download button that triggers print (can save as PDF) */}
          <Button onClick={handlePrint} variant="outline" size="sm" className="flex md:hidden w-full text-xs sm:text-sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      <style>{`
        .analytics-table {
          border-collapse: collapse;
          width: 100%;
        }
        .analytics-table th,
        .analytics-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid hsl(var(--border));
        }
        .analytics-table th {
          font-weight: 600;
          color: hsl(var(--foreground));
          background-color: transparent;
        }
        .analytics-table td {
          color: hsl(var(--foreground));
          background-color: transparent;
        }
        .analytics-table tbody tr:hover {
          background-color: hsl(var(--muted) / 0.3);
        }
        .analytics-table thead th {
          border-bottom: 2px solid hsl(var(--border));
        }
      `}</style>

      <div ref={printRef} className="space-y-6">
        {/* Print Header - Hidden on screen, shown in print */}
        <div className="print-header no-print" style={{ display: "none" }}>
          <h1>SuiAttend Attendance Report</h1>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "5px" }}>
            Organisation: {orgName} • Generated on {new Date().toLocaleString()}
            {startDate || endDate ? (
              <span>
                <br />
                Period: {startDate ? format(startDate, "MMM dd, yyyy") : "Start"} - {endDate ? format(endDate, "MMM dd, yyyy") : "End"}
              </span>
            ) : null}
          </p>
        </div>

        {/* Date Filter Section */}
        <Card className="border-border no-print">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <Label htmlFor="start-date" className="mb-2 block text-sm">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal md:h-11 text-xs sm:text-sm"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex-1 min-w-0">
                <Label htmlFor="end-date" className="mb-2 block text-sm">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal md:h-11 text-xs sm:text-sm"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-end sm:items-start">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full sm:w-auto md:h-11 text-xs sm:text-sm"
                  onClick={() => {
                    setStartDate(undefined);
                    setEndDate(undefined);
                  }}
                  disabled={!startDate && !endDate}
                >
                  <X className="h-4 w-4 mr-2 sm:mr-0" />
                  <span className="sm:hidden">Clear Filters</span>
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              </div>
            </div>
            {(startDate || endDate) && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-2">
                Showing records from {startDate ? format(startDate, "MMM dd, yyyy") : "beginning"} to {endDate ? format(endDate, "MMM dd, yyyy") : "now"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Overall Attendance Health Gauge */}
        <div className="print-section no-print">
          <Card className="border-border">
            <CardHeader className="p-6 pb-4">
              <CardTitle>Overall Attendance Health</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="flex flex-col items-center justify-center">
                <div className="relative" style={{ width: "400px", height: "200px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={gaugeData}
                        cx="50%"
                        cy="90%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={0}
                        dataKey="value"
                      >
                        {gaugeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ marginTop: "60px" }}>
                    <div className="text-lg font-bold" style={{ color: getGaugeColor(overallAttendancePercentage) }}>
                      {overallAttendancePercentage}%
                    </div>
                    <div className={`text-xs font-medium mt-2 ${attendanceStatus.color}`}>
                      {attendanceStatus.text}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 w-full max-w-md">
                  <div className="text-center">
                    <div className="text-xl font-bold">{studentAttendanceCounts.length}</div>
                    <div className="text-xs text-muted-foreground">Total Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">{filteredAttendanceEvents.length}</div>
                    <div className="text-xs text-muted-foreground">Total Records</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">
                      {studentAttendanceCounts.length > 0
                        ? Math.round(
                            studentAttendanceCounts.reduce((sum, s) => sum + s.count, 0) /
                              studentAttendanceCounts.length
                          )
                        : 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg per Student</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <div className="print-section">
          <Card className="border-border">
            <CardContent className="p-6">
              <table className="print-table analytics-table w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-center">Total Students</th>
                    <th className="text-center">Total Records</th>
                    <th className="text-center">Average Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-center font-bold text-lg">{studentAttendanceCounts.length}</td>
                    <td className="text-center font-bold text-lg">{filteredAttendanceEvents.length}</td>
                    <td className="text-center font-bold text-lg">
                      {studentAttendanceCounts.length > 0
                        ? Math.round(
                            studentAttendanceCounts.reduce((sum, s) => sum + s.count, 0) /
                              studentAttendanceCounts.length
                          )
                        : 0}
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Top Students Chart */}
        <div className="print-section">
          <Card className="border-border">
            <CardHeader className="p-6 pb-4">
              <CardTitle>Top 10 Students (Highest Attendance)</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {topStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center no-print">
                  <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {studentAttendanceCounts.length === 0
                      ? "No attendance records available for this organisation."
                      : "No attendance data available for the selected date range."}
                  </p>
                  {studentAttendanceCounts.length === 0 && (
                    <p className="text-sm text-muted-foreground/70 mt-2">
                      Attendance records will appear here once students check in.
                    </p>
                  )}
                </div>
              ) : (
                <div style={{ height: "200px", minHeight: "180px", backgroundColor: "transparent" }} className="no-print" role="img" aria-label="Top 10 students attendance bar chart">
                  <Bar data={chartData} options={topChartOptions} />
                </div>
              )}
              <div className="mt-4">
                <table className="print-table analytics-table w-full border-collapse">
                  <thead>
                    <tr>
                      <th style={{ width: "80px" }}>Rank</th>
                      <th>Student Name</th>
                      <th style={{ width: "150px" }} className="text-right">Attendance Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topStudents.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center text-muted-foreground py-8">
                          {studentAttendanceCounts.length === 0
                            ? "No attendance records available."
                            : "No data available for the selected date range."}
                        </td>
                      </tr>
                    ) : (
                      topStudents.map((student, idx) => (
                        <tr key={idx}>
                          <td className="text-center">{idx + 1}</td>
                          <td>{student.name}</td>
                          <td className="text-right">{student.count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Students Chart - Hidden in print */}
        <div className="print-section no-print">
          <Card className="border-border">
            <CardHeader className="p-6 pb-4">
              <CardTitle>Bottom 10 Students (Lowest Attendance)</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {bottomStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <TrendingDown className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {studentAttendanceCounts.length === 0
                      ? "No attendance records available for this organisation."
                      : "No attendance data available for the selected date range."}
                  </p>
                  {studentAttendanceCounts.length === 0 && (
                    <p className="text-sm text-muted-foreground/70 mt-2">
                      Attendance records will appear here once students check in.
                    </p>
                  )}
                </div>
              ) : (
                <div style={{ height: "200px", minHeight: "180px", backgroundColor: "transparent" }} role="img" aria-label="Bottom 10 students attendance bar chart">
                  <Bar data={bottomChartData} options={bottomChartOptions} />
                </div>
              )}
              <div className="mt-4">
                <table className="print-table analytics-table w-full border-collapse">
                  <thead>
                    <tr>
                      <th style={{ width: "80px" }}>Rank</th>
                      <th>Student Name</th>
                      <th style={{ width: "150px" }} className="text-right">Attendance Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bottomStudents.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center text-muted-foreground py-8">
                          {studentAttendanceCounts.length === 0
                            ? "No attendance records available."
                            : "No data available for the selected date range."}
                        </td>
                      </tr>
                    ) : (
                      bottomStudents.map((student, idx) => (
                        <tr key={idx}>
                          <td className="text-center">{studentAttendanceCounts.length - bottomStudents.length + idx + 1}</td>
                          <td>{student.name}</td>
                          <td className="text-right">{student.count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Print-Only: All Top Students */}
        <div className="print-section print-only" style={{ display: "none" }}>
          <div className="print-section-title">Top Students (Highest Performance)</div>
          <table className="print-table w-full">
            <thead>
              <tr>
                <th style={{ width: "80px" }}>Rank</th>
                <th>Student Name</th>
                <th style={{ width: "150px" }}>Attendance Count</th>
              </tr>
            </thead>
            <tbody>
              {topStudentsForPrint.map((student, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{student.name}</td>
                  <td>{student.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Print-Only: All Bottom Students */}
        <div className="print-section print-only" style={{ display: "none" }}>
          <div className="print-section-title">Bottom Students (Lowest Performance)</div>
          <table className="print-table w-full">
            <thead>
              <tr>
                <th style={{ width: "80px" }}>Rank</th>
                <th>Student Name</th>
                <th style={{ width: "150px" }}>Attendance Count</th>
              </tr>
            </thead>
            <tbody>
              {bottomStudentsForPrint.map((student, idx) => (
                <tr key={idx}>
                  <td>{topStudentsForPrint.length + idx + 1}</td>
                  <td>{student.name}</td>
                  <td>{student.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Print Footer - Hidden on screen, shown in print */}
        <div className="print-footer print-only" style={{ display: "none" }}>
          <p>Generated by SuiAttend • {new Date().toLocaleString()}</p>
          <p>Organisation: {orgName} ({orgId})</p>
          {startDate || endDate ? (
            <p>
              Period: {startDate ? format(startDate, "MMM dd, yyyy") : "Start"} - {endDate ? format(endDate, "MMM dd, yyyy") : "End"}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

