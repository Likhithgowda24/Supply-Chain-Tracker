import { CustomerTable } from "../CustomerTable";

const mockCustomers = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    totalOrders: 24,
    status: "active" as const,
    joinedDate: "Jan 2024",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    totalOrders: 18,
    status: "active" as const,
    joinedDate: "Feb 2024",
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob@example.com",
    totalOrders: 7,
    status: "inactive" as const,
    joinedDate: "Mar 2024",
  },
];

export default function CustomerTableExample() {
  return (
    <div className="p-8 max-w-6xl">
      <h2 className="text-2xl font-bold mb-6">Customer Management</h2>
      <CustomerTable
        customers={mockCustomers}
        onViewDetails={(id) => console.log("View details:", id)}
        onContact={(id) => console.log("Contact:", id)}
      />
    </div>
  );
}
