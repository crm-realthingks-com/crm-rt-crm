import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, ArrowDown, ArrowUp, SlidersHorizontal } from "lucide-react";

interface Deal {
  id: string;
  name: string;
  stage: string;
  value: number;
  company: string;
  contact: string;
  probability: number;
  expectedCloseDate: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

interface ListViewProps {
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
}

export const ListView = ({ deals, onDealClick }: ListViewProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  const columns: ColumnDef<Deal>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "stage",
      header: "Stage",
    },
    {
      accessorKey: "value",
      header: "Value",
    },
    {
      accessorKey: "company",
      header: "Company",
    },
    {
      accessorKey: "contact",
      header: "Contact",
    },
    {
      accessorKey: "probability",
      header: "Probability",
    },
    {
      accessorKey: "expectedCloseDate",
      header: "Expected Close Date",
    },
    {
      accessorKey: "owner",
      header: "Owner",
    },
  ];

  const table = useReactTable({
    data: deals,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  });

  const handleColumnVisibilityChange = (columnId: string, isVisible: boolean) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnId]: isVisible
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Input
          type="text"
          placeholder="Search deals..."
          value={globalFilter || ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table.getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      handleColumnVisibilityChange(column.id, !!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : (
                          <div
                            {...{
                              className: "flex cursor-pointer gap-1",
                              onClick: header.column.getToggleSortingHandler(),
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {{
                              asc: <ArrowUp className="h-4 w-4" />,
                              desc: <ArrowDown className="h-4 w-4" />,
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onDealClick(row.original)}
                  className="cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
