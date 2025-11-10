export enum GeminiModel {
  GeminiFlash = 'gemini-2.5-flash',
  GeminiPro = 'gemini-2.5-pro',
  LMStudio = 'lm-studio',
}

export enum AnnotationType {
  Caption = 'Caption',
  Tags = 'Tags',
}

export enum ImageStatus {
  Pending = 'Pending',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Error = 'Error',
}

export interface ImageFile {
  id: string;
  file: File;
  dataUrl: string;
}

export interface ImageResult extends ImageFile {
  status: ImageStatus;
  score?: number;
  reason?: string;
  annotation?: string;
}

export interface ScoreResponse {
  score: number;
  reason: string;
}
