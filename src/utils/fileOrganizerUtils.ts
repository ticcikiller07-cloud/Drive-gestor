/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  iconLink?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  modifiedTime?: string;
  // Analysis status
  status: 'pending' | 'analyzing' | 'done' | 'failed' | 'skipped';
  summary?: string;
  suggestedName?: string;
  suggestedCategory?: string;
  // User review choices
  approved: boolean;
  editedName?: string;
  editedCategory?: string;
  errorMessage?: string;
  // Execution status
  moveStatus?: 'pending' | 'moving' | 'success' | 'failed';
  moveError?: string;
}

export interface OrganizationSummary {
  totalFiles: number;
  approvedCount: number;
  rejectedCount: number;
  failedCount: number;
  categories: { [categoryName: string]: number };
  categoryList: string[];
}

/**
 * Sanitizes a file name removing unsafe filesystem characters.
 * Preserves the file extension if present.
 */
export function sanitizeFileName(name: string, fallbackOriginal: string = 'archivo'): string {
  if (!name || !name.trim()) {
    return fallbackOriginal.trim() || 'archivo_sin_nombre';
  }

  // Remove invalid characters for files across OS & cloud: \ / : * ? " < > |
  let cleaned = name.replace(/[\\/:*?"<>|]/g, '_').trim();

  // Compress duplicate underscores
  cleaned = cleaned.replace(/_{2,}/g, '_');
  // Compress duplicate spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' ');

  // Strip leading or trailing periods or underscores
  cleaned = cleaned.replace(/^[._]+|[._]+$/g, '').trim();

  if (!cleaned) {
    return fallbackOriginal.trim() || 'archivo_sin_nombre';
  }

  // Ensure extension is kept if original had one
  const originalExtMatch = fallbackOriginal.match(/\.([a-zA-Z0-9_-]+)$/);
  const currentExtMatch = cleaned.match(/\.([a-zA-Z0-9_-]+)$/);

  if (originalExtMatch && !currentExtMatch) {
    cleaned = `${cleaned}.${originalExtMatch[1]}`;
  }

  return cleaned;
}

/**
 * Normalizes category names to title case and trims invalid characters.
 */
export function normalizeCategory(category?: string, defaultCategory: string = 'General'): string {
  if (!category || !category.trim()) {
    return defaultCategory;
  }

  let cleaned = category.replace(/[\\/:*?"<>|]/g, ' ').trim();
  cleaned = cleaned.replace(/\s+/g, ' ');

  if (!cleaned) {
    return defaultCategory;
  }

  // Capitalize words
  return cleaned
    .split(' ')
    .map(word => {
      if (word.length <= 3 && ['de', 'en', 'y', 'e', 'la', 'el', 'los', 'las', 'del', 'a'].includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Formats a file size into readable units (KB, MB, GB).
 */
export function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes)) {
    return 'Doc en la nube';
  }
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Maps MIME types to high level file categories for iconography.
 */
export function getFileCategoryIcon(mimeType: string, fileName: string = ''): 'pdf' | 'doc' | 'sheet' | 'slide' | 'image' | 'video' | 'audio' | 'archive' | 'text' | 'file' {
  const lowerMime = (mimeType || '').toLowerCase();
  const lowerName = fileName.toLowerCase();

  if (lowerMime.includes('pdf') || lowerName.endsWith('.pdf')) return 'pdf';
  if (lowerMime.includes('google-apps.document') || lowerMime.includes('word') || lowerMime.includes('officedocument.wordprocessingml') || lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) return 'doc';
  if (lowerMime.includes('google-apps.spreadsheet') || lowerMime.includes('excel') || lowerMime.includes('spreadsheet') || lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv')) return 'sheet';
  if (lowerMime.includes('google-apps.presentation') || lowerMime.includes('powerpoint') || lowerMime.includes('presentation') || lowerName.endsWith('.pptx') || lowerName.endsWith('.ppt')) return 'slide';
  if (lowerMime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(lowerName)) return 'image';
  if (lowerMime.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm)$/.test(lowerName)) return 'video';
  if (lowerMime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac)$/.test(lowerName)) return 'audio';
  if (lowerMime.includes('zip') || lowerMime.includes('tar') || lowerMime.includes('rar') || /\.(zip|rar|7z|tar|gz)$/.test(lowerName)) return 'archive';
  if (lowerMime.startsWith('text/') || /\.(txt|md|json|html|xml)$/.test(lowerName)) return 'text';

  return 'file';
}

/**
 * Checks if a file is a Google Workspace proprietary file format.
 */
export function isWorkspaceDoc(mimeType: string): boolean {
  return (mimeType || '').startsWith('application/vnd.google-apps.') &&
    mimeType !== 'application/vnd.google-apps.folder';
}

/**
 * Determines the export MIME type for Google Workspace documents.
 */
export function getExportMimeType(mimeType: string): { exportMime: string; ext: string; mode: 'text' | 'pdf' } | null {
  if (mimeType === 'application/vnd.google-apps.document') {
    return { exportMime: 'text/plain', ext: 'txt', mode: 'text' };
  }
  if (mimeType === 'application/vnd.google-apps.spreadsheet') {
    return { exportMime: 'text/csv', ext: 'csv', mode: 'text' };
  }
  if (mimeType === 'application/vnd.google-apps.presentation') {
    return { exportMime: 'text/plain', ext: 'txt', mode: 'text' };
  }
  return null;
}

/**
 * Computes statistical summary and category plan for the review/confirmation step.
 */
export function calculateOrganizationPlan(files: DriveFileItem[]): OrganizationSummary {
  const summary: OrganizationSummary = {
    totalFiles: files.length,
    approvedCount: 0,
    rejectedCount: 0,
    failedCount: 0,
    categories: {},
    categoryList: [],
  };

  for (const file of files) {
    if (file.status === 'failed') {
      summary.failedCount++;
    }

    if (file.approved) {
      summary.approvedCount++;
      const category = normalizeCategory(file.editedCategory || file.suggestedCategory || 'Sin clasificar');
      summary.categories[category] = (summary.categories[category] || 0) + 1;
    } else {
      summary.rejectedCount++;
    }
  }

  summary.categoryList = Object.keys(summary.categories).sort();
  return summary;
}
