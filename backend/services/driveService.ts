import type { OAuth2Client } from 'google-auth-library';

async function getGoogle() {
  const { google } = await import('googleapis');
  return google;
}

async function drive(auth: OAuth2Client) {
  const google = await getGoogle();
  return google.drive({ version: 'v3', auth });
}

export async function createSubfolder(
  parentFolderId: string,
  name: string,
  auth: OAuth2Client
): Promise<{ id: string; webViewLink: string }> {
  const d = await drive(auth);
  const res = await d.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    },
    fields: 'id, webViewLink',
  });
  if (!res.data.id) throw new Error('Failed to create Drive folder');
  // Make it accessible by link
  await d.permissions.create({
    fileId: res.data.id,
    requestBody: { role: 'reader', type: 'anyone' },
  });
  // Re-fetch to get updated webViewLink
  const file = await d.files.get({ fileId: res.data.id, fields: 'id, webViewLink' });
  return {
    id: res.data.id,
    webViewLink: file.data.webViewLink || `https://drive.google.com/drive/folders/${res.data.id}`,
  };
}

export async function uploadFile(
  folderId: string,
  filename: string,
  buffer: Buffer,
  mimeType: string,
  auth: OAuth2Client
): Promise<string> {
  const { Readable } = await import('stream');
  const d = await drive(auth);
  const stream = Readable.from(buffer);
  const res = await d.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
    },
    media: { mimeType, body: stream },
    fields: 'id',
  });
  return res.data.id!;
}

export async function listImages(
  folderId: string,
  auth: OAuth2Client
): Promise<{ id: string; name: string }[]> {
  const d = await drive(auth);
  const res = await d.files.list({
    q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
    fields: 'files(id, name)',
    orderBy: 'name',
  });
  return (res.data.files || []).map(f => ({ id: f.id!, name: f.name! }));
}

export async function downloadFile(fileId: string, auth: OAuth2Client): Promise<Buffer> {
  const d = drive(auth);
  const res = await d.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );
  return Buffer.from(res.data as ArrayBuffer);
}

export function extractFolderIdFromLink(link: string): string {
  // https://drive.google.com/drive/folders/{folderId}
  const match = link.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (!match) throw new Error(`Cannot extract folder ID from link: ${link}`);
  return match[1];
}
