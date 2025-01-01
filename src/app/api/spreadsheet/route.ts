import { google, sheets_v4 } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

interface RequestBody {
  email: string;
}

const authenticateGoogleSheets = async () => {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error("Google service account credentials are not set.");
  }

  const credentials = JSON.parse(serviceAccountKey);

  if (!credentials.private_key) {
    throw new Error("Invalid service account credentials.");
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: RequestBody = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Missing 'email' field in the request body." },
        { status: 400 }
      );
    }

    const sheets: sheets_v4.Sheets = await authenticateGoogleSheets();

    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const range = "Sheet1!A:A"; 
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[email]],
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred.";
    console.error("Error writing to Google Sheet:", errorMessage);

    return NextResponse.json(
      { error: "An error occurred while writing to the sheet." },
      { status: 500 }
    );
  }
}
