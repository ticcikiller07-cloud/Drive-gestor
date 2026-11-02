/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeFileName,
  normalizeCategory,
  formatFileSize,
  getFileCategoryIcon,
  isWorkspaceDoc,
  getExportMimeType,
  calculateOrganizationPlan,
  DriveFileItem,
} from './fileOrganizerUtils.js';

test('sanitizeFileName removes invalid characters and preserves extension', () => {
  assert.equal(sanitizeFileName('factura:luz*2024?.pdf', 'orig.pdf'), 'factura_luz_2024_.pdf');
  assert.equal(sanitizeFileName('archivo con espacios y / barra.png', 'test.png'), 'archivo con espacios y _ barra.png');
  assert.equal(sanitizeFileName('', 'mi_documento.docx'), 'mi_documento.docx');
  assert.equal(sanitizeFileName('Contrato_Final', 'Contrato.pdf'), 'Contrato_Final.pdf');
});

test('normalizeCategory normalizes names and handles title casing in Spanish', () => {
  assert.equal(normalizeCategory('facturas y recibos'), 'Facturas y Recibos');
  assert.equal(normalizeCategory('  trabajo  de  investigacion '), 'Trabajo de Investigacion');
  assert.equal(normalizeCategory(''), 'General');
  assert.equal(normalizeCategory('documentos/legales:2024'), 'Documentos Legales 2024');
});

test('formatFileSize formats human-readable strings', () => {
  assert.equal(formatFileSize(undefined), 'Doc en la nube');
  assert.equal(formatFileSize(0), '0 B');
  assert.equal(formatFileSize(512), '512 B');
  assert.equal(formatFileSize(2048), '2.0 KB');
  assert.equal(formatFileSize(1048576 * 2.5), '2.5 MB');
});

test('getFileCategoryIcon identifies file kinds correctly', () => {
  assert.equal(getFileCategoryIcon('application/pdf', 'recibo.pdf'), 'pdf');
  assert.equal(getFileCategoryIcon('application/vnd.google-apps.document', 'Informe'), 'doc');
  assert.equal(getFileCategoryIcon('application/vnd.google-apps.spreadsheet', 'Presupuesto'), 'sheet');
  assert.equal(getFileCategoryIcon('application/vnd.google-apps.presentation', 'Diapositivas'), 'slide');
  assert.equal(getFileCategoryIcon('image/jpeg', 'foto.jpg'), 'image');
  assert.equal(getFileCategoryIcon('video/mp4', 'video.mp4'), 'video');
  assert.equal(getFileCategoryIcon('audio/mpeg', 'audio.mp3'), 'audio');
});

test('isWorkspaceDoc recognizes Google Docs/Sheets/Slides', () => {
  assert.equal(isWorkspaceDoc('application/vnd.google-apps.document'), true);
  assert.equal(isWorkspaceDoc('application/vnd.google-apps.spreadsheet'), true);
  assert.equal(isWorkspaceDoc('application/vnd.google-apps.presentation'), true);
  assert.equal(isWorkspaceDoc('application/vnd.google-apps.folder'), false);
  assert.equal(isWorkspaceDoc('application/pdf'), false);
});

test('getExportMimeType returns correct text or csv export specs', () => {
  assert.deepEqual(getExportMimeType('application/vnd.google-apps.document'), {
    exportMime: 'text/plain',
    ext: 'txt',
    mode: 'text',
  });
  assert.deepEqual(getExportMimeType('application/vnd.google-apps.spreadsheet'), {
    exportMime: 'text/csv',
    ext: 'csv',
    mode: 'text',
  });
  assert.equal(getExportMimeType('application/pdf'), null);
});

test('calculateOrganizationPlan computes approved counts and grouped categories', () => {
  const dummyFiles: DriveFileItem[] = [
    {
      id: '1',
      name: 'Scan001.pdf',
      mimeType: 'application/pdf',
      status: 'done',
      suggestedName: 'Factura_Internet_Mayo.pdf',
      suggestedCategory: 'Facturas y Recibos',
      approved: true,
    },
    {
      id: '2',
      name: 'IMG_4920.jpg',
      mimeType: 'image/jpeg',
      status: 'done',
      suggestedName: 'Foto_Viaje_Familia.jpg',
      suggestedCategory: 'Fotos Personales',
      approved: true,
    },
    {
      id: '3',
      name: 'Scan002.pdf',
      mimeType: 'application/pdf',
      status: 'done',
      suggestedName: 'Factura_Luz_Mayo.pdf',
      suggestedCategory: 'Facturas y Recibos',
      approved: false,
    },
    {
      id: '4',
      name: 'corrupt.bin',
      mimeType: 'application/octet-stream',
      status: 'failed',
      approved: false,
    },
  ];

  const plan = calculateOrganizationPlan(dummyFiles);
  assert.equal(plan.totalFiles, 4);
  assert.equal(plan.approvedCount, 2);
  assert.equal(plan.rejectedCount, 2);
  assert.equal(plan.failedCount, 1);
  assert.equal(plan.categories['Facturas y Recibos'], 1);
  assert.equal(plan.categories['Fotos Personales'], 1);
  assert.deepEqual(plan.categoryList, ['Facturas y Recibos', 'Fotos Personales']);
});
