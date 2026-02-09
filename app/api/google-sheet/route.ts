// ============================================================================
// /app/api/sheets/route.ts - Complete Google Sheets CRUD API
// ============================================================================

import { google, sheets_v4 } from "googleapis";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { z, ZodError } from "zod";

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  serviceAccount: {
    email: process.env.GOOGLE_CLIENT_EMAIL!,
    privateKey: process.env.GOOGLE_PRIVATE_KEY!,
  },
  spreadsheetId: process.env.GOOGLE_SHEET_ID!,
  sheetName: process.env.SHEET_NAME || "Sheet1",
  dataStartRow: 2,
} as const;

function validateConfig() {
  const missing: string[] = [];

  if (!CONFIG.serviceAccount.email) missing.push("GOOGLE_CLIENT_EMAIL");
  if (!CONFIG.serviceAccount.privateKey) missing.push("GOOGLE_PRIVATE_KEY");
  if (!CONFIG.spreadsheetId) missing.push("GOOGLE_SHEET_ID");

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface SheetRecord {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SheetRowLocation {
  rowIndex: number;
  sheetRowNumber: number;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createRecordSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email format").max(100),
  role: z.string().min(1, "Role is required").max(50),
});

const updateRecordSchema = createRecordSchema.extend({
  id: z.string().uuid("Invalid ID format"),
});

const deleteRecordSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

// ============================================================================
// LOGGER
// ============================================================================

type LogLevel = "info" | "warn" | "error";

interface LogContext {
  operation?: string;
  recordId?: string;
  error?: unknown;
  [key: string]: unknown;
}

class Logger {
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, ...context };

    if (level === "error") {
      console.error(JSON.stringify(logEntry));
    } else if (level === "warn") {
      console.warn(JSON.stringify(logEntry));
    } else if (process.env.NODE_ENV === "development") {
      console.log(JSON.stringify(logEntry, null, 2));
    }
  }

  info(message: string, context?: LogContext) {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log("warn", message, context);
  }

  error(message: string, context?: LogContext) {
    this.log("error", message, context);
  }
}

const logger = new Logger();

// ============================================================================
// GOOGLE SHEETS SERVICE
// ============================================================================

class GoogleSheetsService {
  private sheets: sheets_v4.Sheets;
  private spreadsheetId: string;
  private sheetName: string;
  private dataStartRow: number;

  constructor() {
    validateConfig();

    const auth = new google.auth.JWT({
      email: CONFIG.serviceAccount.email,
      key: CONFIG.serviceAccount.privateKey.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    this.sheets = google.sheets({ version: "v4", auth });
    this.spreadsheetId = CONFIG.spreadsheetId;
    this.sheetName = CONFIG.sheetName;
    this.dataStartRow = CONFIG.dataStartRow;
  }

  private getDataRange(): string {
    return `${this.sheetName}!A${this.dataStartRow}:Z`;
  }

  private getRowRange(rowNumber: number): string {
    return `${this.sheetName}!A${rowNumber}:Z${rowNumber}`;
  }

  private parseRecord(row: string[]): SheetRecord | null {
    if (!row || row.length < 4) return null;
    return {
      id: row[0] || "",
      name: row[1] || "",
      email: row[2] || "",
      role: row[3] || "",
    };
  }

  private recordToValues(record: SheetRecord): string[] {
    return [record.id, record.name, record.email, record.role];
  }

  private async getSheetId(): Promise<number> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const sheet = response.data.sheets?.find(
        (s) => s.properties?.title === this.sheetName,
      );

      if (!sheet?.properties?.sheetId) {
        throw new Error(`Sheet "${this.sheetName}" not found`);
      }

      return sheet.properties.sheetId;
    } catch (error) {
      logger.error("Failed to get sheet ID", { error });
      throw error;
    }
  }

