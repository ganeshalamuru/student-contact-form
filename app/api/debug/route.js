// Diagnostic route — checks file type via Drive API then Sheets API. Remove before production.
import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  const result = {
    sheetIdUsed: sheetId,
    clientEmailUsed: clientEmail,
    driveFile: null,
    sheetsMetadata: null,
    driveError: null,
    sheetsError: null,
  };

  const driveAuth = new google.auth.GoogleAuth({
    credentials: { type: 'service_account', client_email: clientEmail, private_key: privateKey },
    scopes: [
      'https://www.googleapis.com/auth/drive.metadata.readonly',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });

  // Step 1: Check what kind of file this ID belongs to via Drive API
  try {
    const drive = google.drive({ version: 'v3', auth: driveAuth });
    const file = await drive.files.get({
      fileId: sheetId,
      fields: 'id,name,mimeType',
      supportsAllDrives: true,
    });
    result.driveFile = file.data;
  } catch (err) {
    result.driveError = { message: err.message, code: err.code, reason: err.errors?.[0]?.reason };
  }

  // Step 2: Try Sheets API metadata regardless
  try {
    const sheetsAuth = new google.auth.GoogleAuth({
      credentials: { type: 'service_account', client_email: clientEmail, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth: sheetsAuth });
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    result.sheetsMetadata = {
      title: meta.data.properties?.title,
      tabs: meta.data.sheets?.map((s) => s.properties?.title),
    };
  } catch (err) {
    result.sheetsError = { message: err.message, code: err.code, reason: err.errors?.[0]?.reason };
  }

  return NextResponse.json(result);
}
