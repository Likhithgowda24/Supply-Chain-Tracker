import { MoreVertical, Eye, MessageSquare } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Customer {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  totalOrders: number;
  status: "active" | "inactive";
  joinedDate: string;
}

interface CustomerTableProps {
  customers: Customer[];
  onViewDetails?: (id: string) => void;
  onContact?: (id: string) => void;
}

export function CustomerTable({ customers, onViewDetails, onContact }: CustomerTableProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Orders</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id} className="hover-elevate" data-testid={`row-customer-${customer.id}`}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={customer.avatar} alt={customer.name} />
                    <AvatarFallback>{customer.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{customer.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{customer.email}</TableCell>
              <TableCell>
                <span className="font-mono">{customer.totalOrders}</span>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    customer.status === "active"
                      ? "bg-green-500/10 text-green-700 dark:text-green-400"
                      : "bg-gray-500/10 text-gray-700 dark:text-gray-400"
                  }`}
                >
                  {customer.status}
                </span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{customer.joinedDate}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid={`button-actions-${customer.id}`}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails?.(customer.id)} data-testid={`button-view-${customer.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onContact?.(customer.id)} data-testid={`button-contact-${customer.id}`}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
