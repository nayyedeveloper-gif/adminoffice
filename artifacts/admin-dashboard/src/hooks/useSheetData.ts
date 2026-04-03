import { useState, useEffect, useMemo } from "react";
import { fetchSheetValues, parseNumber } from "@/lib/googleSheets";

export interface AttendanceSummary {
  section: string;
  latestTotal: number;
  latestPresent: number;
  latestAbsent: number;
  attendanceRate: number;
  prevTotal: number;
  prevPresent: number;
  prevAbsent: number;
}

export interface CanteenSummary {
  shop: string;
  opening: number;
  purchase: number;
  sale: number;
  closing: number;
}

export interface PurchaseSummary {
  description: string;
  qty: number;
  finish: number;
  ongoing: number;
}

function getAllDateCols(
  rows: string[][],
  startCol: number,
  step: number
): { date: string; col: number }[] {
  if (!rows.length) return [];
  const header = rows[0];
  const result: { date: string; col: number }[] = [];
  for (let c = startCol; c < header.length; c += step) {
    if (header[c]) result.push({ date: header[c].trim(), col: c });
  }
  return result;
}

function findLastFilledIdx(
  rows: string[][],
  dateCols: { date: string; col: number }[],
  dataOffset: number
): number {
  for (let i = dateCols.length - 1; i >= 0; i--) {
    const checkCol = dateCols[i].col + dataOffset;
    for (let r = 2; r < rows.length; r++) {
      const val = rows[r]?.[checkCol];
      if (val && val.trim() !== "" && val.trim() !== "-" && parseNumber(val) > 0) {
        return i;
      }
    }
  }
  return dateCols.length > 0 ? dateCols.length - 1 : 0;
}

function buildSummaryForCol(
  rows: string[][],
  col: number
): Record<string, { total: number; present: number; absent: number }> {
  const map: Record<string, { total: number; present: number; absent: number }> = {};
  for (let r = 2; r < rows.length; r++) {
    const row = rows[r];
    const section = row[1]?.trim();
    if (!section || section === "TOTAL") continue;
    if (!map[section]) map[section] = { total: 0, present: 0, absent: 0 };
    map[section].total += parseNumber(row[col]);
    map[section].present += parseNumber(row[col + 1]);
    map[section].absent += parseNumber(row[col + 2]);
  }
  return map;
}

