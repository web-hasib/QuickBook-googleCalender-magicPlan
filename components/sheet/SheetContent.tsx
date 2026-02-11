"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Search,
  RefreshCw,
  Plus,
  Download,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
  FileText,
  Columns,
  Rows,
  ArrowUpDown,
} from "lucide-react";

interface SheetData {
  headers: string[];
  rows: any[][];
  rowCount: number;
  columnCount: number;
}

interface SheetInfo {
  id: string;
  title: string;
  rowCount: number;
  columnCount: number;
}

interface EditingCell {
  row: number;
  col: number;
  value: any;
}

interface PaginationInfo {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalItems: number;
}

export default function SheetContent() {
  const [data, setData] = useState<SheetData | null>(null);
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentSheet, setCurrentSheet] = useState<string>("");
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    itemsPerPage: 10,
    totalPages: 1,
    startIndex: 0,
    endIndex: 10,
    totalItems: 0,
  });

  // Edit & Add states
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [showAddRow, setShowAddRow] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [newRowData, setNewRowData] = useState<string[]>([]);
  const [newColumnName, setNewColumnName] = useState("");
  const [newSheetName, setNewSheetName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Sort state
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortAscending, setSortAscending] = useState(true);

  // Fetch all sheets with error handling
  const fetchSheets = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/sheet?action=sheets");

      if (!response.ok) {
        throw new Error(`Failed to fetch sheets: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        setSheets(result.data);
        // Set current sheet to first sheet if not set
        if (result.data.length > 0 && !currentSheet) {
          setCurrentSheet(result.data[0].title);
        }
      } else {
        throw new Error(result.error || "Failed to load sheets");
      }
    } catch (error) {
      console.error("Error fetching sheets:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load sheets",
      );
    }
  }, [currentSheet]);

  // Fetch sheet data with caching and error handling
  const fetchData = useCallback(
    async (sheetName: string) => {
      if (!sheetName) return;

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/sheet?action=data&sheetName=${encodeURIComponent(sheetName)}`,
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const result = await response.json();
        if (result.success) {
          setData(result.data);
          // Initialize new row data with empty values for each column
          setNewRowData(new Array(result.data.headers.length).fill(""));

          // Update pagination
          const totalItems = result.data.rows.length;
          const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
          setPagination((prev) => ({
            ...prev,
            totalPages,
            totalItems,
            startIndex: (prev.currentPage - 1) * prev.itemsPerPage,
            endIndex: Math.min(
              prev.currentPage * prev.itemsPerPage,
              totalItems,
            ),
          }));
        } else {
          throw new Error(result.error || "Failed to load sheet data");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load sheet data",
        );
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [pagination.itemsPerPage],
  );

  // Load data when sheet changes
  useEffect(() => {
    if (currentSheet) {
      fetchData(currentSheet);
    }
  }, [currentSheet, fetchData]);

  // Initial load
  useEffect(() => {
    fetchSheets();
  }, [fetchSheets]);

  // Update cell with optimistic updates
  const updateCell = async (row: number, col: number, value: any) => {
    if (!data) return;

    // Optimistic update
    const updatedRows = [...data.rows];
    if (updatedRows[row] && updatedRows[row][col] !== undefined) {
      updatedRows[row][col] = value;
      setData({
        ...data,
        rows: updatedRows,
      });
    }

    try {
      const response = await fetch("/api/sheet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateCell",
          sheetName: currentSheet,
          row: row + 2, // +2 because headers are row 1 and data starts at row 2
          col: col + 1, // +1 because columns are 1-indexed in Sheets
          value,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        // Revert optimistic update on error
        await fetchData(currentSheet);
        throw new Error(result.error || "Failed to update cell");
      }
    } catch (error) {
      console.error("Error updating cell:", error);
      // Revert optimistic update
      await fetchData(currentSheet);
    }
  };

  // Add row with validation
  const addRow = async () => {
    if (!data) return;

    // Validate new row data
    if (newRowData.length !== data.headers.length) {
      setError("Row data doesn't match number of columns");
      return;
    }

    try {
      const response = await fetch("/api/sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "appendRow",
          sheetName: currentSheet,
          values: newRowData,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setShowAddRow(false);
        setNewRowData(new Array(data.headers.length).fill(""));
        await fetchData(currentSheet);
        setError(null);
      } else {
        throw new Error(result.error || "Failed to add row");
      }
    } catch (error) {
      console.error("Error adding row:", error);
      setError(error instanceof Error ? error.message : "Failed to add row");
    }
  };

  // Delete row with confirmation
  const deleteRow = async (rowIndex: number) => {
    if (!data || rowIndex < 0 || rowIndex >= data.rows.length) return;

    if (!confirm(`Are you sure you want to delete row ${rowIndex + 1}?`))
      return;

    try {
      const response = await fetch(
        `/api/sheet?action=row&sheetName=${currentSheet}&index=${rowIndex + 1}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();
      if (result.success) {
        await fetchData(currentSheet);
      } else {
        throw new Error(result.error || "Failed to delete row");
      }
    } catch (error) {
      console.error("Error deleting row:", error);
      setError(error instanceof Error ? error.message : "Failed to delete row");
    }
  };

  // Add column
  const addColumn = async () => {
    if (!newColumnName.trim()) {
      setError("Column name is required");
      return;
    }

    try {
      const response = await fetch("/api/sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addColumn",
          sheetName: currentSheet,
          headerName: newColumnName,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setShowAddColumn(false);
        setNewColumnName("");
        await fetchData(currentSheet);
        setError(null);
      } else {
        throw new Error(result.error || "Failed to add column");
      }
    } catch (error) {
      console.error("Error adding column:", error);
      setError(error instanceof Error ? error.message : "Failed to add column");
    }
  };

  // Create sheet
  const createSheet = async () => {
    if (!newSheetName.trim()) {
      setError("Sheet name is required");
      return;
    }

    try {
      const response = await fetch("/api/sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createSheet",
          title: newSheetName,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setShowCreateSheet(false);
        setNewSheetName("");
        await fetchSheets();
        setCurrentSheet(newSheetName);
        setError(null);
      } else {
        throw new Error(result.error || "Failed to create sheet");
      }
    } catch (error) {
      console.error("Error creating sheet:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create sheet",
      );
    }
  };

  // Sort data
  const sortData = async (columnIndex: number) => {
    if (!data) return;

    const newAscending = sortColumn === columnIndex ? !sortAscending : true;
    setSortColumn(columnIndex);
    setSortAscending(newAscending);

    try {
      const columnLetter = String.fromCharCode(65 + columnIndex);
      const response = await fetch("/api/sheet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sort",
          sheetName: currentSheet,
          columnIndex,
          ascending: newAscending,
        }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchData(currentSheet);
      } else {
        throw new Error(result.error || "Failed to sort data");
      }
    } catch (error) {
      console.error("Error sorting:", error);
      setError(error instanceof Error ? error.message : "Failed to sort data");
    }
  };

  // Search handler
  const performSearch = useCallback(async () => {
    if (!searchTerm.trim()) return;

    try {
      const response = await fetch(
        `/api/sheet?action=search&sheetName=${encodeURIComponent(currentSheet)}&q=${encodeURIComponent(searchTerm)}`,
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        // If the API returns filtered results, update the data
        if (result.data) {
          setData(result.data);
        }
      } else {
        throw new Error(result.error || "Search failed");
      }
    } catch (error) {
      console.error("Error searching:", error);
      setError(error instanceof Error ? error.message : "Search failed");
    }
  }, [currentSheet, searchTerm]);

  // Handle search input
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (!value.trim() && data) {
      // Reset to original data when search is cleared
      fetchData(currentSheet);
    }
  };

  // Filter rows locally for display (fallback if API search fails)
  const filteredRows = useMemo(() => {
    if (!data?.rows) return [];

    if (!searchTerm.trim()) return data.rows;

    return data.rows.filter((row) =>
      row.some((cell) =>
        String(cell).toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );
  }, [data, searchTerm]);

  // Update pagination when filtered rows change
  useEffect(() => {
    const totalItems = filteredRows.length;
    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);

    setPagination((prev) => ({
      ...prev,
      totalPages,
      totalItems,
      startIndex: Math.min(
        (prev.currentPage - 1) * prev.itemsPerPage,
        totalItems,
      ),
      endIndex: Math.min(prev.currentPage * prev.itemsPerPage, totalItems),
    }));
  }, [filteredRows, pagination.currentPage, pagination.itemsPerPage]);

  // Get current page rows
  const currentRows = useMemo(() => {
    const start = pagination.startIndex;
    const end = pagination.endIndex;
    return filteredRows.slice(start, end);
  }, [filteredRows, pagination.startIndex, pagination.endIndex]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination((prev) => ({
      ...prev,
      currentPage: Math.max(1, Math.min(page, prev.totalPages)),
    }));
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!data) return;

    const csvContent = [
      data.headers.join(","),
      ...filteredRows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentSheet || "sheet"}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle cell edit
  const handleCellEdit = (rowIndex: number, colIndex: number, value: any) => {
    setEditingCell({
      row: rowIndex,
      col: colIndex,
      value,
    });
  };

  // Handle save edit
  const handleSaveEdit = async (value: string) => {
    if (!editingCell) return;

    await updateCell(editingCell.row, editingCell.col, value);
    setEditingCell(null);
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/page-background.jpg')",
        }}
        aria-hidden="true"
      />

      {/* Glassmorphism overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-500/20 border border-red-500/30 backdrop-blur-xl rounded-xl p-4 max-w-md shadow-2xl animate-in slide-in-from-right-4">
          <div className="flex items-start gap-3">
            <article className="h-5 w-5 text-red-300 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-200 font-semibold">Error</p>
              <p className="text-red-300/90 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-300 hover:text-red-200 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative min-h-screen flex flex-col px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header Section */}
        <div className="w-full max-w-7xl mx-auto mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg mb-2">
                  Google Sheets Dashboard
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-white/90 drop-shadow-md">
                  Manage and view your spreadsheet data in real-time
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl backdrop-blur-sm shadow-lg">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
                <span className="text-emerald-300 font-semibold text-sm">
                  {data ? data.rows.length : 0} rows
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-7xl mx-auto space-y-6 flex-1">
          {/* Sheet Tabs */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-4 border border-white/20">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {sheets.map((sheet) => (
                <button
                  key={sheet.id}
                  onClick={() => setCurrentSheet(sheet.title)}
                  className={`px-4 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap shadow-lg ${
                    currentSheet === sheet.title
                      ? "bg-white/30 border border-white/40 text-white"
                      : "bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 hover:text-white"
                  }`}>
                  <FileText className="inline-block h-4 w-4 mr-2" />
                  {sheet.title}
                </button>
              ))}
              <button
                onClick={() => setShowCreateSheet(true)}
                className="px-4 py-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-300 hover:bg-emerald-500/30 hover:border-emerald-400/50 transition-all whitespace-nowrap font-semibold shadow-lg">
                <Plus className="inline-block h-4 w-4 mr-2" />
                New Sheet
              </button>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-4 sm:p-6 border border-white/20">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search Input */}
              <div className="relative w-full lg:w-96 group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 h-5 w-5 group-hover:text-white/80 transition-colors" />
                <input
                  type="text"
                  placeholder="Search across all data..."
                  value={searchTerm}
                  onChange={(e) => {
                    handleSearchChange(e.target.value);
                    setPagination((prev) => ({ ...prev, currentPage: 1 }));
                  }}
                  onKeyDown={(e) => e.key === "Enter" && performSearch()}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:border-white/40 focus:ring-2 focus:ring-white/20 focus:outline-none transition-all backdrop-blur-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 w-full lg:w-auto flex-wrap">
                <button
                  onClick={() => fetchData(currentSheet)}
                  disabled={loading}
                  className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 hover:border-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                  {loading ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={() => setShowAddRow(true)}
                  disabled={!data}
                  className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-300 hover:bg-blue-500/30 hover:border-blue-400/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg">
                  <Rows className="h-5 w-5" />
                  <span>Add Row</span>
                </button>
                <button
                  onClick={() => setShowAddColumn(true)}
                  disabled={!data}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/20 border border-purple-400/30 rounded-xl text-purple-300 hover:bg-purple-500/30 hover:border-purple-400/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg">
                  <Columns className="h-5 w-5" />
                  <span className="hidden sm:inline">Add Column</span>
                </button>
                <button
                  onClick={exportToCSV}
                  disabled={!data || filteredRows.length === 0}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-300 hover:bg-emerald-500/30 hover:border-emerald-400/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
                  <Download className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Add Row Modal */}
          {showAddRow && data && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Add New Row</h2>
                  <button
                    onClick={() => setShowAddRow(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="h-5 w-5 text-white/80" />
                  </button>
                </div>
                <div className="space-y-4">
                  {data.headers.map((header, index) => (
                    <div key={index}>
                      <label className="block text-sm font-semibold text-white/90 mb-2">
                        {header}
                      </label>
                      <input
                        type="text"
                        value={newRowData[index] || ""}
                        onChange={(e) => {
                          const updated = [...newRowData];
                          updated[index] = e.target.value;
                          setNewRowData(updated);
                        }}
                        className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:border-white/40 focus:ring-2 focus:ring-white/20 focus:outline-none backdrop-blur-sm"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={addRow}
                    className="flex-1 px-4 py-3 bg-blue-500/30 border border-blue-400/40 text-white font-semibold rounded-xl hover:bg-blue-500/40 transition-all shadow-lg">
                    Add Row
                  </button>
                  <button
                    onClick={() => setShowAddRow(false)}
                    className="px-4 py-3 bg-white/10 border border-white/20 text-white/90 font-semibold rounded-xl hover:bg-white/20 transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Column Modal */}
          {showAddColumn && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    Add New Column
                  </h2>
                  <button
                    onClick={() => setShowAddColumn(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="h-5 w-5 text-white/80" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-white/90 mb-2">
                      Column Name
                    </label>
                    <input
                      type="text"
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      placeholder="Enter column name..."
                      className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:border-white/40 focus:ring-2 focus:ring-white/20 focus:outline-none backdrop-blur-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={addColumn}
                    className="flex-1 px-4 py-3 bg-purple-500/30 border border-purple-400/40 text-white font-semibold rounded-xl hover:bg-purple-500/40 transition-all shadow-lg">
                    Add Column
                  </button>
                  <button
                    onClick={() => setShowAddColumn(false)}
                    className="px-4 py-3 bg-white/10 border border-white/20 text-white/90 font-semibold rounded-xl hover:bg-white/20 transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create Sheet Modal */}
          {showCreateSheet && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    Create New Sheet
                  </h2>
                  <button
                    onClick={() => setShowCreateSheet(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="h-5 w-5 text-white/80" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-white/90 mb-2">
                      Sheet Name
                    </label>
                    <input
                      type="text"
                      value={newSheetName}
                      onChange={(e) => setNewSheetName(e.target.value)}
                      placeholder="Enter sheet name..."
                      className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:border-white/40 focus:ring-2 focus:ring-white/20 focus:outline-none backdrop-blur-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={createSheet}
                    className="flex-1 px-4 py-3 bg-emerald-500/30 border border-emerald-400/40 text-white font-semibold rounded-xl hover:bg-emerald-500/40 transition-all shadow-lg">
                    Create Sheet
                  </button>
                  <button
                    onClick={() => setShowCreateSheet(false)}
                    className="px-4 py-3 bg-white/10 border border-white/20 text-white/90 font-semibold rounded-xl hover:bg-white/20 transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Table Section */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
            {!data && loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="text-center space-y-4">
                  <Loader2 className="h-16 w-16 animate-spin text-white mx-auto" />
                  <p className="text-white text-xl font-semibold">
                    Loading sheet data...
                  </p>
                </div>
              </div>
            ) : data && currentRows.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/20 bg-white/5">
                        {data.headers.map((header, index) => (
                          <th
                            key={index}
                            className="px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider whitespace-nowrap group">
                            <div className="flex items-center gap-2">
                              {header}
                              <button
                                onClick={() => sortData(index)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowUpDown className="h-4 w-4 text-white/60 hover:text-white" />
                              </button>
                            </div>
                          </th>
                        ))}
                        <th className="px-6 py-4 text-right text-sm font-semibold text-white uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {currentRows.map((row, rowIndex) => {
                        const actualRowIndex = pagination.startIndex + rowIndex;
                        return (
                          <tr
                            key={actualRowIndex}
                            className="hover:bg-white/5 transition-colors group">
                            {row.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="px-6 py-4 text-white/90 whitespace-nowrap cursor-pointer hover:bg-white/10 transition-colors"
                                onClick={() =>
                                  handleCellEdit(
                                    actualRowIndex,
                                    cellIndex,
                                    cell,
                                  )
                                }>
                                {editingCell?.row === actualRowIndex &&
                                editingCell?.col === cellIndex ? (
                                  <input
                                    type="text"
                                    defaultValue={cell}
                                    autoFocus
                                    onBlur={(e) =>
                                      handleSaveEdit(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleSaveEdit(e.currentTarget.value);
                                      } else if (e.key === "Escape") {
                                        setEditingCell(null);
                                      }
                                    }}
                                    className="w-full px-2 py-1 bg-white/20 border border-white/40 rounded text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                                  />
                                ) : (
                                  cell || (
                                    <span className="text-white/40 italic">
                                      —
                                    </span>
                                  )
                                )}
                              </td>
                            ))}
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => deleteRow(actualRowIndex)}
                                  className="p-2 text-red-300 hover:bg-red-500/20 rounded-lg transition-colors">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4 p-4">
                  {currentRows.map((row, rowIndex) => {
                    const actualRowIndex = pagination.startIndex + rowIndex;
                    return (
                      <div
                        key={actualRowIndex}
                        className="bg-white/5 border border-white/20 rounded-xl p-4 space-y-3 backdrop-blur-sm">
                        {data.headers.map((header, cellIndex) => (
                          <div
                            key={cellIndex}
                            className="flex justify-between items-start gap-3">
                            <span className="text-white/70 text-sm font-semibold">
                              {header}:
                            </span>
                            <span className="text-white text-sm text-right">
                              {row[cellIndex] || (
                                <span className="text-white/40 italic">—</span>
                              )}
                            </span>
                          </div>
                        ))}
                        <div className="flex gap-2 pt-2 border-t border-white/20">
                          <button
                            onClick={() => deleteRow(actualRowIndex)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-300 bg-red-500/20 border border-red-400/30 rounded-lg text-sm font-semibold hover:bg-red-500/30 transition-all">
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="border-t border-white/20 bg-white/5 px-6 py-4 backdrop-blur-sm">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-white/80 text-sm">
                        Showing {pagination.startIndex + 1} to{" "}
                        {pagination.endIndex} of {filteredRows.length} results
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handlePageChange(pagination.currentPage - 1)
                          }
                          disabled={pagination.currentPage === 1}
                          className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <div className="flex gap-1">
                          {Array.from(
                            { length: pagination.totalPages },
                            (_, i) => i + 1,
                          )
                            .filter(
                              (page) =>
                                page === 1 ||
                                page === pagination.totalPages ||
                                Math.abs(page - pagination.currentPage) <= 1,
                            )
                            .map((page, index, array) => (
                              <div
                                key={page}
                                className="flex items-center gap-1">
                                {index > 0 && array[index - 1] !== page - 1 && (
                                  <span className="text-white/40 px-2">
                                    ...
                                  </span>
                                )}
                                <button
                                  onClick={() => handlePageChange(page)}
                                  className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                                    pagination.currentPage === page
                                      ? "bg-white/30 border border-white/40 text-white shadow-lg"
                                      : "bg-white/10 border border-white/20 text-white/80 hover:bg-white/20"
                                  }`}>
                                  {page}
                                </button>
                              </div>
                            ))}
                        </div>
                        <button
                          onClick={() =>
                            handlePageChange(pagination.currentPage + 1)
                          }
                          disabled={
                            pagination.currentPage === pagination.totalPages
                          }
                          className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-24 space-y-4">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm">
                  <Filter className="h-10 w-10 text-white/60" />
                </div>
                <div>
                  <p className="text-white text-xl font-semibold">
                    {data ? "No matching data found" : "No data available"}
                  </p>
                  <p className="text-white/70 text-sm mt-2">
                    {searchTerm
                      ? "Try adjusting your search terms"
                      : "Start by adding some data to your sheet"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          {data && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:bg-white/15 hover:-translate-y-1 transition-all group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm mb-1 font-medium">
                      Total Rows
                    </p>
                    <p className="text-3xl font-bold text-white">
                      {data.rows.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 border border-blue-400/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Rows className="w-6 h-6 text-blue-300" />
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:bg-white/15 hover:-translate-y-1 transition-all group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm mb-1 font-medium">
                      Columns
                    </p>
                    <p className="text-3xl font-bold text-white">
                      {data.columnCount}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 border border-purple-400/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Columns className="w-6 h-6 text-purple-300" />
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:bg-white/15 hover:-translate-y-1 transition-all group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm mb-1 font-medium">
                      Filtered
                    </p>
                    <p className="text-3xl font-bold text-white">
                      {filteredRows.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-400/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Search className="w-6 h-6 text-emerald-300" />
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:bg-white/15 hover:-translate-y-1 transition-all group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm mb-1 font-medium">
                      Current Page
                    </p>
                    <p className="text-3xl font-bold text-white">
                      {pagination.currentPage}/{pagination.totalPages}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500/20 border border-orange-400/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6 text-orange-300" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
