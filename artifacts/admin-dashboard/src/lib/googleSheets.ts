const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
const BASE_URL = "https://sheets.googleapis.com/v4/spreadsheets";

export async function fetchSheetValues(range: string): Promise<string[][]> {
  const url = `${BASE_URL}/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch sheet: ${range}`);
  const data = await res.json();
  return data.values || [];
}

export async function fetchMultipleRanges(ranges: string[]): Promise<Record<string, string[][]>> {
  const rangeParams = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join("&");
  const url = `${BASE_URL}/${SPREADSHEET_ID}/values:batchGet?${rangeParams}&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to batch fetch sheets");
  const data = await res.json();
  const result: Record<string, string[][]> = {};
  (data.valueRanges || []).forEach((vr: { range: string; values?: string[][] }, i: number) => {
    result[ranges[i]] = vr.values || [];
  });
  return result;
}

export function parseNumber(val: string | undefined): number {
  if (!val) return 0;
  const clean = val.replace(/,/g, "").replace(/\s/g, "").replace(/`/g, "");
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toFixed(0);
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("my-MM").format(Math.round(n));
}
