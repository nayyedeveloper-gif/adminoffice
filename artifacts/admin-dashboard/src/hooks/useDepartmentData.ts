import { useState, useEffect } from "react";
import { fetchSheetValues, parseNumber } from "@/lib/googleSheets";

export interface VehicleRow {
  sr: string;
  plateNo: string;
  name: string;
  fuelType: string;
  tankCapacity: number;
  remaining: number;
  refill: number;
  used: number;
}

export function useVehicleData() {
  const [data, setData] = useState<VehicleRow[]>([]);
  const [latestDate, setLatestDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const rows = await fetchSheetValues("Vehicle!A1:AZ60");
        if (!rows || rows.length < 3) return;

        const header0 = rows[0];
        let latestDateCol = 5;
        for (let c = 5; c < header0.length; c += 3) {
          if (header0[c]) {
            let hasData = false;
            for (let r = 2; r < rows.length; r++) {
              if (rows[r][c + 1] && parseNumber(rows[r][c + 1]) > 0) { hasData = true; break; }
            }
            if (hasData) { latestDateCol = c; }
          }
        }
        setLatestDate(header0[latestDateCol] || "");

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
            remaining: parseNumber(row[latestDateCol + 1]),
            refill: parseNumber(row[latestDateCol + 2]),
            used: parseNumber(row[latestDateCol + 3]),
          });
        }
        setData(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { data, latestDate, loading, error };
}

export interface WarehouseRow {
  sr: string;
  itemName: string;
  openingQty: number;
  openingAmount: number;
  purchaseQty: number;
  purchaseAmount: number;
}

export function useWarehouseData() {
  const [data, setData] = useState<WarehouseRow[]>([]);
  const [latestDate, setLatestDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const rows = await fetchSheetValues("Warehouse!A1:AZ60");
        if (!rows || rows.length < 4) return;

        const header0 = rows[0];
        let latestDateCol = 2;
        for (let c = 2; c < header0.length; c += 4) {
          if (header0[c]) {
            let hasData = false;
            for (let r = 3; r < rows.length; r++) {
              if (rows[r][c] && parseNumber(rows[r][c]) > 0) { hasData = true; break; }
            }
            if (hasData) { latestDateCol = c; }
          }
        }
        setLatestDate(header0[latestDateCol] || "");

        const result: WarehouseRow[] = [];
        for (let r = 3; r < rows.length; r++) {
          const row = rows[r];
          if (!row[0] || !row[1]) continue;
          result.push({
            sr: row[0] || "",
            itemName: row[1] || "",
            openingQty: parseNumber(row[latestDateCol]),
            openingAmount: parseNumber(row[latestDateCol + 1]),
            purchaseQty: parseNumber(row[latestDateCol + 2]),
            purchaseAmount: parseNumber(row[latestDateCol + 3]),
          });
        }
        setData(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { data, latestDate, loading, error };
}

export interface GeneratorRow {
  sr: string;
  shopName: string;
  generatorType: string;
  tankCapacity: number;
  remaining: number;
  refill: number;
  used: number;
}

export function useGeneratorData() {
  const [data, setData] = useState<GeneratorRow[]>([]);
  const [latestDate, setLatestDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const rows = await fetchSheetValues("Generator!A1:AZ60");
        if (!rows || rows.length < 3) return;

        const header0 = rows[0];
        let latestDateCol = 4;
        for (let c = 4; c < header0.length; c += 3) {
          if (header0[c]) {
            let hasData = false;
            for (let r = 2; r < rows.length; r++) {
              if (rows[r][c] && parseNumber(rows[r][c]) > 0) { hasData = true; break; }
            }
            if (hasData) { latestDateCol = c; }
          }
        }
        setLatestDate(header0[latestDateCol] || "");

        const result: GeneratorRow[] = [];
        for (let r = 2; r < rows.length; r++) {
          const row = rows[r];
          if (!row[0] || row[0] === "TOTAL") continue;
          const remaining = parseNumber(row[latestDateCol]);
          const capacity = parseNumber(row[3]);
          const refill = parseNumber(row[latestDateCol + 1]);
          result.push({
            sr: row[0] || "",
            shopName: row[1] || "",
            generatorType: row[2] || "",
            tankCapacity: capacity,
            remaining,
            refill,
            used: capacity > 0 ? capacity - remaining : 0,
          });
        }
        setData(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { data, latestDate, loading, error };
}

export interface ServiceRequestRow {
  sr: string;
  department: string;
  reqForm: number;
  finish: number;
  ongoing: number;
}

export function useServiceRequestData(sheetName: string) {
  const [data, setData] = useState<ServiceRequestRow[]>([]);
  const [latestDate, setLatestDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const rows = await fetchSheetValues(`${sheetName}!A1:AZ60`);
        if (!rows || rows.length < 3) return;

        const header0 = rows[0];
        let latestDateCol = 2;
        for (let c = 2; c < header0.length; c += 3) {
          if (header0[c]) {
            let hasData = false;
            for (let r = 2; r < rows.length; r++) {
              if (rows[r][c] && parseNumber(rows[r][c]) > 0) { hasData = true; break; }
            }
            if (hasData) { latestDateCol = c; }
          }
        }
        setLatestDate(header0[latestDateCol] || "");

        const result: ServiceRequestRow[] = [];
        for (let r = 2; r < rows.length; r++) {
          const row = rows[r];
          if (!row[0] || !row[1]) continue;
          result.push({
            sr: row[0] || "",
            department: row[1] || "",
            reqForm: parseNumber(row[latestDateCol]),
            finish: parseNumber(row[latestDateCol + 1]),
            ongoing: parseNumber(row[latestDateCol + 2]),
          });
        }
        setData(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sheetName]);

  return { data, latestDate, loading, error };
}