export function useAttendanceData(selectedDate?: string) {
  const [rows, setRows] = useState<string[][]>([]);
  const [dateCols, setDateCols] = useState<{ date: string; col: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetchSheetValues("Attendance!A1:AS60");
        setRows(r || []);
        setDateCols(getAllDateCols(r || [], 3, 3));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load attendance");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const availableDates = useMemo(() => dateCols.map(d => d.date), [dateCols]);

  const latestFilledIdx = useMemo(() => findLastFilledIdx(rows, dateCols, 1), [rows, dateCols]);
  const latestDate = dateCols[latestFilledIdx]?.date || "";

  const currentDate = selectedDate && availableDates.includes(selectedDate)
    ? selectedDate
    : latestDate;

  const currentIdx = dateCols.findIndex(d => d.date === currentDate);
  const prevIdx = currentIdx > 0 ? currentIdx - 1 : -1;

  const data: AttendanceSummary[] = useMemo(() => {
    if (!rows.length || dateCols.length === 0) return [];
    const currCol = dateCols[currentIdx]?.col;
    if (currCol === undefined) return [];
    const currMap = buildSummaryForCol(rows, currCol);
    const prevMap = prevIdx >= 0
      ? buildSummaryForCol(rows, dateCols[prevIdx].col)
      : {};

    return Object.entries(currMap).map(([section, vals]) => {
      const prev = prevMap[section] || { total: 0, present: 0, absent: 0 };
      return {
        section,
        latestTotal: vals.total,
        latestPresent: vals.present,
        latestAbsent: vals.absent,
        attendanceRate: vals.total > 0 ? (vals.present / vals.total) * 100 : 0,
        prevTotal: prev.total,
        prevPresent: prev.present,
        prevAbsent: prev.absent,
      };
    });
  }, [rows, dateCols, currentIdx, prevIdx]);

  const prevDate = prevIdx >= 0 ? dateCols[prevIdx].date : "";

  return { data, availableDates, latestDate, currentDate, prevDate, loading, error };
}

export function useCanteenData(selectedDate?: string) {
  const [rows, setRows] = useState<string[][]>([]);
  const [dateCols, setDateCols] = useState<{ date: string; col: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetchSheetValues("Canteen!A1:BN60");
        setRows(r || []);
        setDateCols(getAllDateCols(r || [], 2, 4));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load canteen");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const availableDates = useMemo(() => dateCols.map(d => d.date), [dateCols]);
  const latestFilledIdx = useMemo(() => findLastFilledIdx(rows, dateCols, 2), [rows, dateCols]);
  const latestDate = dateCols[latestFilledIdx]?.date || "";
  const currentDate = selectedDate && availableDates.includes(selectedDate)
    ? selectedDate
    : latestDate;

  const currentIdx = dateCols.findIndex(d => d.date === currentDate);
  const prevIdx = currentIdx > 0 ? currentIdx - 1 : -1;

  const { data, prevData } = useMemo(() => {
    if (!rows.length || dateCols.length === 0) return { data: [], prevData: [] };
    const buildCanteen = (idx: number): CanteenSummary[] => {
      const col = dateCols[idx]?.col;
      if (col === undefined) return [];
      const result: CanteenSummary[] = [];
      for (let r = 2; r < rows.length; r++) {
        const row = rows[r];
        const shop = row[1]?.trim();
        if (!shop) continue;
        result.push({
          shop,
          opening: parseNumber(row[col]),
          purchase: parseNumber(row[col + 1]),
          sale: parseNumber(row[col + 2]),
          closing: parseNumber(row[col + 3]),
        });
      }
      return result;
    };
    return { data: buildCanteen(currentIdx), prevData: buildCanteen(prevIdx) };
  }, [rows, dateCols, currentIdx, prevIdx]);

  const prevDate = prevIdx >= 0 ? dateCols[prevIdx].date : "";
  return { data, prevData, availableDates, latestDate, currentDate, prevDate, loading, error };
}

export function usePurchaseData(selectedDate?: string) {
  const [rows, setRows] = useState<string[][]>([]);
  const [dateCols, setDateCols] = useState<{ date: string; col: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetchSheetValues("General Purchase!A1:AZ60");
        setRows(r || []);
        setDateCols(getAllDateCols(r || [], 2, 3));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load purchases");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const availableDates = useMemo(() => dateCols.map(d => d.date), [dateCols]);
  const latestFilledIdx = useMemo(() => findLastFilledIdx(rows, dateCols, 0), [rows, dateCols]);
  const latestDate = dateCols[latestFilledIdx]?.date || "";
  const currentDate = selectedDate && availableDates.includes(selectedDate)
    ? selectedDate
    : latestDate;
  const currentIdx = dateCols.findIndex(d => d.date === currentDate);

  const data: PurchaseSummary[] = useMemo(() => {
    if (!rows.length || dateCols.length === 0) return [];
    const col = dateCols[currentIdx]?.col;
    if (col === undefined) return [];
    const result: PurchaseSummary[] = [];
    for (let r = 2; r < rows.length; r++) {
      const row = rows[r];
      const desc = row[1]?.trim();
      if (!desc || desc === "TOTAL") continue;
      result.push({
        description: desc,
        qty: parseNumber(row[col]),
        finish: parseNumber(row[col + 1]),
        ongoing: parseNumber(row[col + 2]),
      });
    }
    return result;
  }, [rows, dateCols, currentIdx]);

  return { data, availableDates, latestDate, currentDate, loading, error };
}
