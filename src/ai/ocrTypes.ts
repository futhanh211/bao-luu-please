import {
  MedicalEvidenceDetails,
  MilitaryEvidenceDetails,
  HardshipEvidenceDetails,
  PersonalEvidenceDetails,
  UploadedEvidenceFile,
} from '../data/studentFormData';
import { StudentEvidenceOptionKey } from '../data/customTestData';

export type OcrDocumentType = StudentEvidenceOptionKey;

export interface ExtractedOcrField {
  key: string;
  label: string;
  value: string | boolean;
  confidence: number;
}

export interface OcrScanResult {
  documentType: OcrDocumentType;
  confidence: number;
  extractedCount: number;
  summary: string;
  rawText?: string;
  data: {
    medical?: Partial<MedicalEvidenceDetails>;
    military?: Partial<MilitaryEvidenceDetails>;
    hardship?: Partial<HardshipEvidenceDetails>;
    personal?: Partial<PersonalEvidenceDetails>;
  };
  fields: ExtractedOcrField[];
}

export type {
  MedicalEvidenceDetails,
  MilitaryEvidenceDetails,
  HardshipEvidenceDetails,
  PersonalEvidenceDetails,
  UploadedEvidenceFile,
  StudentEvidenceOptionKey,
};
