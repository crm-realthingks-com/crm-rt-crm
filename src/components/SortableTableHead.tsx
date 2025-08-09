
import { TableHead } from "@/components/ui/table";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { SortConfig } from "@/hooks/useSorting";

interface SortableTableHeadProps {
  field: string;
  label: string;
  sortConfig: SortConfig;
  onSort: (field: string) => void;
  className?: string;
}

export const SortableTableHead = ({
  field,
  label,
  sortConfig,
  onSort,
  className = ""
}: SortableTableHeadProps) => {
  const getSortIcon = () => {
    if (sortConfig.field === field) {
      if (sortConfig.direction === 'asc') {
        return <ChevronUp className="w-4 h-4" />;
      } else if (sortConfig.direction === 'desc') {
        return <ChevronDown className="w-4 h-4" />;
      }
    }
    return <ChevronsUpDown className="w-4 h-4 opacity-50" />;
  };

  return (
    <TableHead className={className}>
      <button
        className="flex items-center gap-2 hover:text-primary transition-colors font-semibold"
        onClick={() => onSort(field)}
      >
        {label}
        {getSortIcon()}
      </button>
    </TableHead>
  );
};
