/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DriveFileItem, isWorkspaceDoc, getExportMimeType, sanitizeFileName } from '../utils/fileOrganizerUtils.js';

export interface DriveFolder {
  id: string;
  name: string;
}

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';

/**
 * Fetches user's accessible folders in Google Drive.
 */
export async function listUserFolders(accessToken: string, parentId: string = 'root'): Promise<DriveFolder[]> {
  const query = parentId === 'root'
    ? "mimeType = 'application/vnd.google-apps.folder' and 'root' in parents and trashed = false"
    : `mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`;

  const url = `${DRIVE_API_URL}/files?q=${encodeURIComponent(query)}&fields=files(id,name)&pageSize=50&orderBy=name`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Failed to list folders:', errorText);
    throw new Error('No se pudieron listar las carpetas de Google Drive.');
  }

  const data = await res.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name || 'Carpeta sin nombre',
  }));
}

/**
 * Gets details of a single folder.
 */
export async function getFolderDetails(accessToken: string, folderId: string): Promise<DriveFolder> {
  if (folderId === 'root') {
    return { id: 'root', name: 'Mi Unidad (Raíz)' };
  }

  const res = await fetch(`${DRIVE_API_URL}/files/${folderId}?fields=id,name`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error('No se encontró la carpeta seleccionada.');
  }

  const data = await res.json();
  return { id: data.id, name: data.name || 'Carpeta seleccionada' };
}

/**
 * Lists all non-folder files inside a specific folder.
 */
export async function listFilesInFolder(accessToken: string, folderId: string): Promise<DriveFileItem[]> {
  const query = `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`;
  const url = `${DRIVE_API_URL}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,modifiedTime,iconLink,thumbnailLink,webViewLink)&pageSize=100`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Error fetching files:', errorText);
    throw new Error('No se pudieron cargar los archivos de la carpeta.');
  }

  const data = await res.json();
  const rawFiles = data.files || [];

  return rawFiles.map((f: any) => ({
    id: f.id,
    name: f.name || 'Archivo sin nombre',
    mimeType: f.mimeType || 'application/octet-stream',
    size: f.size ? parseInt(f.size, 10) : undefined,
    iconLink: f.iconLink,
    thumbnailLink: f.thumbnailLink,
    webViewLink: f.webViewLink,
    modifiedTime: f.modifiedTime,
    status: 'pending',
    approved: true,
  }));
}

/**
 * Downloads or exports file content suitable for Gemini analysis.
 */
