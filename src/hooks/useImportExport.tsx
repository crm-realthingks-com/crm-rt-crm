
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  parseCSVData, 
  exportToCSV,
  ExportOptions 
} from "@/utils/csvUtils";
import { createDuplicateChecker } from "./import-export/duplicateChecker";
import { validateRecord } from "./import-export/recordValidator";
import { validateValues } from "./import-export/valueValidator";
import { getColumnConfig } from "./import-export/columnConfig";
import { mapHeaders } from "./import-export/headerMapper";

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

  const duplicateChecker = createDuplicateChecker(tableName as 'contacts' | 'deals');

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
      const mappedData = parsedData.map(row => mapHeaders(row, columnConfig));
      
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
            ...(!recordValidation.isValid ? recordValidation.errors : []),
            ...(!valueValidation.isValid ? valueValidation.errors : [])
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
      const { newRecords, updates } = duplicateChecker.processRecords(validRecords, existingData);
      
      console.log(`Found ${newRecords.length} new records and ${updates.length} updates`);
      
      const finalData = [...newRecords, ...updates.map(update => ({ ...update, shouldUpdate: true }))];
      
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

  const handleExport = useCallback(async (data: any[], options: ExportOptions = {}) => {
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
