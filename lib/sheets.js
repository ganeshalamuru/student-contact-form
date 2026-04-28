// Server-side only — Google Sheets helper. Never import into client components.
import { google } from 'googleapis';

const SHEET_TAB = 'Student Contact Form';
const COLUMNS = [
  'District',
  'Student_Name',
  'Father_Name',
  'Mobile',
  'Group',
  'College_Name',
  'Remarks',
  'Date_time',
  'Comments',
];

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      type: 'service_account',
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function getSheetsClient() {
  return google.sheets({ version: 'v4', auth: getAuth() });
}

// Returns all non-empty rows as JSON objects keyed by column name.
// Row index is 1-based to match Sheets row numbers (header is row 1).
export async function getRows() {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_TAB}!A:I`,
  });

  const rows = res.data.values ?? [];
  // Skip header row (index 0)
  return rows.slice(1).reduce((acc, row, i) => {
    if (row.some((cell) => cell?.trim())) {
      acc.push({
        _rowIndex: i + 2, // Sheets row number (1-based, header at 1)
        ...Object.fromEntries(COLUMNS.map((col, j) => [col, row[j] ?? ''])),
      });
    }
    return acc;
  }, []);
}

// Appends a new student row. data should have keys matching COLUMNS (except Comments).
export async function appendRow(data) {
  const sheets = await getSheetsClient();
  const rowValues = COLUMNS.map((col) => data[col] ?? '');
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_TAB}!A:I`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [rowValues] },
  });
}

// Appends a timestamped comment entry to the Comments column (column I).
// Reads existing value first so history is never overwritten.
export async function updateComment(rowIndex, newComment) {
  const sheets = await getSheetsClient();

  const readRes = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_TAB}!I${rowIndex}`,
  });
  const existing = readRes.data.values?.[0]?.[0] ?? '';

  const ts = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const entry = `[${ts}] ${newComment.trim()}`;
  const updated = existing ? `${existing}\n${entry}` : entry;

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${SHEET_TAB}!I${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[updated]] },
  });

  return updated;
}
