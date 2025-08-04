
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { createDuplicateChecker } from "./import-export/duplicateChecker";
import { validateRecord } from "./import-export/recordValidator";
import { validateValues } from "./import-export/valueValidator";
import { getColumnConfig } from "./import-export/columnConfig";
import { mapHeaders } from "./import-export/headerMapper";

// Simple CSV parser
const parseCSVData = (csvContent: string): any[] => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }
  
  return data;
};

// Simple CSV export
const exportToCSV = async (data: any[], filename: string, columnConfig: any, options: any = {}) => {
  const headers = columnConfig.allowedColumns.join(',');
  const rows = data.map(item => 
    columnConfig.allowedColumns.map(col => {
      const value = item[col] || '';
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    }).join(',')
  );
  
  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

interface UseImportExportProps {
  tableName: 'contacts' | 'deals';
  existingData: any[];
  onImport: (data: any[]) => Promise<void>;
  onExport?: (data: any[]) => void;
}

export const useImportExport = ({ 
  tableName, 
  existingData, 
  onImport, 
  onExport 
}: UseImportExportProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const duplicateChecker = createDuplicateChecker(tableName);

  const handleImport = useCallback(async (file: File) => {
    if (!file) return;
    
    setIsImporting(true);
    
    try {
      const fileContent = await file.text();
      const parsedData = parseCSVData(fileContent);
      
      if (parsedData.length === 0) {
        toast({
          title: "Error",
          description: "CSV file is empty or invalid",
          variant: "destructive",
        });
        return;
      }

      console.log(`Parsed ${parsedData.length} records from CSV`);
      
      const columnConfig = getColumnConfig(tableName);
      const mappedData = parsedData.map(row => mapHeaders(row, { ...columnConfig, table: tableName }));
      
      // Validate records
      const validRecords = [];
      const errors = [];
      
      for (let i = 0; i < mappedData.length; i++) {
        const record = mappedData[i];
        const recordValidation = validateRecord(record, tableName);
        const valueValidation = validateValues(record, tableName);
        
        if (recordValidation.isValid && valueValidation.isValid) {
          validRecords.push(record);
        } else {
          const errorMessages = [
            ...recordValidation.errors,
            ...valueValidation.errors
          ];
          errors.push(`Row ${i + 2}: ${errorMessages.join(', ')}`);
        }
      }
      
      if (errors.length > 0) {
        console.warn("Validation errors:", errors);
        toast({
          title: "Validation Warnings",
          description: `${validRecords.length} valid records found, ${errors.length} records skipped due to validation errors.`,
          variant: "default",
        });
      }
      
      if (validRecords.length === 0) {
        toast({
          title: "Error",
          description: "No valid records found in CSV file",
          variant: "destructive",
        });
        return;
      }
      
      // Check for duplicates
      const duplicates = await duplicateChecker(validRecords);
      const newRecords = validRecords.filter(record => 
        !duplicates.some(dup => dup.importRecord === record)
      );
      const updates = duplicates.map(dup => ({ ...dup.importRecord, shouldUpdate: true }));
      
      console.log(`Found ${newRecords.length} new records and ${updates.length} updates`);
      
      const finalData = [...newRecords, ...updates];
      
      await onImport(finalData);
      
      toast({
        title: "Import successful",
        description: `Imported ${newRecords.length} new records and updated ${updates.length} existing records`,
      });
      
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Error",
        description: "Failed to import CSV file. Please check the file format.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  }, [tableName, existingData, onImport, duplicateChecker, toast]);

  const handleExport = useCallback(async (data: any[], options: any = {}) => {
    if (!data || data.length === 0) {
      toast({
        title: "Warning",
        description: "No data to export",
        variant: "default",
      });
      return;
    }
    
    setIsExporting(true);
    
    try {
      const columnConfig = getColumnConfig(tableName);
      await exportToCSV(data, `${tableName}_export`, columnConfig, options);
      
      if (onExport) {
        onExport(data);
      }
      
      toast({
        title: "Export successful",
        description: `Exported ${data.length} records`,
      });
      
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [tableName, onExport, toast]);

  return {
    handleImport,
    handleExport,
    isImporting,
    isExporting,
  };
};
