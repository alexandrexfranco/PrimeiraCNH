import { getAccessToken } from './firebase';

export async function ensureSheetsExist(spreadsheetId: string, sheetTitles: string[]) {
  const token = await getAccessToken();
  if (!token) throw new Error("Não autenticado no Google.");

  // Get current sheets
  const getResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!getResponse.ok) {
     throw new Error(`Failed to fetch spreadsheet info: ${await getResponse.text()}`);
  }

  const spreadsheet = await getResponse.json();
  const existingTitles = spreadsheet.sheets.map((s: any) => s.properties.title);

  const missingSheets = sheetTitles.filter(title => !existingTitles.includes(title));

  if (missingSheets.length > 0) {
    const requests = missingSheets.map(title => ({
      addSheet: {
        properties: {
          title
        }
      }
    }));

    const updateResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ requests })
      }
    );

    if (!updateResponse.ok) {
       throw new Error(`Failed to create missing sheets: ${await updateResponse.text()}`);
    }
  }
}

export async function fetchSpreadsheetData(spreadsheetId: string, range: string) {
  const token = await getAccessToken();
  if (!token) throw new Error("Não autenticado no Google.");

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Google Sheets API Error (${response.status}): ${errorDetails}`);
  }

  const data = await response.json();
  return data.values || [];
}

export async function writeSpreadsheetData(spreadsheetId: string, range: string, values: any[][]) {
  const token = await getAccessToken();
  if (!token) throw new Error("Não autenticado no Google.");

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        range,
        values
      })
    }
  );

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`Google Sheets API Error (${response.status}): ${errorDetails}`);
  }

  return response.json();
}
