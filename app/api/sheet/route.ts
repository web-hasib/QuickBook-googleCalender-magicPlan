// // /app/api/google-sheet/route.ts
// import { google, sheets_v4 } from "googleapis";
// import { NextResponse } from "next/server";
// import { v4 as uuidv4 } from "uuid";
// import { z, ZodError } from "zod";

// // ============================================================================
// // 1. CONFIGURATION & SCHEMA
// // ============================================================================

// const CONFIG = {
//   email: process.env.GOOGLE_CLIENT_EMAIL,
//   // Key fix: replace escaped newlines often found in environment variables
//   privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
//   spreadsheetId: process.env.GOOGLE_SHEET_ID,
//   sheetName: process.env.SHEET_NAME || "Sheet1",
//   dataStartRow: 2, // Row 1 is headers: ID, Name, Email, Role
// } as const;

// const recordSchema = z.object({
//   name: z.string().min(1, "Name is required"),
//   email: z.string().email("Invalid email format"),
//   role: z.string().min(1, "Role is required"),
// });

// type Record = z.infer<typeof recordSchema> & { id: string };

// // ============================================================================
// // 2. GOOGLE SHEETS SERVICE
// // ============================================================================

// class GoogleSheetsService {
//   private sheets: sheets_v4.Sheets | null = null;
//   private initialized = false;

//   constructor() {
//     try {
//       if (!CONFIG.email || !CONFIG.privateKey || !CONFIG.spreadsheetId) {
//         console.error("❌ Missing required environment variables:");
//         console.error("  - GOOGLE_CLIENT_EMAIL:", !!CONFIG.email);
//         console.error("  - GOOGLE_PRIVATE_KEY:", !!CONFIG.privateKey);
//         console.error("  - GOOGLE_SHEET_ID:", !!CONFIG.spreadsheetId);
//         return;
//       }

//       const auth = new google.auth.JWT({
//         email: CONFIG.email,
//         key: CONFIG.privateKey,
//         scopes: ["https://www.googleapis.com/auth/spreadsheets"],
//       });

//       this.sheets = google.sheets({ version: "v4", auth });
//       this.initialized = true;
//     } catch (error) {
//       console.error("❌ Failed to initialize Google Sheets:", error);
//     }
//   }

//   private checkInitialized() {
//     if (!this.initialized || !this.sheets) {
//       throw new Error(
//         "Google Sheets service not initialized. Check environment variables.",
//       );
//     }
//   }

//   private getFullRange() {
//     return `${CONFIG.sheetName}!A${CONFIG.dataStartRow}:D`;
//   }

//   /**
//    * Fetches all rows and maps them to objects
//    */
//   async getAll(): Promise<Record[]> {
//     this.checkInitialized();

//     try {
//       const response = await this.sheets!.spreadsheets.values.get({
//         spreadsheetId: CONFIG.spreadsheetId!,
//         range: this.getFullRange(),
//       });

//       const rows = response.data.values || [];

//       return rows
//         .filter((row) => row[0]) // Filter out empty rows
//         .map((row) => ({
//           id: row[0] || "",
//           name: row[1] || "",
//           email: row[2] || "",
//           role: row[3] || "",
//         }));
//     } catch (error: any) {
//       console.error("❌ Error fetching data:", error);
//       throw new Error(`Failed to fetch data: ${error.message}`);
//     }
//   }

//   /**
//    * Appends a new row
//    */
//   async create(data: z.infer<typeof recordSchema>): Promise<Record> {
//     this.checkInitialized();

//     try {
//       const newId = uuidv4();
//       const values = [[newId, data.name, data.email, data.role]];

//       await this.sheets!.spreadsheets.values.append({
//         spreadsheetId: CONFIG.spreadsheetId!,
//         range: this.getFullRange(),
//         valueInputOption: "USER_ENTERED",
//         requestBody: { values },
//       });

//       return { id: newId, ...data };
//     } catch (error: any) {
//       console.error("❌ Error creating record:", error);
//       throw new Error(`Failed to create record: ${error.message}`);
//     }
//   }

//   /**
//    * Finds row by ID and updates it
//    */
//   async update(
//     id: string,
//     data: z.infer<typeof recordSchema>,
//   ): Promise<Record> {
//     this.checkInitialized();

//     try {
//       const records = await this.getAll();
//       const index = records.findIndex((r) => r.id === id);

//       if (index === -1) {
//         throw new Error(`Record with ID ${id} not found`);
//       }

//       // Calculate actual row number in spreadsheet
//       const rowNumber = index + CONFIG.dataStartRow;
//       const range = `${CONFIG.sheetName}!A${rowNumber}:D${rowNumber}`;

//       await this.sheets!.spreadsheets.values.update({
//         spreadsheetId: CONFIG.spreadsheetId!,
//         range,
//         valueInputOption: "USER_ENTERED",
//         requestBody: {
//           values: [[id, data.name, data.email, data.role]],
//         },
//       });

