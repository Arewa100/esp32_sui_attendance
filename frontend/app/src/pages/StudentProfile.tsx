import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  User,
  Calendar,
  Clock,
  Copy,
  Check,
  Calendar as CalendarIcon,
  X,
  TrendingUp,
  Printer,
} from "lucide-react";
import { useStudentsByIds } from "@/hooks/use-attendance-objects";
import { useAttendanceRecordedEvents } from "@/hooks/use-attendance-events";
import { useMemo, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function StudentProfile() {
  const { orgId, studentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: studentsFromObjects, isLoading: isLoadingStudent } = useStudentsByIds(
    studentId ? [studentId] : undefined
  );
  const { data: attendanceEvents, isLoading: isLoadingAttendance } = useAttendanceRecordedEvents(
    orgId,
    1000
  );

  const student = useMemo(() => {
    return studentsFromObjects?.[0];
  }, [studentsFromObjects]);

  // Filter attendance records for this student
  const allStudentAttendanceRecords = useMemo(() => {
    if (!attendanceEvents || !studentId) return [];
    
    return attendanceEvents
      .filter((event) => event.student === studentId)
      .map((e, idx) => ({
        id: `${idx}`,
        type: "check-in" as const,
        timestamp: Number(e.timestamp),
        timestampFormatted: new Date(Number(e.timestamp)).toLocaleString(),
        dateFormatted: new Date(Number(e.timestamp)).toLocaleDateString(),
        timeFormatted: new Date(Number(e.timestamp)).toLocaleTimeString(),
        txHash: e.record,
      }))
      .sort((a, b) => b.timestamp - a.timestamp); // Sort by most recent first
  }, [attendanceEvents, studentId]);

  // Filter by date range
  const studentAttendanceRecords = useMemo(() => {
    if (!startDate && !endDate) {
      return allStudentAttendanceRecords;
    }

    return allStudentAttendanceRecords.filter((record) => {
      const recordDate = new Date(record.timestamp);
      const recordTime = recordDate.getTime();
      
      const startTime = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : 0;
      const endTime = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Number.MAX_SAFE_INTEGER;
      
      return recordTime >= startTime && recordTime <= endTime;
    });
  }, [allStudentAttendanceRecords, startDate, endDate]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCheckIns = studentAttendanceRecords.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    
    const todayCheckIns = studentAttendanceRecords.filter(
      (record) => record.timestamp >= todayTimestamp
    ).length;

    // Get unique dates
    const uniqueDates = new Set(
      studentAttendanceRecords.map((record) => record.dateFormatted)
    ).size;

    // Get last seen
    const lastSeen = studentAttendanceRecords[0]
      ? studentAttendanceRecords[0].timestampFormatted
      : "—";

    // Calculate attendance rate
    // Use all records (not filtered) to calculate rate based on total possible days
    // From first record to today, or from 30 days ago to today (whichever is more recent)
    let totalPossibleDays = 30; // Default to last 30 days
    if (allStudentAttendanceRecords.length > 0) {
      const firstRecord = allStudentAttendanceRecords[allStudentAttendanceRecords.length - 1];
      const firstDate = new Date(firstRecord.timestamp);
      firstDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.ceil((todayTimestamp - firstDate.getTime()) / (1000 * 60 * 60 * 24));
      totalPossibleDays = Math.max(daysDiff, 1); // At least 1 day
    }
    
    const attendanceRate = totalPossibleDays > 0 
      ? ((uniqueDates / totalPossibleDays) * 100).toFixed(1)
      : "0.0";

    return {
      totalCheckIns,
      todayCheckIns,
      uniqueDates,
      lastSeen,
      attendanceRate: parseFloat(attendanceRate),
    };
  }, [studentAttendanceRecords, allStudentAttendanceRecords]);

  // Prepare chart data for attendance trend
  const chartData = useMemo(() => {
    if (studentAttendanceRecords.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    // Group by date
    const dateMap = new Map<string, number>();
    studentAttendanceRecords.forEach((record) => {
      const date = record.dateFormatted;
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    // Sort dates chronologically
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    return {
      labels: sortedDates,
      datasets: [
        {
          label: "Check-ins",
          data: sortedDates.map((date) => dateMap.get(date) || 0),
          borderColor: "rgba(107, 141, 227, 1)",
          backgroundColor: "rgba(107, 141, 227, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [studentAttendanceRecords]);

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
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    toast({
      title: "Copied!",
      description: "Transaction hash copied to clipboard",
    });
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Clone the content and modify it for printing
    const contentClone = printRef.current.cloneNode(true) as HTMLElement;
    
    // Replace transaction hash buttons with full hash text for printing
    const hashButtons = contentClone.querySelectorAll('button[data-hash]');
    hashButtons.forEach((button) => {
      const fullHash = button.getAttribute('data-hash');
      if (fullHash && button.parentElement) {
        const span = document.createElement('span');
        span.className = 'font-mono text-xs';
        span.textContent = fullHash;
        button.parentElement.replaceChild(span, button);
      }
    });
    
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
        .print-footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ccc; font-size: 12px; color: #666; text-align: center; }
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
          <title>Student Profile - ${student?.fields.name || 'Student'}</title>
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

  if (isLoadingStudent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Student not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 no-print">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{student.fields.name}</h1>
              <p className="text-sm text-muted-foreground">Student Profile</p>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      {/* Print Header - Hidden on screen, shown in print */}
      <div className="print-header print-only" style={{ display: "none" }}>
        <h1>Student Profile Report</h1>
        <p style={{ fontSize: "14px", color: "#666", marginTop: "5px" }}>
          Student: {student.fields.name} • Generated on {new Date().toLocaleString()}
          {startDate || endDate ? (
            <span>
              <br />
              Period: {startDate ? format(startDate, "MMM dd, yyyy") : "Start"} - {endDate ? format(endDate, "MMM dd, yyyy") : "End"}
            </span>
          ) : null}
        </p>
      </div>

      <div ref={printRef} className="space-y-6">
        {/* Student Details Card */}
        <Card className="border-border print-section overflow-hidden no-print">
          <div className="bg-primary/10 dark:bg-primary/5 animate-shimmer bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 bg-[length:200%_100%] h-full w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary dark:text-primary">
                <User className="h-5 w-5" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Full Name</p>
                    <p className="text-base text-foreground">{student.fields.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Department</p>
                    <p className="text-base text-foreground">{student.fields.department}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Card ID</p>
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                      {student.fields.card_id}
                    </code>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Student ID</p>
                    <button
                      onClick={() => handleCopyHash(student.id)}
                      className="group relative inline-flex items-center gap-1.5 text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded font-mono transition-colors cursor-pointer"
                      title="Click to copy full Student ID"
                    >
                      {student.id.slice(0, 8)}...
                      {copiedHash === student.id ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Print-only Student Information Table */}
        <div className="print-only print-section" style={{ display: "none" }}>
          <h2 className="print-section-title">Student Information & Statistics</h2>
          <Table className="print-table">
            <TableBody>
              <TableRow>
                <TableCell className="font-medium w-1/3">Full Name</TableCell>
                <TableCell>{student.fields.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Department</TableCell>
                <TableCell>{student.fields.department}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Card ID</TableCell>
                <TableCell className="font-mono">{student.fields.card_id}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Student ID</TableCell>
                <TableCell className="font-mono text-xs">{student.id}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Total Check-ins</TableCell>
                <TableCell>{stats.totalCheckIns}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Today's Check-ins</TableCell>
                <TableCell>{stats.todayCheckIns}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Days Attended</TableCell>
                <TableCell>{stats.uniqueDates}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Attendance Rate</TableCell>
                <TableCell>{stats.attendanceRate}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Last Seen</TableCell>
                <TableCell>{stats.lastSeen}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-5 print-section no-print">
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalCheckIns}</p>
                <p className="text-sm text-muted-foreground">Total Check-ins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.todayCheckIns}</p>
                <p className="text-sm text-muted-foreground">Today's Check-ins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.uniqueDates}</p>
                <p className="text-sm text-muted-foreground">Days Attended</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.attendanceRate}%</p>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{stats.lastSeen}</p>
                <p className="text-sm text-muted-foreground">Last Seen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Attendance Trend Chart */}
        {studentAttendanceRecords.length > 0 && (
          <Card className="border-border print-section no-print">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Attendance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: '300px' }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      )}

        {/* Date Range Filter */}
        <Card className="border-border no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Filter Attendance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-end gap-4">
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
                  <CalendarComponent
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
                  <CalendarComponent
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

        {/* Attendance History */}
        <Card className="border-border print-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Attendance History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAttendance ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-12 w-full" />
                ))}
              </div>
            ) : studentAttendanceRecords.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No attendance records found for this student.
              </p>
            ) : (
              <Table className="print-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Transaction Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentAttendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.dateFormatted}</TableCell>
                      <TableCell className="text-muted-foreground">{record.timeFormatted}</TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-primary">
                          {record.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleCopyHash(record.txHash)}
                          className="group relative inline-flex items-center gap-1.5 text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded font-mono transition-colors cursor-pointer"
                          title="Click to copy full hash"
                          data-hash={record.txHash}
                        >
                          {record.txHash.slice(0, 8)}...
                          {copiedHash === record.txHash ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Print Footer */}
        <div className="print-footer print-only" style={{ display: "none" }}>
          <p>Generated by SuiAttend • {new Date().toLocaleString()}</p>
          <p>Student ID: {student.id}</p>
        </div>
      </div>
    </div>
  );
}

