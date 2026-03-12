import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { OAuth2Client } from 'google-auth-library';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets',
];

function getCredentialsPath() {
  return path.resolve(
    process.env.GOOGLE_OAUTH_CLIENT_FILE ||
    path.join(__dirname, '../../credentials/oauth_client.json')
  );
}

function getTokenPath() {
  return path.resolve(
    process.env.GOOGLE_TOKEN_FILE ||
    path.join(__dirname, '../../credentials/token.json')
  );
}

export async function loadOAuthClient(): Promise<OAuth2Client | null> {
  const credPath = getCredentialsPath();
  if (!fs.existsSync(credPath)) return null;

  const { google } = await import('googleapis');
  const creds = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
  const { client_secret, client_id, redirect_uris } = creds.installed || creds.web;
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

export function getAuthUrl(client: OAuth2Client): string {
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

export async function exchangeCode(client: OAuth2Client, code: string): Promise<void> {
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  fs.writeFileSync(getTokenPath(), JSON.stringify(tokens));
}

export function loadSavedToken(client: OAuth2Client): boolean {
  const tokenPath = getTokenPath();
  if (!fs.existsSync(tokenPath)) return false;
  const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
  client.setCredentials(tokens);
  return true;
}

export async function getConnectedClient(): Promise<OAuth2Client | null> {
  const client = await loadOAuthClient();
  if (!client) return null;
  const loaded = loadSavedToken(client);
  if (!loaded) return null;
  return client;
}

export function getConnectedEmail(client: OAuth2Client): string | undefined {
  const creds = client.credentials;
  if (!creds?.id_token) return undefined;
  try {
    const payload = JSON.parse(
      Buffer.from(creds.id_token.split('.')[1], 'base64').toString()
    );
    return payload.email;
  } catch {
    return undefined;
  }
}