//       return { id, ...data };
//     } catch (error: any) {
//       console.error("❌ Error updating record:", error);
//       throw new Error(`Failed to update record: ${error.message}`);
//     }
//   }

//   /**
//    * Deletes a row by shifting subsequent rows up
//    */
//   async delete(id: string): Promise<void> {
//     this.checkInitialized();

//     try {
//       const records = await this.getAll();
//       const index = records.findIndex((r) => r.id === id);

//       if (index === -1) {
//         throw new Error(`Record with ID ${id} not found`);
//       }

//       const sheetId = await this.getSheetInternalId();

//       // Calculate the absolute row index
//       // index 0 (first data row) + (CONFIG.dataStartRow - 1) = Row index 1
//       const absoluteIndex = index + (CONFIG.dataStartRow - 1);

//       await this.sheets!.spreadsheets.batchUpdate({
//         spreadsheetId: CONFIG.spreadsheetId!,
//         requestBody: {
//           requests: [
//             {
//               deleteDimension: {
//                 range: {
//                   sheetId,
//                   dimension: "ROWS",
//                   startIndex: absoluteIndex,
//                   endIndex: absoluteIndex + 1,
//                 },
//               },
//             },
//           ],
//         },
//       });
//     } catch (error: any) {
//       console.error("❌ Error deleting record:", error);
//       throw new Error(`Failed to delete record: ${error.message}`);
//     }
//   }

//   /**
//    * Gets the internal sheet ID needed for batch operations
//    */
//   private async getSheetInternalId(): Promise<number> {
//     this.checkInitialized();

//     try {
//       const { data } = await this.sheets!.spreadsheets.get({
//         spreadsheetId: CONFIG.spreadsheetId!,
//       });

//       const sheet = data.sheets?.find(
//         (s) => s.properties?.title === CONFIG.sheetName,
//       );

//       if (!sheet?.properties?.sheetId && sheet?.properties?.sheetId !== 0) {
//         throw new Error(`Sheet "${CONFIG.sheetName}" not found`);
//       }

//       return sheet.properties.sheetId;
//     } catch (error: any) {
//       console.error("❌ Error getting sheet ID:", error);
//       throw new Error(`Failed to get sheet ID: ${error.message}`);
//     }
//   }
// }

// // Initialize service singleton
// const service = new GoogleSheetsService();

// // ============================================================================
// // 3. API ROUTE HANDLERS
// // ============================================================================

// /**
//  * GET /api/google-sheet
//  * Fetches all records from the spreadsheet
//  */
// export async function GET() {
//   try {
//     const data = await service.getAll();
//     return NextResponse.json({ success: true, data });
//   } catch (err: any) {
//     console.error("GET Error:", err);
//     return NextResponse.json(
//       { success: false, error: err.message },
//       { status: 500 },
//     );
//   }
// }

// /**
//  * POST /api/google-sheet
//  * Creates a new record in the spreadsheet
//  * Body: { name: string, email: string, role: string }
//  */
// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const validated = recordSchema.parse(body);
//     const result = await service.create(validated);

//     return NextResponse.json({ success: true, data: result }, { status: 201 });
//   } catch (err: any) {
//     console.error("POST Error:", err);

//     if (err instanceof ZodError) {
//       return NextResponse.json(
//         { success: false, error: "Validation failed", details: err.issues },
//         { status: 400 },
//       );
//     }

//     return NextResponse.json(
//       { success: false, error: err.message },
//       { status: 500 },
//     );
//   }
// }

// /**
//  * PUT /api/google-sheet
//  * Updates an existing record
//  * Body: { id: string, name: string, email: string, role: string }
//  */
// export async function PUT(req: Request) {
//   try {
//     const body = await req.json();
//     const { id, ...data } = body;

//     if (!id || typeof id !== "string") {
//       return NextResponse.json(
//         { success: false, error: "Valid ID is required" },
//         { status: 400 },
//       );
//     }

//     const validated = recordSchema.parse(data);
//     const result = await service.update(id, validated);

//     return NextResponse.json({ success: true, data: result });
//   } catch (err: any) {
//     console.error("PUT Error:", err);

//     if (err instanceof ZodError) {
//       return NextResponse.json(
//         { success: false, error: "Validation failed", details: err.issues },
//         { status: 400 },
//       );
//     }

//     return NextResponse.json(
//       { success: false, error: err.message },
//       { status: err.message.includes("not found") ? 404 : 500 },
//     );
//   }
// }

// /**
//  * DELETE /api/google-sheet?id=xxx
//  * Deletes a record by ID
//  */
// export async function DELETE(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const id = searchParams.get("id");

