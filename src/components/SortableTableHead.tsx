
import React from 'react';
import { TableHead } from "@/components/ui/table";
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { SortConfig } from '@/hooks/useSorting';

interface SortableTableHeadProps {
  children: React.ReactNode;
  sortKey: string;
  sortConfig: SortConfig;
  onSort: (key: string) => void;
  className?: string;
}

export const SortableTableHead: React.FC<SortableTableHeadProps> = ({
  children,
  sortKey,
  sortConfig,
  onSort,
  className,
}) => {
  const getSortIcon = () => {
    if (sortConfig.key !== sortKey) {
      return <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    
    if (sortConfig.direction === 'asc') {
      return <ChevronUp className="w-4 h-4 text-primary" />;
    } else if (sortConfig.direction === 'desc') {
      return <ChevronDown className="w-4 h-4 text-primary" />;
    }
    
    return <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <TableHead className={className}>
      <button
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-2 hover:text-primary transition-colors font-semibold"
      >
        {children}
        {getSortIcon()}
      </button>
    </TableHead>
  );
};
