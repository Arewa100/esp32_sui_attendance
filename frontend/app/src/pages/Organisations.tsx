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
import { useOrganisationCreatedEvents } from "@/hooks/use-attendance-events";
import { useCurrentAccount } from "@mysten/dapp-kit";

export default function Organisations() {
  const account = useCurrentAccount();
  const { data: createdEvents, isLoading, error } = useOrganisationCreatedEvents(200);

  // Use events as the canonical list source (matches contract flow).
  // Only show orgs owned by connected wallet (owner = tx sender).
  const organisations =
    createdEvents
      ?.filter((e) => (account?.address ? e.owner === account.address : true))
      .map((e) => ({
        id: e.organisation,
        name: e.name,
        status: "active" as const,
        students: 0,
        records: 0,
        created: undefined as string | undefined,
      })) ?? [];

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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  Loading organisations...
                </TableCell>
              </TableRow>
            ) : null}

            {!isLoading && organisations.length === 0 ? (
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
                  {org.created ? new Date(org.created).toLocaleDateString() : "—"}
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
