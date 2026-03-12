import * as XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import type { SpreadsheetRow } from '../types.js';

const COLUMN_MAP: Record<string, keyof SpreadsheetRow> = {
  'time':             'time',
  '#time':            'time',
  'script':           'script',
  'voice':            'voice_over',
  'voice-over':       'voice_over',
  'emotion':          'emotion',
  'idea':             'idea',
  'shot':             'shot_type',
  'roll':             'roll_type',
  'frame a':          'frame_a_prompt',
  'frame b':          'frame_b_prompt',
  'video prompt':     'video_prompt',
  'motion':           'video_prompt',
  'text overlay':     'text_overlay',
  'sound':            'sound_design',
  'camera':           'camera_movement',
  'music':            'music_intensity',
  'status':           'status',
  'link':             'drive_link',
  'drive':            'drive_link',
};

function mapHeader(header: string): keyof SpreadsheetRow | null {
  const lower = header.toLowerCase().trim();
  for (const [key, field] of Object.entries(COLUMN_MAP)) {
    if (lower.includes(key)) return field;
  }
  return null;
}

function rowsToScenes(headers: string[], dataRows: string[][]): SpreadsheetRow[] {
  const fieldMap = headers.map(h => mapHeader(h));
  return dataRows
    .filter(row => row.some(cell => cell?.toString().trim()))
    .map(row => {
      const obj: Partial<SpreadsheetRow> = {};
      fieldMap.forEach((field, i) => {
        if (field && row[i] !== undefined && row[i] !== null) {
          (obj as any)[field] = row[i].toString().trim();
        }
      });
      return {
        ...obj,
        status: (['Criar imagem', 'Criar vídeo', 'Fazer nada'].includes(obj.status as string)
          ? obj.status
          : 'Fazer nada') as SpreadsheetRow['status'],
      };
    });
}

export function parseXLSX(filepath: string): SpreadsheetRow[] {
  const workbook = XLSX.readFile(filepath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });

  if (rawRows.length < 2) return [];
  const [headers, ...dataRows] = rawRows as string[][];
  return rowsToScenes(headers, dataRows);
}

export function parseCSV(filepath: string): SpreadsheetRow[] {
  const content = fs.readFileSync(filepath, 'utf-8');
  const records = parse(content, {
    columns: false,
    skip_empty_lines: true,
    trim: true,
  }) as string[][];

  if (records.length < 2) return [];
  const [headers, ...dataRows] = records;
  return rowsToScenes(headers, dataRows);
}
