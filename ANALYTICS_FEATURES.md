# Analytics Features Documentation

This document covers all the analytics and reporting features implemented in the Sui Attendance System.

## Overview

The analytics feature provides comprehensive attendance reporting and analysis capabilities for organisations. Users can view detailed statistics, filter data by date ranges, and generate printable reports.

## Features

### 1. Organisation Analytics Dashboard

The analytics dashboard provides a comprehensive view of attendance data for each organisation, accessible via the "View Analytics" button in the Attendance tab.

#### Accessing Analytics
- Navigate to an organisation's detail page
- Click on the "Attendance" tab
- Click the "View Analytics" button

### 2. Date Range Filtering

Users can filter attendance records by selecting a date range to analyze specific time periods.

#### Features:
- **Start Date Picker**: Select the beginning of the date range
- **End Date Picker**: Select the end of the date range
- **Flexible Filtering**: 
  - Select only a start date to see records from that date forward
  - Select only an end date to see records up to that date
  - Select both dates to see records within a specific period
  - Leave both empty to see all records
- **Clear Filter**: Reset button to clear the date range selection
- **Status Display**: Shows the currently selected date range

#### How It Works:
- Attendance events are filtered based on the selected date range
- All statistics and calculations use only the filtered data
- Charts and tables update automatically when the date range changes

### 3. Summary Statistics

The analytics dashboard displays key metrics in a table format:

| Metric | Description |
|--------|-------------|
| **Total Students** | Number of unique students with attendance records in the selected period |
| **Total Records** | Total number of attendance records in the selected period |
| **Average Attendance** | Average number of attendance records per student |

### 4. Student Performance Charts

#### Top 10 Students (Highest Attendance)
- Bar chart visualization of the top 10 students by attendance count
- Interactive chart with hover tooltips
- Data table showing rank, student name, and attendance count
- Only visible in the dialog view (hidden in print)

#### Bottom 10 Students (Lowest Attendance)
- Bar chart visualization of the bottom 10 students by attendance count
- Interactive chart with hover tooltips
- Data table showing rank, student name, and attendance count
- Hidden in print view

### 5. Comprehensive Print Reports

The print functionality generates detailed reports suitable for printing or PDF export.

#### Print Report Contents:

1. **Header Section**
   - Title: "SuiAttend Attendance Report"
   - Organisation name
   - Report generation date and time
   - Date range (if filtered)

2. **Summary Statistics Table**
   - Total Students
   - Total Records
   - Average Attendance

3. **Top Students Section**
   - Table showing all top-performing students (not just top 10)
   - Ranked by highest attendance count
   - Columns: Rank, Student Name, Attendance Count

4. **Bottom Students Section**
   - Table showing all low-performing students
   - Ranked by lowest attendance count
   - Columns: Rank, Student Name, Attendance Count

5. **Footer Section**
   - Report generation timestamp
   - Organisation ID
   - Date range (if filtered)

#### Print Features:
- **Automatic Pagination**: Reports automatically split across multiple pages when needed
- **Page Headers**: Table headers repeat on each page
- **Clean Layout**: Optimized for printing with proper spacing and borders
- **Date Range Display**: Shows the filtered period in both header and footer

### 6. Data Export

#### JSON Export
- Download analytics data as JSON file
- Includes:
  - Organisation information
  - Date range (if filtered)
  - All student data with attendance counts
  - Top and bottom student lists
  - Report generation timestamp

### 7. Last Seen Feature

The "Last Seen" column in the Students tab now displays the most recent attendance timestamp for each student.

#### Features:
- Shows the date and time of the student's most recent attendance
- Automatically updates when new attendance is recorded
- Displays "—" if the student has no attendance records
- Formatted as localized date/time string

## Usage Guide

### Viewing Analytics

1. Navigate to an organisation's detail page
2. Click on the "Attendance" tab
3. Click the "View Analytics" button
4. The analytics dialog will open showing:
   - Summary statistics
   - Top 10 students chart
   - Bottom 10 students chart

### Filtering by Date Range

1. In the analytics dialog, use the date pickers to select:
   - **Start Date**: Beginning of the period you want to analyze
   - **End Date**: End of the period you want to analyze
2. The analytics will automatically update to show only records within the selected range
3. Click "Clear" to remove the date filter

### Printing Reports

1. Open the analytics dialog
2. (Optional) Set a date range to filter the data
3. Click the "Print Report" button
4. A new window will open with the formatted report
5. Use your browser's print dialog to:
   - Print to a physical printer
   - Save as PDF
   - Adjust print settings

### Exporting Data

1. Open the analytics dialog
2. (Optional) Set a date range to filter the data
3. Click the "Download JSON" button
4. A JSON file will be downloaded with all analytics data

## Technical Implementation

### Components

- **OrganisationAnalytics.tsx**: Main analytics component with date filtering, charts, and print functionality
- **OrganisationDetail.tsx**: Organisation detail page with analytics button integration

### Data Flow

1. **Data Fetching**:
   - Attendance events are fetched using `useAttendanceRecordedEvents`
   - Student events are fetched using `useStudentRegisteredEvents`
   - Data is filtered by organisation ID

2. **Date Filtering**:
   - Attendance events are filtered based on selected date range
   - Filtering happens in the `filteredAttendanceEvents` useMemo hook
   - All subsequent calculations use the filtered data

3. **Statistics Calculation**:
   - Student attendance counts are calculated from filtered events
   - Top and bottom students are determined by sorting attendance counts
   - Summary statistics are computed from the filtered dataset

4. **Print Generation**:
   - Content is cloned and modified for print
   - Print-only sections are shown, dialog-only sections are hidden
   - Custom CSS is injected for optimal print formatting

### Key Hooks and Functions

- `useAttendanceRecordedEvents`: Fetches attendance events for an organisation
- `useStudentRegisteredEvents`: Fetches student registration events
- `filteredAttendanceEvents`: Filters attendance events by date range
- `studentAttendanceCounts`: Calculates attendance count per student
- `handlePrint`: Generates and opens print dialog
- `handleDownload`: Exports data as JSON

## Future Enhancements

The following features are planned for future implementation:

- **View Profile**: Detailed student profile view
- **Edit Student**: Ability to edit student information
- **Remove Student**: Remove students from organisation
- **Advanced Filters**: Additional filtering options (department, card ID, etc.)
- **Export Formats**: CSV, Excel export options
- **Scheduled Reports**: Automated report generation
- **Email Reports**: Send reports via email

## Notes

- All timestamps are stored and displayed in milliseconds (Unix timestamp)
- Date filtering uses local timezone for date selection but filters based on UTC timestamps
- Print reports are optimized for A4 paper size
- Charts use Chart.js library for visualization
- Date pickers use react-day-picker library
