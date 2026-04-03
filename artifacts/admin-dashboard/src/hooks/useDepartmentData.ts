import { useState, useEffect, useMemo } from "react";
import { fetchSheetValues, parseNumber } from "@/lib/googleSheets";

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

export interface VehicleRow {
  sr: string;
  plateNo: string;
  name: string;
  fuelType: string;
  tankCapacity: number;
  remaining: number;
  refill: number;
}

export function useVehicleData(selectedDate?: string) {
  const [rows, setRows] = useState<string[][]>([]);
  const [dateCols, setDateCols] = useState<{ date: string; col: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetchSheetValues("Vehicle!A1:AZ60");
        setRows(r || []);
        setDateCols(getAllDateCols(r || [], 5, 3));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load vehicle data");
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
    ? selectedDate : latestDate;
  const currentIdx = dateCols.findIndex(d => d.date === currentDate);

  const data: VehicleRow[] = useMemo(() => {
    if (!rows.length || dateCols.length === 0) return [];
    const col = dateCols[currentIdx]?.col;
    if (col === undefined) return [];
    const result: VehicleRow[] = [];
    for (let r = 2; r < rows.length; r++) {
      const row = rows[r];
      if (!row[0] || row[0] === "TOTAL") continue;
      result.push({
        sr: row[0] || "",
        plateNo: row[1] || "",
        name: row[2] || "",
        fuelType: row[3] || "",
        tankCapacity: parseNumber(row[4]),
        remaining: parseNumber(row[col + 1]),
        refill: parseNumber(row[col + 2]),
      });
    }
    return result;
  }, [rows, dateCols, currentIdx]);

  return { data, availableDates, latestDate, currentDate, loading, error };
}

export interface WarehouseRow {
  sr: string;
  itemName: string;
  openingQty: number;
  openingAmount: number;
  purchaseQty: number;
  purchaseAmount: number;
}

export function useWarehouseData(selectedDate?: string) {
  const [rows, setRows] = useState<string[][]>([]);
  const [dateCols, setDateCols] = useState<{ date: string; col: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetchSheetValues("Warehouse!A1:AZ60");
        setRows(r || []);
        setDateCols(getAllDateCols(r || [], 2, 4));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load warehouse data");
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
    ? selectedDate : latestDate;
  const currentIdx = dateCols.findIndex(d => d.date === currentDate);

  const data: WarehouseRow[] = useMemo(() => {
    if (!rows.length || dateCols.length === 0) return [];
    const col = dateCols[currentIdx]?.col;
    if (col === undefined) return [];
    const result: WarehouseRow[] = [];
    for (let r = 3; r < rows.length; r++) {
      const row = rows[r];
      if (!row[0] || !row[1]) continue;
      result.push({
        sr: row[0] || "",
        itemName: row[1] || "",
        openingQty: parseNumber(row[col]),
        openingAmount: parseNumber(row[col + 1]),
        purchaseQty: parseNumber(row[col + 2]),
        purchaseAmount: parseNumber(row[col + 3]),
      });
    }
    return result;
  }, [rows, dateCols, currentIdx]);

  return { data, availableDates, latestDate, currentDate, loading, error };
}

export interface GeneratorRow {
  sr: string;
  shopName: string;
  generatorType: string;
  tankCapacity: number;
  remaining: number;
  refill: number;
}

export function useGeneratorData(selectedDate?: string) {
  const [rows, setRows] = useState<string[][]>([]);
  const [dateCols, setDateCols] = useState<{ date: string; col: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetchSheetValues("Generator!A1:AZ60");
        setRows(r || []);
        setDateCols(getAllDateCols(r || [], 4, 3));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load generator data");
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
    ? selectedDate : latestDate;
  const currentIdx = dateCols.findIndex(d => d.date === currentDate);

  const data: GeneratorRow[] = useMemo(() => {
    if (!rows.length || dateCols.length === 0) return [];
    const col = dateCols[currentIdx]?.col;
    if (col === undefined) return [];
    const result: GeneratorRow[] = [];
    for (let r = 2; r < rows.length; r++) {
      const row = rows[r];
      if (!row[0] || row[0] === "TOTAL") continue;
      result.push({
        sr: row[0] || "",
        shopName: row[1] || "",
        generatorType: row[2] || "",
        tankCapacity: parseNumber(row[3]),
        remaining: parseNumber(row[col]),
        refill: parseNumber(row[col + 1]),
      });
    }
    return result;
  }, [rows, dateCols, currentIdx]);

  return { data, availableDates, latestDate, currentDate, loading, error };
}

export interface ServiceRequestRow {
  sr: string;
  department: string;
  reqForm: number;
  finish: number;
  ongoing: number;
}

export function useServiceRequestData(sheetName: string, selectedDate?: string) {
  const [rows, setRows] = useState<string[][]>([]);
  const [dateCols, setDateCols] = useState<{ date: string; col: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetchSheetValues(`${sheetName}!A1:AZ60`);
        setRows(r || []);
        setDateCols(getAllDateCols(r || [], 2, 3));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load service data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sheetName]);

  const availableDates = useMemo(() => dateCols.map(d => d.date), [dateCols]);
  const latestFilledIdx = useMemo(() => findLastFilledIdx(rows, dateCols, 0), [rows, dateCols]);
  const latestDate = dateCols[latestFilledIdx]?.date || "";
  const currentDate = selectedDate && availableDates.includes(selectedDate)
    ? selectedDate : latestDate;
  const currentIdx = dateCols.findIndex(d => d.date === currentDate);

  const data: ServiceRequestRow[] = useMemo(() => {
    if (!rows.length || dateCols.length === 0) return [];
    const col = dateCols[currentIdx]?.col;
    if (col === undefined) return [];
    const result: ServiceRequestRow[] = [];
    for (let r = 2; r < rows.length; r++) {
      const row = rows[r];
      if (!row[0] || !row[1]) continue;
      result.push({
        sr: row[0] || "",
        department: row[1] || "",
        reqForm: parseNumber(row[col]),
        finish: parseNumber(row[col + 1]),
        ongoing: parseNumber(row[col + 2]),
      });
    }
    return result;
  }, [rows, dateCols, currentIdx]);

  return { data, availableDates, latestDate, currentDate, loading, error };
}
