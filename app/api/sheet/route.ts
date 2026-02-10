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
//         { success: false, error: "Validation failed", details: err.errors },
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
//         { success: false, error: "Validation failed", details: err.errors },
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

// /app/api/google-sheet/route.ts
import { google, sheets_v4 } from "googleapis";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

// ============================================================================
// 1. CONFIGURATION & SCHEMAS
// ============================================================================

const CONFIG = {
  email: process.env.GOOGLE_CLIENT_EMAIL,
  privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  spreadsheetId: process.env.GOOGLE_SHEET_ID,
} as const;

// Flexible schemas for different operations
const cellUpdateSchema = z.object({
  row: z.number().int().positive(),
  col: z.number().int().positive(),
  value: z.any(),
});

const batchUpdateSchema = z.object({
  updates: z.array(cellUpdateSchema),
});

const rangeUpdateSchema = z.object({
  range: z.string(), // e.g., "Sheet1!A1:C10"
  values: z.array(z.array(z.any())),
});

const addRowSchema = z.object({
  sheetName: z.string().optional(),
  values: z.array(z.any()),
});

const addColumnSchema = z.object({
  sheetName: z.string().optional(),
  headerName: z.string(),
  position: z.number().int().nonnegative().optional(), // 0-based index
});

// ============================================================================
// 2. ENHANCED GOOGLE SHEETS SERVICE
// ============================================================================

class EnhancedGoogleSheetsService {
  private sheets: sheets_v4.Sheets | null = null;
  private initialized = false;