//     if (!id || typeof id !== "string") {
//       return NextResponse.json(
//         { success: false, error: "Valid ID is required" },
//         { status: 400 },
//       );
//     }

//     await service.delete(id);

//     return NextResponse.json({
//       success: true,
//       message: "Record deleted successfully",
//     });
//   } catch (err: any) {
//     console.error("DELETE Error:", err);

//     return NextResponse.json(
//       { success: false, error: err.message },
//       { status: err.message.includes("not found") ? 404 : 500 },
//     );
//   }
// }

// ============================================================================================ //

// /app/api/sheet/route.ts
import { google, sheets_v4 } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

// ============================================================================
// 1. TYPES & INTERFACES
// ============================================================================

interface SheetInfo {
  id: number;
  title: string;
  rowCount: number;
  columnCount: number;
}

interface SheetData {
  headers: string[];
  rows: any[][];
  rowCount: number;
  columnCount: number;
}

interface SearchResult {
  row: number;
  col: number;
  value: any;
}

interface CellUpdate {
  row: number;
  col: number;
  value: any;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

// ============================================================================
// 2. CONFIGURATION & VALIDATION
// ============================================================================

const CONFIG = {
  email: process.env.GOOGLE_CLIENT_EMAIL,
  privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  spreadsheetId: process.env.GOOGLE_SHEET_ID,
} as const;

// Validate configuration on module load
function validateConfig() {
  if (!CONFIG.email) {
    throw new Error("GOOGLE_CLIENT_EMAIL environment variable is not set");
  }
  if (!CONFIG.privateKey) {
    throw new Error("GOOGLE_PRIVATE_KEY environment variable is not set");
  }
  if (!CONFIG.spreadsheetId) {
    throw new Error("GOOGLE_SHEET_ID environment variable is not set");
  }
}

// ============================================================================
// 3. VALIDATION SCHEMAS
// ============================================================================

const cellUpdateSchema = z.object({
  row: z.number().int().positive("Row must be a positive integer"),
  col: z.number().int().positive("Column must be a positive integer"),
  value: z.any(),
});

const batchUpdateSchema = z.object({
  updates: z
    .array(cellUpdateSchema)
    .min(1, "At least one update is required")
    .max(1000, "Maximum 1000 updates per batch"),
});

const rangeUpdateSchema = z.object({
  range: z
    .string()
    .regex(
      /^[^!]+![A-Z]+\d+:[A-Z]+\d+$/,
      "Invalid range format. Use format: Sheet1!A1:C10",
    ),
  values: z.array(z.array(z.any())).min(1, "Values array cannot be empty"),
});

const addRowSchema = z.object({
  sheetName: z.string().min(1, "Sheet name cannot be empty").optional(),
  values: z.array(z.any()).min(1, "Values array cannot be empty"),
});

const addColumnSchema = z.object({
  sheetName: z.string().min(1, "Sheet name cannot be empty").optional(),
  headerName: z.string().min(1, "Header name cannot be empty"),
  position: z
    .number()
    .int()
    .nonnegative("Position must be non-negative")
    .optional(),
});

const createSheetSchema = z.object({
  title: z
    .string()
    .min(1, "Sheet title cannot be empty")
    .max(100, "Sheet title cannot exceed 100 characters"),
});

const renameSheetSchema = z.object({
  sheetId: z.number().int().nonnegative("Sheet ID must be non-negative"),
  newTitle: z
    .string()
    .min(1, "New title cannot be empty")
    .max(100, "New title cannot exceed 100 characters"),
});

const sortRangeSchema = z.object({
  sheetName: z.string().min(1, "Sheet name cannot be empty"),
  range: z.string().min(1, "Range cannot be empty"),
  sortColumn: z.number().int().nonnegative("Sort column must be non-negative"),
  ascending: z.boolean().optional(),
});

const insertRowSchema = z.object({
  sheetName: z.string().min(1, "Sheet name cannot be empty"),
  rowIndex: z.number().int().nonnegative("Row index must be non-negative"),
  values: z.array(z.any()).optional(),
});

// ============================================================================
// 4. CUSTOM ERROR CLASSES
// ============================================================================

class GoogleSheetsError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: any,
  ) {
    super(message);
    this.name = "GoogleSheetsError";
  }
}

class ValidationError extends GoogleSheetsError {
  constructor(message: string, details?: any) {
    super(message, 400, details);
    this.name = "ValidationError";
  }
}