  private async findRecordLocation(
    id: string,
  ): Promise<SheetRowLocation | null> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: this.getDataRange(),
      });

      const values = response.data.values || [];
      const rowIndex = values.findIndex((row) => row[0] === id);

      if (rowIndex === -1) return null;

      return {
        rowIndex,
        sheetRowNumber: rowIndex + this.dataStartRow,
      };
    } catch (error) {
      logger.error("Failed to find record", { recordId: id, error });
      throw error;
    }
  }

  async getAllRecords(): Promise<SheetRecord[]> {
    try {
      logger.info("Fetching all records");

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: this.getDataRange(),
      });

      const values = response.data.values || [];
      const records = values
        .map(this.parseRecord)
        .filter((record): record is SheetRecord => record !== null);

      logger.info("Successfully fetched records", { count: records.length });
      return records;
    } catch (error) {
      logger.error("Failed to fetch records", { error });
      throw new Error("Failed to read records from sheet");
    }
  }

  async createRecord(data: Omit<SheetRecord, "id">): Promise<SheetRecord> {
    try {
      const record: SheetRecord = {
        id: uuidv4(),
        ...data,
      };

      logger.info("Creating new record", { recordId: record.id });

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: this.getDataRange(),
        valueInputOption: "RAW",
        requestBody: {
          values: [this.recordToValues(record)],
        },
      });

      logger.info("Successfully created record", { recordId: record.id });
      return record;
    } catch (error) {
      logger.error("Failed to create record", { error });
      throw new Error("Failed to create record");
    }
  }

  async updateRecord(
    id: string,
    data: Omit<SheetRecord, "id">,
  ): Promise<SheetRecord> {
    try {
      logger.info("Updating record", { recordId: id });

      const location = await this.findRecordLocation(id);

      if (!location) {
        throw new Error(`Record with ID ${id} not found`);
      }

      const record: SheetRecord = { id, ...data };

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: this.getRowRange(location.sheetRowNumber),
        valueInputOption: "RAW",
        requestBody: {
          values: [this.recordToValues(record)],
        },
      });

      logger.info("Successfully updated record", { recordId: id });
      return record;
    } catch (error) {
      logger.error("Failed to update record", { recordId: id, error });
      throw error;
    }
  }

  async deleteRecord(id: string): Promise<void> {
    try {
      logger.info("Deleting record", { recordId: id });

      const location = await this.findRecordLocation(id);

      if (!location) {
        throw new Error(`Record with ID ${id} not found`);
      }

      const sheetId = await this.getSheetId();

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: "ROWS",
                  startIndex: location.sheetRowNumber - 1,
                  endIndex: location.sheetRowNumber,
                },
              },
            },
          ],
        },
      });

      logger.info("Successfully deleted record", { recordId: id });
    } catch (error) {
      logger.error("Failed to delete record", { recordId: id, error });
      throw error;
    }
  }

  async bulkCreateRecords(
    dataArray: Omit<SheetRecord, "id">[],
  ): Promise<SheetRecord[]> {
    try {
      logger.info("Bulk creating records", { count: dataArray.length });

      const records: SheetRecord[] = dataArray.map((data) => ({
        id: uuidv4(),
        ...data,
      }));

      const values = records.map(this.recordToValues);

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: this.getDataRange(),
        valueInputOption: "RAW",
        requestBody: { values },
      });

      logger.info("Successfully bulk created records", {
        count: records.length,
      });
      return records;
    } catch (error) {
      logger.error("Failed to bulk create records", { error });
      throw new Error("Failed to bulk create records");
    }
  }
}

const sheetsService = new GoogleSheetsService();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function errorResponse(message: string, status: number, details?: string) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details && { details }),
    },
    { status },
  );
}

function handleValidationError(error: ZodError) {
  const details = error.issues
    .map((e) => `${e.path.join(".")}: ${e.message}`)
    .join(", ");
  return errorResponse("Validation failed", 400, details);
}

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * GET - Fetch all records
 */
export async function GET() {
  try {
    const records = await sheetsService.getAllRecords();

    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (error) {
    logger.error("GET /api/sheets failed", { error });
    return errorResponse("Failed to fetch records", 500);
  }
}

/**
 * POST - Create new record
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = createRecordSchema.parse(body);
    const record = await sheetsService.createRecord(validatedData);

    return NextResponse.json(
      {
        success: true,
        data: record,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error);
    }

    logger.error("POST /api/sheets failed", { error });
    return errorResponse("Failed to create record", 500);
  }
}

/**
 * PUT - Update existing record
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const validatedData = updateRecordSchema.parse(body);

    const record = await sheetsService.updateRecord(validatedData.id, {
      name: validatedData.name,
      email: validatedData.email,
      role: validatedData.role,
    });

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error);
    }

    if (error instanceof Error && error.message.includes("not found")) {
      return errorResponse("Record not found", 404, error.message);
    }

    logger.error("PUT /api/sheets failed", { error });
    return errorResponse("Failed to update record", 500);
  }
}

/**
 * DELETE - Remove record
 */
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const validatedData = deleteRecordSchema.parse(body);

    await sheetsService.deleteRecord(validatedData.id);

    return NextResponse.json({
      success: true,
      message: "Record deleted successfully",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error);
    }

    if (error instanceof Error && error.message.includes("not found")) {
      return errorResponse("Record not found", 404, error.message);
    }

    logger.error("DELETE /api/sheets failed", { error });
    return errorResponse("Failed to delete record", 500);
  }
}