  constructor() {
    try {
      if (!CONFIG.email || !CONFIG.privateKey || !CONFIG.spreadsheetId) {
        console.error("❌ Missing required environment variables");
        return;
      }

      const auth = new google.auth.JWT({
        email: CONFIG.email,
        key: CONFIG.privateKey,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      this.sheets = google.sheets({ version: "v4", auth });
      this.initialized = true;
    } catch (error) {
      console.error("❌ Failed to initialize Google Sheets:", error);
    }
  }

  private checkInitialized() {
    if (!this.initialized || !this.sheets) {
      throw new Error("Google Sheets service not initialized");
    }
  }

  // ========================================================================
  // SHEET METADATA
  // ========================================================================

  /**
   * Get all sheets/tabs in the spreadsheet
   */
  async getSheets(): Promise<
    Array<{ id: number; title: string; rowCount: number; columnCount: number }>
  > {
    this.checkInitialized();

    const { data } = await this.sheets!.spreadsheets.get({
      spreadsheetId: CONFIG.spreadsheetId!,
    });

    return (
      data.sheets?.map((sheet) => ({
        id: sheet.properties?.sheetId || 0,
        title: sheet.properties?.title || "",
        rowCount: sheet.properties?.gridProperties?.rowCount || 0,
        columnCount: sheet.properties?.gridProperties?.columnCount || 0,
      })) || []
    );
  }

  /**
   * Create a new sheet/tab
   */
  async createSheet(title: string): Promise<{ id: number; title: string }> {
    this.checkInitialized();

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
                },
              },
            },
          },
        ],
      },
    });

    const sheetId =
      response.data.replies?.[0]?.addSheet?.properties?.sheetId || 0;
    return { id: sheetId, title };
  }

  /**
   * Rename a sheet
   */
  async renameSheet(sheetId: number, newTitle: string): Promise<void> {
    this.checkInitialized();

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
  }

  /**
   * Delete a sheet
   */
  async deleteSheet(sheetId: number): Promise<void> {
    this.checkInitialized();

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
  }

  // ========================================================================
  // DATA OPERATIONS
  // ========================================================================

  /**
   * Get data from a specific range
   */
  async getRange(range: string): Promise<any[][]> {
    this.checkInitialized();

    const response = await this.sheets!.spreadsheets.values.get({
      spreadsheetId: CONFIG.spreadsheetId!,
      range,
    });

    return response.data.values || [];
  }

  /**
   * Get entire sheet data with metadata
   */
  async getSheetData(sheetName: string): Promise<{
    headers: string[];
    rows: any[][];
    rowCount: number;
    columnCount: number;
  }> {
    this.checkInitialized();

    const range = `${sheetName}!A1:ZZ`;
    const values = await this.getRange(range);

    const headers = values[0] || [];
    const rows = values.slice(1);

    return {
      headers,
      rows,
      rowCount: values.length,
      columnCount: headers.length,
    };
  }

  /**
   * Update a single cell
   */
  async updateCell(
    sheetName: string,
    row: number,
    col: number,
    value: any,
  ): Promise<void> {
    this.checkInitialized();

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
  }

  /**
   * Batch update multiple cells
   */
  async batchUpdate(
    sheetName: string,
    updates: Array<{ row: number; col: number; value: any }>,
  ): Promise<void> {
    this.checkInitialized();

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
  }

  /**
   * Update a range of cells
   */
  async updateRange(range: string, values: any[][]): Promise<void> {
    this.checkInitialized();

    await this.sheets!.spreadsheets.values.update({
      spreadsheetId: CONFIG.spreadsheetId!,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });
  }

  /**
   * Append a new row
   */
  async appendRow(sheetName: string, values: any[]): Promise<void> {
    this.checkInitialized();

    await this.sheets!.spreadsheets.values.append({
      spreadsheetId: CONFIG.spreadsheetId!,
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [values],
      },
    });
  }

  /**
   * Insert a row at a specific position
   */
  async insertRow(
    sheetName: string,
    rowIndex: number,
    values?: any[],
  ): Promise<void> {
    this.checkInitialized();

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
  }

  /**
   * Delete a row
   */
  async deleteRow(sheetName: string, rowIndex: number): Promise<void> {
    this.checkInitialized();

    const sheetId = await this.getSheetIdByName(sheetName);

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
  }

  /**
   * Add a new column
   */
  async addColumn(
    sheetName: string,
    headerName: string,
    position?: number,
  ): Promise<void> {
    this.checkInitialized();

    const sheetId = await this.getSheetIdByName(sheetName);

    // Get current column count to determine where to add
    const sheets = await this.getSheets();
    const sheet = sheets.find((s) => s.title === sheetName);
    const columnIndex = position ?? sheet?.columnCount ?? 0;

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
            },
          },
        ],
      },
    });

    // Set header name
    const columnLetter = this.numberToColumn(columnIndex + 1);
    await this.updateCell(sheetName, 1, columnIndex + 1, headerName);
  }

  /**
   * Delete a column
   */
  async deleteColumn(sheetName: string, columnIndex: number): Promise<void> {
    this.checkInitialized();

    const sheetId = await this.getSheetIdByName(sheetName);

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
  }

  // ========================================================================
  // SORTING & FILTERING
  // ========================================================================

  /**
   * Sort a range by a specific column
   */
  async sortRange(
    sheetName: string,
    range: string,
    sortColumn: number,
    ascending: boolean = true,
  ): Promise<void> {
    this.checkInitialized();

    const sheetId = await this.getSheetIdByName(sheetName);

    // Parse range to get start/end rows and columns
    const rangeRegex = /([A-Z]+)(\d+):([A-Z]+)(\d+)/;
    const match = range.match(rangeRegex);

    if (!match) {
      throw new Error("Invalid range format");
    }

    const startCol = this.columnToNumber(match[1]);
    const startRow = parseInt(match[2]) - 1;
    const endCol = this.columnToNumber(match[3]) + 1;
    const endRow = parseInt(match[4]);

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
  }

  /**
   * Search for a value in a sheet
   */
  async search(
    sheetName: string,
    searchTerm: string,
  ): Promise<
    Array<{
      row: number;
      col: number;
      value: any;
    }>
  > {
    this.checkInitialized();

    const data = await this.getSheetData(sheetName);
    const results: Array<{ row: number; col: number; value: any }> = [];

    // Search in headers
    data.headers.forEach((header, colIndex) => {
      if (String(header).toLowerCase().includes(searchTerm.toLowerCase())) {
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
        if (String(cell).toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push({
            row: rowIndex + 2, // +2 because headers are row 1
            col: colIndex + 1,
            value: cell,
          });
        }
      });
    });

    return results;
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  /**
   * Get sheet ID by name
   */
  private async getSheetIdByName(sheetName: string): Promise<number> {
    const sheets = await this.getSheets();
    const sheet = sheets.find((s) => s.title === sheetName);

    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found`);
    }

    return sheet.id;
  }

  /**
   * Convert column number to letter (1 = A, 27 = AA)
   */
  private numberToColumn(num: number): string {
    let column = "";
    while (num > 0) {
      const remainder = (num - 1) % 26;
      column = String.fromCharCode(65 + remainder) + column;
      num = Math.floor((num - 1) / 26);
    }
    return column;
  }

  /**
   * Convert column letter to number (A = 1, AA = 27)
   */
  private columnToNumber(col: string): number {
    let num = 0;
    for (let i = 0; i < col.length; i++) {
      num = num * 26 + (col.charCodeAt(i) - 64);
    }
    return num - 1; // 0-based index
  }
}

// Initialize service singleton
const service = new EnhancedGoogleSheetsService();

// ============================================================================
// 3. API ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/google-sheet
 * Query params:
 * - action: "sheets" | "data" | "range" | "search"
 * - sheetName: string (for data, range, search)
 * - range: string (for range action)
 * - q: string (for search action)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "sheets";
    const sheetName = searchParams.get("sheetName") || "Sheet1";
    const range = searchParams.get("range");
    const searchQuery = searchParams.get("q");

    switch (action) {
      case "sheets":
        const sheets = await service.getSheets();
        return NextResponse.json({ success: true, data: sheets });

      case "data":
        const data = await service.getSheetData(sheetName);
        return NextResponse.json({ success: true, data });

      case "range":
        if (!range) {
          return NextResponse.json(
            { success: false, error: "Range parameter required" },
            { status: 400 },
          );
        }
        const rangeData = await service.getRange(range);
        return NextResponse.json({ success: true, data: rangeData });

      case "search":
        if (!searchQuery) {
          return NextResponse.json(
            { success: false, error: "Search query (q) required" },
            { status: 400 },
          );
        }
        const results = await service.search(sheetName, searchQuery);
        return NextResponse.json({ success: true, data: results });

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 },
        );
    }
  } catch (err: any) {
    console.error("GET Error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}

/**
 * POST /api/google-sheet
 * Body depends on action:
 * - createSheet: { action: "createSheet", title: string }
 * - appendRow: { action: "appendRow", sheetName?: string, values: any[] }
 * - insertRow: { action: "insertRow", sheetName: string, rowIndex: number, values?: any[] }
 * - addColumn: { action: "addColumn", sheetName?: string, headerName: string, position?: number }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "createSheet":
        const sheet = await service.createSheet(body.title);
        return NextResponse.json(
          { success: true, data: sheet },
          { status: 201 },
        );

      case "appendRow":
        const appendSchema = addRowSchema.parse(body);
        await service.appendRow(
          appendSchema.sheetName || "Sheet1",
          appendSchema.values,
        );
        return NextResponse.json(
          { success: true, message: "Row appended" },
          { status: 201 },
        );

      case "insertRow":
        await service.insertRow(body.sheetName, body.rowIndex, body.values);
        return NextResponse.json(
          { success: true, message: "Row inserted" },
          { status: 201 },
        );

      case "addColumn":
        const columnSchema = addColumnSchema.parse(body);
        await service.addColumn(
          columnSchema.sheetName || "Sheet1",
          columnSchema.headerName,
          columnSchema.position,
        );
        return NextResponse.json(
          { success: true, message: "Column added" },
          { status: 201 },
        );

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 },
        );
    }
  } catch (err: any) {
    console.error("POST Error:", err);

    if (err instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/google-sheet
 * Body:
 * - updateCell: { action: "updateCell", sheetName: string, row: number, col: number, value: any }
 * - batchUpdate: { action: "batchUpdate", sheetName: string, updates: Array<{row, col, value}> }
 * - updateRange: { action: "updateRange", range: string, values: any[][] }
 * - renameSheet: { action: "renameSheet", sheetId: number, newTitle: string }
 * - sort: { action: "sort", sheetName: string, range: string, sortColumn: number, ascending?: boolean }
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "updateCell":
        const cellSchema = cellUpdateSchema.parse(body);
        await service.updateCell(
          body.sheetName,
          cellSchema.row,
          cellSchema.col,
          cellSchema.value,
        );
        return NextResponse.json({ success: true, message: "Cell updated" });

      case "batchUpdate":
        const batchSchema = batchUpdateSchema.parse(body);
        await service.batchUpdate(body.sheetName, batchSchema.updates);
        return NextResponse.json({
          success: true,
          message: "Cells updated",
        });

      case "updateRange":
        const rangeSchema = rangeUpdateSchema.parse(body);
        await service.updateRange(rangeSchema.range, rangeSchema.values);
        return NextResponse.json({ success: true, message: "Range updated" });

      case "renameSheet":
        await service.renameSheet(body.sheetId, body.newTitle);
        return NextResponse.json({ success: true, message: "Sheet renamed" });

      case "sort":
        await service.sortRange(
          body.sheetName,
          body.range,
          body.sortColumn,
          body.ascending ?? true,
        );
        return NextResponse.json({ success: true, message: "Range sorted" });

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 },
        );
    }
  } catch (err: any) {
    console.error("PUT Error:", err);

    if (err instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: err.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/google-sheet
 * Query params:
 * - action: "sheet" | "row" | "column"
 * - sheetId: number (for sheet)
 * - sheetName: string (for row/column)
 * - index: number (for row/column - 0-based)
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const sheetId = searchParams.get("sheetId");
    const sheetName = searchParams.get("sheetName");
    const index = searchParams.get("index");

    switch (action) {
      case "sheet":
        if (!sheetId) {
          return NextResponse.json(
            { success: false, error: "sheetId required" },
            { status: 400 },
          );
        }
        await service.deleteSheet(parseInt(sheetId));
        return NextResponse.json({
          success: true,
          message: "Sheet deleted",
        });

      case "row":
        if (!sheetName || !index) {
          return NextResponse.json(
            { success: false, error: "sheetName and index required" },
            { status: 400 },
          );
        }
        await service.deleteRow(sheetName, parseInt(index));
        return NextResponse.json({ success: true, message: "Row deleted" });

      case "column":
        if (!sheetName || !index) {
          return NextResponse.json(
            { success: false, error: "sheetName and index required" },
            { status: 400 },
          );
        }
        await service.deleteColumn(sheetName, parseInt(index));
        return NextResponse.json({
          success: true,
          message: "Column deleted",
        });

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 },
        );
    }
  } catch (err: any) {
    console.error("DELETE Error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