export async function extractFileContentForGemini(
  accessToken: string,
  file: DriveFileItem
): Promise<{ textSnippet?: string; base64Data?: string; size?: number; skipped?: boolean }> {
  // If file is larger than 15MB, mark as skipped
  if (file.size && file.size > 15 * 1024 * 1024) {
    return { skipped: true, size: file.size };
  }

  // 1. Google Workspace files export
  if (isWorkspaceDoc(file.mimeType)) {
    const exportSpec = getExportMimeType(file.mimeType);
    if (exportSpec) {
      try {
        const exportUrl = `${DRIVE_API_URL}/files/${file.id}/export?mimeType=${encodeURIComponent(exportSpec.exportMime)}`;
        const res = await fetch(exportUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (res.ok) {
          const text = await res.text();
          return { textSnippet: text.slice(0, 8000), size: file.size };
        }
      } catch (e) {
        console.warn('Could not export Workspace doc, fallback to metadata:', e);
      }
    }
  }

  // 2. Plain text / CSV / JSON / Markdown
  if (
    file.mimeType.startsWith('text/') ||
    file.mimeType.includes('json') ||
    file.mimeType.includes('csv') ||
    /\.(txt|md|csv|json|log)$/i.test(file.name)
  ) {
    try {
      const res = await fetch(`${DRIVE_API_URL}/files/${file.id}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const text = await res.text();
        return { textSnippet: text.slice(0, 8000), size: file.size };
      }
    } catch (e) {
      console.warn('Could not read text media:', e);
    }
  }

  // 3. Images (JPEG, PNG, WebP) under 5MB -> Base64
  if (
    file.mimeType.startsWith('image/') &&
    (!file.size || file.size < 5 * 1024 * 1024)
  ) {
    try {
      const res = await fetch(`${DRIVE_API_URL}/files/${file.id}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const blob = await res.arrayBuffer();
        const base64Data = arrayBufferToBase64(blob);
        return { base64Data, size: file.size };
      }
    } catch (e) {
      console.warn('Could not read image:', e);
    }
  }

  // 4. PDF documents under 5MB -> Base64
  if (
    (file.mimeType.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')) &&
    (!file.size || file.size < 5 * 1024 * 1024)
  ) {
    try {
      const res = await fetch(`${DRIVE_API_URL}/files/${file.id}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const blob = await res.arrayBuffer();
        const base64Data = arrayBufferToBase64(blob);
        return { base64Data, size: file.size };
      }
    } catch (e) {
      console.warn('Could not read pdf:', e);
    }
  }

  return { size: file.size };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Searches for an existing subfolder by name inside a parent folder, or creates it.
 */
export async function getOrCreateSubfolder(
  accessToken: string,
  parentFolderId: string,
  categoryName: string
): Promise<string> {
  const safeName = categoryName.trim();
  const searchName = safeName.replace(/'/g, "\\'");
  const query = `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and name = '${searchName}' and trashed = false`;

  const searchRes = await fetch(`${DRIVE_API_URL}/files?q=${encodeURIComponent(query)}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
  }

  // Create folder
  const createRes = await fetch(`${DRIVE_API_URL}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: safeName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`No se pudo crear la carpeta "${safeName}": ${err}`);
  }

  const created = await createRes.json();
  return created.id;
}

/**
 * Renames and moves a file to a new target folder.
 * NEVER DELETES ANY FILE.
 */
export async function renameAndMoveFile(
  accessToken: string,
  fileId: string,
  currentParentId: string,
  targetFolderId: string,
  newFileName: string
): Promise<void> {
  const url = `${DRIVE_API_URL}/files/${fileId}?addParents=${targetFolderId}&removeParents=${currentParentId}&fields=id,name,parents`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: sanitizeFileName(newFileName),
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error al mover y renombrar archivo: ${errorText}`);
  }
}

/**
 * Mock files for testing / demo mode.
 */
export function getDemoFiles(): DriveFileItem[] {
  return [
    {
      id: 'demo-1',
      name: 'Scan_20240315_001.pdf',
      mimeType: 'application/pdf',
      size: 420 * 1024,
      status: 'pending',
      approved: true,
      modifiedTime: '2024-03-15T10:30:00.000Z',
    },
    {
      id: 'demo-2',
      name: 'IMG_20240410_183201.jpg',
      mimeType: 'image/jpeg',
      size: 1.8 * 1024 * 1024,
      status: 'pending',
      approved: true,
      modifiedTime: '2024-04-10T18:32:00.000Z',
    },
    {
      id: 'demo-3',
      name: 'Borrador Sin Titulo 1',
      mimeType: 'application/vnd.google-apps.document',
      size: undefined,
      status: 'pending',
      approved: true,
      modifiedTime: '2024-05-02T14:15:00.000Z',
    },
    {
      id: 'demo-4',
      name: 'Hoja de calculo sin titulo (3)',
      mimeType: 'application/vnd.google-apps.spreadsheet',
      size: undefined,
      status: 'pending',
      approved: true,
      modifiedTime: '2024-05-18T09:00:00.000Z',
    },
    {
      id: 'demo-5',
      name: 'Presentacion_reunion_marketing.pptx',
      mimeType: 'application/vnd.google-apps.presentation',
      size: undefined,
      status: 'pending',
      approved: true,
      modifiedTime: '2024-06-01T16:45:00.000Z',
    },
    {
      id: 'demo-6',
      name: 'Contrato_Alquiler_Piso_2024_firmado.pdf',
      mimeType: 'application/pdf',
      size: 2.1 * 1024 * 1024,
      status: 'pending',
      approved: true,
      modifiedTime: '2024-06-12T11:20:00.000Z',
    },
    {
      id: 'demo-7',
      name: 'archivo_corrupto_ilegible.bin',
      mimeType: 'application/octet-stream',
      size: 28 * 1024 * 1024, // > 15MB to trigger size rule
      status: 'pending',
      approved: false,
      modifiedTime: '2024-06-20T12:00:00.000Z',
    },
  ];
}
