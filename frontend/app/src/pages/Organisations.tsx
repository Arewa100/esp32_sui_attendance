import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  MoreHorizontal,
  Building2,
  Users,
  FileCheck,
  ArrowUpDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMemo } from "react";
import { useOrganisationCreatedEvents } from "@/hooks/use-attendance-events";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { CONFIG } from "@/config";

export default function Organisations() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { data: createdEvents, isLoading: isLoadingOrgs, error } = useOrganisationCreatedEvents(200);

  // Fetch all student events (without orgId filter to get all events for counting)
  const { data: allStudentEvents } = useQuery({
    queryKey: ["events", "StudentRegisteredEvent", "all", CONFIG.PACKAGE_ID],
    queryFn: async () => {
      if (!CONFIG.PACKAGE_ID) return [];
      const res = await client.queryEvents({
        query: { MoveEventType: `${CONFIG.PACKAGE_ID}::events::StudentRegisteredEvent` },
        limit: 1000,
        order: "descending",
      });
      return (res.data || []).map((e) => e.parsedJson as any);
    },
    enabled: !!CONFIG.PACKAGE_ID,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  // Fetch all attendance events (without orgId filter to get all events for counting)
  const { data: allAttendanceEvents } = useQuery({
    queryKey: ["events", "AttendanceRecordedEvent", "all", CONFIG.PACKAGE_ID],
    queryFn: async () => {
      if (!CONFIG.PACKAGE_ID) return [];
      const res = await client.queryEvents({
        query: { MoveEventType: `${CONFIG.PACKAGE_ID}::events::AttendanceRecordedEvent` },
        limit: 1000,
        order: "descending",
      });
      return (res.data || []).map((e) => e.parsedJson as any);
    },
    enabled: !!CONFIG.PACKAGE_ID,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  // Compute counts per organisation using useMemo
  const organisations = useMemo(() => {
    if (!createdEvents) return [];

    // Filter orgs owned by connected wallet
    const userOrgs = createdEvents.filter((e) => 
      account?.address ? e.owner === account.address : true
    );

    // Create maps for efficient counting
    const studentCountByOrg = new Map<string, number>();
    const recordCountByOrg = new Map<string, number>();

    // Count students per organisation
    (allStudentEvents || []).forEach((event) => {
      const orgId = event.organisation;
      studentCountByOrg.set(orgId, (studentCountByOrg.get(orgId) || 0) + 1);
    });

    // Count records per organisation
    (allAttendanceEvents || []).forEach((event) => {
      const orgId = event.organisation;
      recordCountByOrg.set(orgId, (recordCountByOrg.get(orgId) || 0) + 1);
    });

    // Map organisations with counts and creation date
    return userOrgs.map((e) => ({
      id: e.organisation,
      name: e.name,
      status: "active" as const,
      students: studentCountByOrg.get(e.organisation) || 0,
      records: recordCountByOrg.get(e.organisation) || 0,
      created: e.timestampMs ? new Date(e.timestampMs).toISOString() : undefined,
    }));
  }, [createdEvents, allStudentEvents, allAttendanceEvents, account?.address]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organisations</h1>
          <p className="text-muted-foreground">Manage your registered organisations</p>
        </div>
        <Button asChild>
          <Link to="/organisations/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Organisation
          </Link>
        </Button>
      </div>

      {!account ? (
        <Card className="border-border">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Connect your wallet to load your organisations from Sui.
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card className="border-border">
          <CardContent className="p-4 text-sm text-destructive">
            {(error as Error).message}
          </CardContent>
        </Card>
      ) : null}

      {/* Search and Filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search organisations..." 
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm">
              All Status
            </Button>
            <Button variant="outline" size="sm">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Sort
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[300px]">Organisation</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Students</TableHead>
              <TableHead className="text-right">Records</TableHead>
              <TableHead className="text-right">Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingOrgs ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  Loading organisations...
                </TableCell>
              </TableRow>
            ) : null}

            {!isLoadingOrgs && organisations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  No organisations found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : null}

            {organisations.map((org) => (
              <TableRow key={org.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Link to={`/organisations/${org.id}`} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{org.name}</span>
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      org.status === "active" ? "default" : 
                      org.status === "expired" ? "destructive" : 
                      "secondary"
                    }
                    className={org.status === "active" ? "bg-primary" : ""}
                  >
                    {org.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {org.students.toLocaleString()}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <FileCheck className="h-4 w-4 text-muted-foreground" />
                    {org.records.toLocaleString()}
                  </div>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {org.created ? new Date(org.created).toLocaleDateString(undefined, { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  }) : "—"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/organisations/${org.id}`}>View Details</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                      <DropdownMenuItem disabled className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