class NotFoundError extends GoogleSheetsError {
  constructor(message: string) {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

// ============================================================================
// 5. ENHANCED GOOGLE SHEETS SERVICE
// ============================================================================

class EnhancedGoogleSheetsService {
  private sheets: sheets_v4.Sheets | null = null;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      validateConfig();

      const auth = new google.auth.JWT({
        email: CONFIG.email,
        key: CONFIG.privateKey,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      this.sheets = google.sheets({ version: "v4", auth });
      this.initialized = true;

      console.log("✅ Google Sheets service initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Google Sheets service:", error);
      throw new GoogleSheetsError(
        "Failed to initialize Google Sheets service",
        500,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private checkInitialized(): void {
    if (!this.initialized || !this.sheets) {
      throw new GoogleSheetsError(
        "Google Sheets service is not properly initialized",
        500,
      );
    }
  }

  private handleGoogleApiError(error: any): never {
    console.error("Google API Error:", error);

    if (error.code === 404) {
      throw new NotFoundError("Spreadsheet or sheet not found");
    }

    if (error.code === 403) {
      throw new GoogleSheetsError(
        "Permission denied. Check service account permissions.",
        403,
      );
    }

    if (error.code === 429) {
      throw new GoogleSheetsError(
        "Rate limit exceeded. Please try again later.",
        429,
      );
    }

    throw new GoogleSheetsError(
      error.message || "An error occurred while accessing Google Sheets",
      error.code || 500,
    );
  }

  // ========================================================================
  // SHEET METADATA
  // ========================================================================

  async getSheets(): Promise<SheetInfo[]> {
    this.checkInitialized();

    try {
      const response = await this.sheets!.spreadsheets.get({
        spreadsheetId: CONFIG.spreadsheetId!,
      });

      return (
        response.data.sheets?.map((sheet) => ({
          id: sheet.properties?.sheetId ?? 0,
          title: sheet.properties?.title ?? "Untitled",
          rowCount: sheet.properties?.gridProperties?.rowCount ?? 0,
          columnCount: sheet.properties?.gridProperties?.columnCount ?? 0,
        })) ?? []
      );
    } catch (error) {
      this.handleGoogleApiError(error);
    }
  }

  async createSheet(title: string): Promise<SheetInfo> {
    this.checkInitialized();

    try {
      // Check if sheet with same name exists
      const existingSheets = await this.getSheets();
      if (existingSheets.some((sheet) => sheet.title === title)) {
        throw new ValidationError(`Sheet with title "${title}" already exists`);
      }

      const response = await this.sheets!.spreadsheets.batchUpdate({
        spreadsheetId: CONFIG.spreadsheetId!,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title,
                  gridProperties: {
                    rowCount: 1000,
                    columnCount: 26,
                    frozenRowCount: 1, // Freeze header row by default
                  },
                },
              },
            },
          ],
        },
      });

      const sheetId =
        response.data.replies?.[0]?.addSheet?.properties?.sheetId ?? 0;

      return {
        id: sheetId,
        title,
        rowCount: 1000,
        columnCount: 26,
      };
    } catch (error) {
      if (error instanceof GoogleSheetsError) throw error;
      this.handleGoogleApiError(error);
    }
  }

  async renameSheet(sheetId: number, newTitle: string): Promise<void> {
    this.checkInitialized();

    try {
      // Check if new title is already in use
      const existingSheets = await this.getSheets();
      if (
        existingSheets.some(
          (sheet) => sheet.title === newTitle && sheet.id !== sheetId,
        )
      ) {
        throw new ValidationError(
          `Sheet with title "${newTitle}" already exists`,
        );
      }

      await this.sheets!.spreadsheets.batchUpdate({
        spreadsheetId: CONFIG.spreadsheetId!,
        requestBody: {
          requests: [
            {
              updateSheetProperties: {
                properties: {
                  sheetId,
                  title: newTitle,
                },
                fields: "title",
              },
            },
          ],
        },
      });
    } catch (error) {
      if (error instanceof GoogleSheetsError) throw error;
      this.handleGoogleApiError(error);
    }
  }

  async deleteSheet(sheetId: number): Promise<void> {
    this.checkInitialized();

    try {
      // Prevent deleting the last sheet
      const sheets = await this.getSheets();
      if (sheets.length === 1) {
        throw new ValidationError("Cannot delete the last remaining sheet");
      }

      await this.sheets!.spreadsheets.batchUpdate({
        spreadsheetId: CONFIG.spreadsheetId!,
        requestBody: {
          requests: [
            {
              deleteSheet: {
                sheetId,
              },
            },
          ],
        },
      });
    } catch (error) {
      if (error instanceof GoogleSheetsError) throw error;
      this.handleGoogleApiError(error);
    }
  }

  // ========================================================================
  // DATA OPERATIONS
  // ========================================================================

  async getRange(range: string): Promise<any[][]> {
    this.checkInitialized();

    try {
      const response = await this.sheets!.spreadsheets.values.get({
        spreadsheetId: CONFIG.spreadsheetId!,
        range,
      });

      return response.data.values ?? [];
    } catch (error) {
      this.handleGoogleApiError(error);
    }
  }

