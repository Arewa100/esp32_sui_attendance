import { useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Printer, Download, Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { useAttendanceRecordedEvents, useStudentRegisteredEvents } from "@/hooks/use-attendance-events";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface OrganisationAnalyticsProps {
  orgId: string;
  orgName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OrganisationAnalytics({
  orgId,
  orgName,
  open,
  onOpenChange,
}: OrganisationAnalyticsProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { data: attendanceEvents } = useAttendanceRecordedEvents(orgId, 1000);
  const { data: studentEvents } = useStudentRegisteredEvents(orgId, 500);
  
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

  const chartData = {
    labels: topStudents.map((s) => s.name.length > 15 ? s.name.slice(0, 15) + "..." : s.name),
    datasets: [
      {
        label: "Attendance Count",
        data: topStudents.map((s) => s.count),
        backgroundColor: "rgba(107, 141, 227, 0.8)", // #6B8DE3
        borderColor: "rgba(107, 141, 227, 1)",
        borderWidth: 1,
      },
    ],
  };

  const bottomChartData = {
    labels: bottomStudents.map((s) => s.name.length > 15 ? s.name.slice(0, 15) + "..." : s.name),
    datasets: [
      {
        label: "Attendance Count",
        data: bottomStudents.map((s) => s.count),
        backgroundColor: "rgba(251, 146, 60, 0.8)", // orange
        borderColor: "rgba(251, 146, 60, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
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
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(37, 37, 37, 1)",
          lineWidth: 6,
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
          lineWidth: 6,
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
  };

  const handlePrint = () => {
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
  };

  const handleDownload = () => {
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Analytics Report - {orgName}</DialogTitle>
          <DialogDescription>
            View attendance statistics and student performance metrics
          </DialogDescription>
        </DialogHeader>

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
            <CardContent className="p-4">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Label htmlFor="start-date" className="mb-2 block">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
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
                <div className="flex-1">
                  <Label htmlFor="end-date" className="mb-2 block">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStartDate(undefined);
                    setEndDate(undefined);
                  }}
                  disabled={!startDate && !endDate}
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              </div>
              {(startDate || endDate) && (
                <p className="text-sm text-muted-foreground mt-2">
                  Showing records from {startDate ? format(startDate, "MMM dd, yyyy") : "beginning"} to {endDate ? format(endDate, "MMM dd, yyyy") : "now"}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 no-print">
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="mr-2 h-4 w-4" />
              Print Report
            </Button>
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download JSON
            </Button>
          </div>

          {/* Summary Stats */}
          <div className="print-section">
            <Card className="border-border">
              <CardContent className="p-4">
                <table className="print-table w-full">
                  <thead>
                    <tr>
                      <th>Total Students</th>
                      <th>Total Records</th>
                      <th>Average Attendance</th>
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
              <CardHeader>
                <CardTitle>Top 10 Students (Highest Attendance)</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ height: "300px" }} className="no-print">
                  <Bar data={chartData} options={chartOptions} />
                </div>
                <div className="mt-4">
                  <table className="print-table w-full">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Student Name</th>
                        <th>Attendance Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topStudents.map((student, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>{student.name}</td>
                          <td>{student.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Students Chart - Hidden in print */}
          <div className="print-section no-print">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Bottom 10 Students (Lowest Attendance)</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ height: "300px" }}>
                  <Bar data={bottomChartData} options={chartOptions} />
                </div>
                <div className="mt-4">
                  <table className="print-table w-full">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Student Name</th>
                        <th>Attendance Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bottomStudents.map((student, idx) => (
                        <tr key={idx}>
                          <td>{studentAttendanceCounts.length - bottomStudents.length + idx + 1}</td>
                          <td>{student.name}</td>
                          <td>{student.count}</td>
                        </tr>
                      ))}
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
      </DialogContent>
    </Dialog>
  );
}

