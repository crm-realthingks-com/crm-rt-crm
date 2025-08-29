
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Download, FileText } from 'lucide-react';
import { useMeetingsImportExport } from '@/hooks/useMeetingsImportExport';
import { useToast } from '@/hooks/use-toast';

interface MeetingsImportExportProps {
  onImportComplete?: () => void;
}

export const MeetingsImportExport = ({ onImportComplete }: MeetingsImportExportProps) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { exportMeetings, importMeetings, isProcessing } = useMeetingsImportExport();
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    try {
      const text = await file.text();
      await importMeetings(text);
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Import / Export Meetings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={exportMeetings}
            disabled={isProcessing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Drag and drop a CSV file here, or click Import CSV to select a file
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Required columns: title, start_time, end_time
          </p>
        </div>

        {isProcessing && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Processing...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