  async getSheetData(sheetName: string): Promise<SheetData> {
    this.checkInitialized();

    try {
      const range = `${sheetName}!A1:ZZ`;
      const values = await this.getRange(range);

      if (values.length === 0) {
        return {
          headers: [],
          rows: [],
          rowCount: 0,
          columnCount: 0,
        };
      }

      const headers = values[0] ?? [];
      const rows = values.slice(1);

      return {
        headers,
        rows,
        rowCount: values.length,
        columnCount: headers.length,
      };
    } catch (error) {
      this.handleGoogleApiError(error);
    }
  }

  async updateCell(
    sheetName: string,
    row: number,
    col: number,
    value: any,
  ): Promise<void> {
    this.checkInitialized();

    try {
      const columnLetter = this.numberToColumn(col);
      const range = `${sheetName}!${columnLetter}${row}`;

      await this.sheets!.spreadsheets.values.update({
        spreadsheetId: CONFIG.spreadsheetId!,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[value]],
        },
      });
    } catch (error) {
      this.handleGoogleApiError(error);
    }
  }

  async batchUpdate(sheetName: string, updates: CellUpdate[]): Promise<void> {
    this.checkInitialized();

    if (updates.length === 0) {
      throw new ValidationError("No updates provided");
    }

    if (updates.length > 1000) {
      throw new ValidationError("Maximum 1000 updates per batch");
    }

    try {
      const data = updates.map((update) => ({
        range: `${sheetName}!${this.numberToColumn(update.col)}${update.row}`,
        values: [[update.value]],
      }));

      await this.sheets!.spreadsheets.values.batchUpdate({
        spreadsheetId: CONFIG.spreadsheetId!,
        requestBody: {
          valueInputOption: "USER_ENTERED",
          data,
        },
      });
    } catch (error) {
      this.handleGoogleApiError(error);
    }
  }

  async updateRange(range: string, values: any[][]): Promise<void> {
    this.checkInitialized();

    try {
      await this.sheets!.spreadsheets.values.update({
        spreadsheetId: CONFIG.spreadsheetId!,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: { values },
      });
    } catch (error) {
      this.handleGoogleApiError(error);
    }
  }

  async appendRow(sheetName: string, values: any[]): Promise<void> {
    this.checkInitialized();

    if (values.length === 0) {
      throw new ValidationError("Cannot append empty row");
    }

    try {
      await this.sheets!.spreadsheets.values.append({
        spreadsheetId: CONFIG.spreadsheetId!,
        range: `${sheetName}!A1`,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [values],
        },
      });
    } catch (error) {
      this.handleGoogleApiError(error);
    }
  }

  async insertRow(
    sheetName: string,
    rowIndex: number,
    values?: any[],
  ): Promise<void> {
    this.checkInitialized();

    try {
      const sheetId = await this.getSheetIdByName(sheetName);

      // Insert empty row
      await this.sheets!.spreadsheets.batchUpdate({
        spreadsheetId: CONFIG.spreadsheetId!,
        requestBody: {
          requests: [
            {
              insertDimension: {
                range: {
                  sheetId,
                  dimension: "ROWS",
                  startIndex: rowIndex,
                  endIndex: rowIndex + 1,
                },
                inheritFromBefore: rowIndex > 0,
              },
            },
          ],
        },
      });

      // If values provided, populate the row
      if (values && values.length > 0) {
        const range = `${sheetName}!A${rowIndex + 1}`;
        await this.updateRange(range, [values]);
      }
    } catch (error) {
      if (error instanceof GoogleSheetsError) throw error;
      this.handleGoogleApiError(error);
    }
  }

  async deleteRow(sheetName: string, rowIndex: number): Promise<void> {
    this.checkInitialized();

    try {
      const sheetId = await this.getSheetIdByName(sheetName);
      const sheetData = await this.getSheetData(sheetName);

      // Prevent deleting header row
      if (rowIndex === 0) {
        throw new ValidationError("Cannot delete the header row (row 0)");
      }

      // Prevent deleting when only header exists
      if (sheetData.rowCount <= 1) {
        throw new ValidationError("Cannot delete row when only header exists");
      }

      await this.sheets!.spreadsheets.batchUpdate({
        spreadsheetId: CONFIG.spreadsheetId!,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: "ROWS",
                  startIndex: rowIndex,
                  endIndex: rowIndex + 1,
                },
              },
            },
          ],
        },
      });
    } catch (error) {
      if (error instanceof GoogleSheetsError) throw error;
      this.handleGoogleApiError(error);
    }
  }

  async addColumn(
    sheetName: string,
    headerName: string,
    position?: number,
  ): Promise<void> {
    this.checkInitialized();

    try {
      const sheetId = await this.getSheetIdByName(sheetName);
      const sheets = await this.getSheets();
      const sheet = sheets.find((s) => s.title === sheetName);

      if (!sheet) {
        throw new NotFoundError(`Sheet "${sheetName}" not found`);
      }

      const columnIndex = position ?? sheet.columnCount;

      // Validate position
      if (position !== undefined && position > sheet.columnCount) {
        throw new ValidationError(
          `Position ${position} exceeds sheet column count ${sheet.columnCount}`,
        );
      }

      // Insert column
      await this.sheets!.spreadsheets.batchUpdate({
        spreadsheetId: CONFIG.spreadsheetId!,
        requestBody: {
          requests: [
            {
              insertDimension: {
                range: {
                  sheetId,
                  dimension: "COLUMNS",
                  startIndex: columnIndex,
                  endIndex: columnIndex + 1,
                },
                inheritFromBefore: columnIndex > 0,
              },
            },
          ],
        },
      });

      // Set header name
      await this.updateCell(sheetName, 1, columnIndex + 1, headerName);
    } catch (error) {
      if (error instanceof GoogleSheetsError) throw error;
      this.handleGoogleApiError(error);
    }
  }

  async deleteColumn(sheetName: string, columnIndex: number): Promise<void> {
    this.checkInitialized();

    try {
      const sheetId = await this.getSheetIdByName(sheetName);
      const sheets = await this.getSheets();
      const sheet = sheets.find((s) => s.title === sheetName);

      if (!sheet) {
        throw new NotFoundError(`Sheet "${sheetName}" not found`);
      }

      // Prevent deleting the last column
      if (sheet.columnCount === 1) {
        throw new ValidationError("Cannot delete the last remaining column");
      }

      // Validate column index
      if (columnIndex >= sheet.columnCount) {
        throw new ValidationError(
          `Column index ${columnIndex} exceeds sheet column count ${sheet.columnCount}`,
        );
      }

      await this.sheets!.spreadsheets.batchUpdate({
        spreadsheetId: CONFIG.spreadsheetId!,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: "COLUMNS",
                  startIndex: columnIndex,
                  endIndex: columnIndex + 1,
                },
              },
            },
          ],
        },
      });
    } catch (error) {
      if (error instanceof GoogleSheetsError) throw error;
      this.handleGoogleApiError(error);
    }
  }

  // ========================================================================
  // SORTING & FILTERING
  // ========================================================================

  async sortRange(
    sheetName: string,
    range: string,
    sortColumn: number,
    ascending: boolean = true,
  ): Promise<void> {
    this.checkInitialized();

    try {
      const sheetId = await this.getSheetIdByName(sheetName);

      // Parse range to get start/end rows and columns
      const rangeRegex = /([A-Z]+)(\d+):([A-Z]+)(\d+)/;
      const match = range.match(rangeRegex);

      if (!match) {
        throw new ValidationError(
          "Invalid range format. Expected format: A1:C10",
        );
      }

      const startCol = this.columnToNumber(match[1]);
      const startRow = parseInt(match[2], 10) - 1;
      const endCol = this.columnToNumber(match[3]) + 1;
      const endRow = parseInt(match[4], 10);

      // Validate sort column is within range
      if (sortColumn < startCol || sortColumn >= endCol) {
        throw new ValidationError(
          `Sort column ${sortColumn} is outside the range ${range}`,
        );
      }

      await this.sheets!.spreadsheets.batchUpdate({
        spreadsheetId: CONFIG.spreadsheetId!,
        requestBody: {
          requests: [
            {
              sortRange: {
                range: {
                  sheetId,
                  startRowIndex: startRow,
                  endRowIndex: endRow,
                  startColumnIndex: startCol,
                  endColumnIndex: endCol,
                },
                sortSpecs: [
                  {
                    dimensionIndex: sortColumn,
                    sortOrder: ascending ? "ASCENDING" : "DESCENDING",
                  },
                ],
              },
            },
          ],
        },
      });
    } catch (error) {
      if (error instanceof GoogleSheetsError) throw error;
      this.handleGoogleApiError(error);
    }
  }

  async search(sheetName: string, searchTerm: string): Promise<SearchResult[]> {
    this.checkInitialized();

    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new ValidationError("Search term cannot be empty");
    }

    try {
      const data = await this.getSheetData(sheetName);
      const results: SearchResult[] = [];
      const normalizedSearch = searchTerm.toLowerCase().trim();

      // Search in headers
      data.headers.forEach((header, colIndex) => {
        if (header && String(header).toLowerCase().includes(normalizedSearch)) {
          results.push({
            row: 1,
            col: colIndex + 1,
            value: header,
          });
        }
      });

      // Search in rows
      data.rows.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          if (cell && String(cell).toLowerCase().includes(normalizedSearch)) {
            results.push({
              row: rowIndex + 2, // +2 because headers are row 1
              col: colIndex + 1,
              value: cell,
            });
          }
        });
      });

      return results;
    } catch (error) {
      if (error instanceof GoogleSheetsError) throw error;
      this.handleGoogleApiError(error);
    }
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  private async getSheetIdByName(sheetName: string): Promise<number> {
    const sheets = await this.getSheets();
    const sheet = sheets.find((s) => s.title === sheetName);

    if (!sheet) {
      throw new NotFoundError(`Sheet "${sheetName}" not found`);
    }

    return sheet.id;
  }

  private numberToColumn(num: number): string {
    if (num <= 0) {
      throw new ValidationError("Column number must be positive");
    }

    let column = "";
    while (num > 0) {
      const remainder = (num - 1) % 26;
      column = String.fromCharCode(65 + remainder) + column;
      num = Math.floor((num - 1) / 26);
    }
    return column;
  }

  private columnToNumber(col: string): number {
    if (!col || !/^[A-Z]+$/.test(col)) {
      throw new ValidationError(
        "Invalid column format. Use uppercase letters (A-Z)",
      );
    }

    let num = 0;
    for (let i = 0; i < col.length; i++) {
      num = num * 26 + (col.charCodeAt(i) - 64);
    }
    return num - 1; // 0-based index
  }
}

