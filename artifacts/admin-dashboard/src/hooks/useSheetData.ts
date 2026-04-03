import { useState, useEffect } from "react";
import { fetchSheetValues, parseNumber } from "@/lib/googleSheets";

export interface AttendanceSummary {
  section: string;
  latestTotal: number;
  latestPresent: number;
  latestAbsent: number;
  attendanceRate: number;
}

function findLastFilledDateCol(
  rows: string[][],
  startCol: number,
  step: number,
  dataCheckOffset: number = 0
): number {
  if (rows.length < 3) return startCol;
  const headerRow = rows[0];
  let lastValidCol = startCol;
  for (let c = startCol; c < headerRow.length; c += step) {
    if (!headerRow[c]) continue;
    const checkCol = c + dataCheckOffset;
    let hasData = false;
    for (let r = 2; r < rows.length; r++) {
      if (rows[r][checkCol] && parseNumber(rows[r][checkCol]) > 0) {
        hasData = true;
        break;
      }
    }
    if (hasData) lastValidCol = c;
  }
  return lastValidCol;
}

export function useAttendanceData() {
  const [data, setData] = useState<AttendanceSummary[]>([]);
  const [latestDate, setLatestDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const rows = await fetchSheetValues("Attendance!A1:AS50");
        if (!rows || rows.length < 3) return;

        const latestCol = findLastFilledDateCol(rows, 3, 3, 1);
        const dateStr = rows[0][latestCol] || "";
        setLatestDate(dateStr);

        const summaryMap: Record<string, { total: number; present: number; absent: number }> = {};

        for (let r = 2; r < rows.length; r++) {
          const row = rows[r];
          const section = row[1]?.trim();
          if (!section || section === "TOTAL") continue;

          if (!summaryMap[section]) {
            summaryMap[section] = { total: 0, present: 0, absent: 0 };
          }

          summaryMap[section].total += parseNumber(row[latestCol]);
          summaryMap[section].present += parseNumber(row[latestCol + 1]);
          summaryMap[section].absent += parseNumber(row[latestCol + 2]);
        }

        const result: AttendanceSummary[] = Object.entries(summaryMap).map(([section, vals]) => ({
          section,
          latestTotal: vals.total,
          latestPresent: vals.present,
          latestAbsent: vals.absent,
          attendanceRate: vals.total > 0 ? (vals.present / vals.total) * 100 : 0,
        }));

        setData(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load attendance");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { data, latestDate, loading, error };
}

export interface CanteenSummary {
  shop: string;
  opening: number;
  purchase: number;
  sale: number;
  closing: number;
}

export function useCanteenData() {
  const [data, setData] = useState<CanteenSummary[]>([]);
  const [latestDate, setLatestDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const rows = await fetchSheetValues("Canteen!A1:BN50");
        if (!rows || rows.length < 3) return;

        const latestCol = findLastFilledDateCol(rows, 2, 4, 2);
        setLatestDate(rows[0][latestCol] || "");

        const result: CanteenSummary[] = [];
        for (let r = 2; r < rows.length; r++) {
          const row = rows[r];
          const shop = row[1]?.trim();
          if (!shop) continue;
          result.push({
            shop,
            opening: parseNumber(row[latestCol]),
            purchase: parseNumber(row[latestCol + 1]),
            sale: parseNumber(row[latestCol + 2]),
            closing: parseNumber(row[latestCol + 3]),
          });
        }
        setData(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load canteen");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { data, latestDate, loading, error };
}

export interface PurchaseSummary {
  description: string;
  qty: number;
  finish: number;
  ongoing: number;
}

export function usePurchaseData() {
  const [data, setData] = useState<PurchaseSummary[]>([]);
  const [latestDate, setLatestDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const rows = await fetchSheetValues("General Purchase!A1:AZ50");
        if (!rows || rows.length < 3) return;

        const latestCol = findLastFilledDateCol(rows, 2, 3);
        setLatestDate(rows[0][latestCol] || "");

        const result: PurchaseSummary[] = [];
        for (let r = 2; r < rows.length; r++) {
          const row = rows[r];
          const desc = row[1]?.trim();
          if (!desc || desc === "TOTAL") continue;
          result.push({
            description: desc,
            qty: parseNumber(row[latestCol]),
            finish: parseNumber(row[latestCol + 1]),
            ongoing: parseNumber(row[latestCol + 2]),
          });
        }
        setData(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load purchases");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { data, latestDate, loading, error };
}
