import type { OAuth2Client } from 'google-auth-library';
import type { SpreadsheetRow } from '../types.js';

// Column header mapping (case-insensitive, partial match)
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

export function extractSheetId(url: string): string {
  // https://docs.google.com/spreadsheets/d/{id}/...
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) throw new Error(`Cannot extract sheet ID from URL: ${url}`);
  return match[1];
}

export async function readSheets(spreadsheetId: string, auth: OAuth2Client): Promise<SpreadsheetRow[]> {
  const { google } = await import('googleapis');
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'A1:Z1000',
  });

  const rows = res.data.values;
  if (!rows || rows.length < 2) return [];

  const headers = rows[0] as string[];
  const fieldMap: (keyof SpreadsheetRow | null)[] = headers.map(h => mapHeader(h));

  return rows.slice(1).map(row => {
    const obj: Partial<SpreadsheetRow> = {};
    fieldMap.forEach((field, i) => {
      if (field && row[i] !== undefined) {
        (obj as any)[field] = row[i];
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

export async function updateDriveLink(
  spreadsheetId: string,
  rowIndex: number,      // 0-based data row (0 = first data row, not header)
  link: string,
  auth: OAuth2Client
): Promise<void> {
  const { google } = await import('googleapis');
  const sheets = google.sheets({ version: 'v4', auth });

  // Find header row to locate "Link do drive" column
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: '1:1',
  });
  const headers = (headerRes.data.values?.[0] || []) as string[];
  const colIndex = headers.findIndex(h => h.toLowerCase().includes('link') || h.toLowerCase().includes('drive'));
  if (colIndex < 0) return; // No link column, skip

  // rowIndex is 0-based data row; +2 because row 1 = header, 1-indexed
  const sheetRow = rowIndex + 2;
  const colLetter = String.fromCharCode(65 + colIndex); // A=65

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${colLetter}${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[link]] },
  });
}