// ============================================================================
// 6. INITIALIZE SERVICE
// ============================================================================

let service: EnhancedGoogleSheetsService | null = null;

function getService(): EnhancedGoogleSheetsService {
  if (!service) {
    service = new EnhancedGoogleSheetsService();
  }
  return service;
}

// ============================================================================
// 7. RESPONSE HELPERS
// ============================================================================

function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status },
  );
}

function createErrorResponse(
  error: string,
  status: number = 500,
  details?: any,
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details && { details }),
    },
    { status },
  );
}

function handleError(error: unknown): NextResponse<ApiResponse> {
  console.error("API Error:", error);

  if (error instanceof ValidationError) {
    return createErrorResponse(error.message, error.statusCode, error.details);
  }

  if (error instanceof NotFoundError) {
    return createErrorResponse(error.message, error.statusCode);
  }

  if (error instanceof GoogleSheetsError) {
    return createErrorResponse(error.message, error.statusCode, error.details);
  }

  if (error instanceof ZodError) {
    return createErrorResponse(
      "Validation failed",
      400,
      error.issues.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    );
  }

  if (error instanceof Error) {
    return createErrorResponse(error.message, 500);
  }

  return createErrorResponse("An unexpected error occurred", 500);
}

// ============================================================================
// 8. API ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/sheet
 * Query params:
 * - action: "sheets" | "data" | "range" | "search"
 * - sheetName: string (for data, range, search)
 * - range: string (for range action)
 * - q: string (for search action)
 */
