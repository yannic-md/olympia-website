export interface ImportResponse {
  importLogId?: number;
  status: 'COMPLETED' | 'FAILED' | 'PARTIAL';
  importType: 'COUNTRIES' | 'ATHLETES' | 'RESULTS';
  filename: string;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  message: string;
  errors?: ImportError[];
}

export interface ImportError {
  rowNumber: number;
  errorCode: string;
  errorMessage: string;
  fieldName?: string;
  fieldValue?: string;
}