export async function GET(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "sheets";
    const sheetName = searchParams.get("sheetName") || "Sheet1";
    const range = searchParams.get("range");
    const searchQuery = searchParams.get("q");

    const svc = getService();

    switch (action) {
      case "sheets": {
        const sheets = await svc.getSheets();
        return createSuccessResponse(sheets);
      }

      case "data": {
        const data = await svc.getSheetData(sheetName);
        return createSuccessResponse(data);
      }

      case "range": {
        if (!range) {
          return createErrorResponse("Range parameter is required", 400);
        }
        const rangeData = await svc.getRange(range);
        return createSuccessResponse(rangeData);
      }

      case "search": {
        if (!searchQuery) {
          return createErrorResponse(
            "Search query (q) parameter is required",
            400,
          );
        }
        const results = await svc.search(sheetName, searchQuery);
        return createSuccessResponse(results);
      }

      default:
        return createErrorResponse(
          `Invalid action: ${action}. Valid actions: sheets, data, range, search`,
          400,
        );
    }
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/sheet
 * Body depends on action:
 * - createSheet: { action: "createSheet", title: string }
 * - appendRow: { action: "appendRow", sheetName?: string, values: any[] }
 * - insertRow: { action: "insertRow", sheetName: string, rowIndex: number, values?: any[] }
 * - addColumn: { action: "addColumn", sheetName?: string, headerName: string, position?: number }
 */
export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await req.json();
    const { action } = body;

    if (!action) {
      return createErrorResponse("Action field is required", 400);
    }

    const svc = getService();

    switch (action) {
      case "createSheet": {
        const validated = createSheetSchema.parse(body);
        const sheet = await svc.createSheet(validated.title);
        return createSuccessResponse(sheet, "Sheet created successfully", 201);
      }

      case "appendRow": {
        const validated = addRowSchema.parse(body);
        await svc.appendRow(validated.sheetName || "Sheet1", validated.values);
        return createSuccessResponse(null, "Row appended successfully", 201);
      }

      case "insertRow": {
        const validated = insertRowSchema.parse(body);
        await svc.insertRow(
          validated.sheetName,
          validated.rowIndex,
          validated.values,
        );
        return createSuccessResponse(null, "Row inserted successfully", 201);
      }

      case "addColumn": {
        const validated = addColumnSchema.parse(body);
        await svc.addColumn(
          validated.sheetName || "Sheet1",
          validated.headerName,
          validated.position,
        );
        return createSuccessResponse(null, "Column added successfully", 201);
      }

      default:
        return createErrorResponse(
          `Invalid action: ${action}. Valid actions: createSheet, appendRow, insertRow, addColumn`,
          400,
        );
    }
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PUT /api/sheet
 * Body:
 * - updateCell: { action: "updateCell", sheetName: string, row: number, col: number, value: any }
 * - batchUpdate: { action: "batchUpdate", sheetName: string, updates: Array<{row, col, value}> }
 * - updateRange: { action: "updateRange", range: string, values: any[][] }
 * - renameSheet: { action: "renameSheet", sheetId: number, newTitle: string }
 * - sort: { action: "sort", sheetName: string, range: string, sortColumn: number, ascending?: boolean }
 */
export async function PUT(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await req.json();
    const { action } = body;

    if (!action) {
      return createErrorResponse("Action field is required", 400);
    }

    const svc = getService();

    switch (action) {
      case "updateCell": {
        const validated = cellUpdateSchema.parse(body);
        if (!body.sheetName) {
          return createErrorResponse("sheetName field is required", 400);
        }
        await svc.updateCell(
          body.sheetName,
          validated.row,
          validated.col,
          validated.value,
        );
        return createSuccessResponse(null, "Cell updated successfully");
      }

      case "batchUpdate": {
        const validated = batchUpdateSchema.parse(body);
        if (!body.sheetName) {
          return createErrorResponse("sheetName field is required", 400);
        }
        await svc.batchUpdate(body.sheetName, validated.updates);
        return createSuccessResponse(
          null,
          `${validated.updates.length} cells updated successfully`,
        );
      }

      case "updateRange": {
        const validated = rangeUpdateSchema.parse(body);
        await svc.updateRange(validated.range, validated.values);
        return createSuccessResponse(null, "Range updated successfully");
      }

      case "renameSheet": {
        const validated = renameSheetSchema.parse(body);
        await svc.renameSheet(validated.sheetId, validated.newTitle);
        return createSuccessResponse(null, "Sheet renamed successfully");
      }

      case "sort": {
        const validated = sortRangeSchema.parse(body);
        await svc.sortRange(
          validated.sheetName,
          validated.range,
          validated.sortColumn,
          validated.ascending ?? true,
        );
        return createSuccessResponse(null, "Range sorted successfully");
      }

      default:
        return createErrorResponse(
          `Invalid action: ${action}. Valid actions: updateCell, batchUpdate, updateRange, renameSheet, sort`,
          400,
        );
    }
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/sheet
 * Query params:
 * - action: "sheet" | "row" | "column"
 * - sheetId: number (for sheet)
 * - sheetName: string (for row/column)
 * - index: number (for row/column - 0-based)
 */
export async function DELETE(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const sheetId = searchParams.get("sheetId");
    const sheetName = searchParams.get("sheetName");
    const index = searchParams.get("index");

    if (!action) {
      return createErrorResponse("Action parameter is required", 400);
    }

    const svc = getService();

    switch (action) {
      case "sheet": {
        if (!sheetId) {
          return createErrorResponse("sheetId parameter is required", 400);
        }
        const parsedSheetId = parseInt(sheetId, 10);
        if (isNaN(parsedSheetId) || parsedSheetId < 0) {
          return createErrorResponse("Invalid sheetId", 400);
        }
        await svc.deleteSheet(parsedSheetId);
        return createSuccessResponse(null, "Sheet deleted successfully");
      }

      case "row": {
        if (!sheetName || !index) {
          return createErrorResponse(
            "sheetName and index parameters are required",
            400,
          );
        }
        const parsedIndex = parseInt(index, 10);
        if (isNaN(parsedIndex) || parsedIndex < 0) {
          return createErrorResponse("Invalid index", 400);
        }
        await svc.deleteRow(sheetName, parsedIndex);
        return createSuccessResponse(null, "Row deleted successfully");
      }

      case "column": {
        if (!sheetName || !index) {
          return createErrorResponse(
            "sheetName and index parameters are required",
            400,
          );
        }
        const parsedIndex = parseInt(index, 10);
        if (isNaN(parsedIndex) || parsedIndex < 0) {
          return createErrorResponse("Invalid index", 400);
        }
        await svc.deleteColumn(sheetName, parsedIndex);
        return createSuccessResponse(null, "Column deleted successfully");
      }

      default:
        return createErrorResponse(
          `Invalid action: ${action}. Valid actions: sheet, row, column`,
          400,
        );
    }
  } catch (error) {
    return handleError(error);
  }
}
