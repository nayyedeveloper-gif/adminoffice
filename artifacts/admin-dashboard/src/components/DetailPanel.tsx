import { X } from "lucide-react";
import { useVehicleData, useWarehouseData, useGeneratorData, useServiceRequestData } from "@/hooks/useDepartmentData";
import { formatCurrency } from "@/lib/googleSheets";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

interface Props {
  dept: string;
  onClose: () => void;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-9 bg-slate-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50">
      {children}
    </th>
  );
}
function Td({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <td className={`px-3 py-2.5 text-sm text-slate-700 ${right ? "text-right tabular-nums" : ""}`}>
      {children}
    </td>
  );
}

function FuelBar({ remaining, capacity }: { remaining: number; capacity: number }) {
  const pct = capacity > 0 ? Math.min((remaining / capacity) * 100, 100) : 0;
  const color = pct > 50 ? "#059669" : pct > 25 ? "#d97706" : "#dc2626";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs text-slate-500 w-8 text-right">{pct.toFixed(0)}%</span>
    </div>
  );
}

function VehicleDetail() {
  const { data, latestDate, loading } = useVehicleData();
  const totalRemaining = data.reduce((s, r) => s + r.remaining, 0);
  const totalRefill = data.reduce((s, r) => s + r.refill, 0);

  return (
    <Panel title={`Vehicle Fuel Tracker${latestDate ? ` — ${latestDate}` : ""}`}>
      {loading ? <LoadingRows /> : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <p className="text-xs text-emerald-600 font-medium">Total Remaining</p>
              <p className="text-xl font-bold text-emerald-700 mt-0.5">{totalRemaining.toFixed(1)} L</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <p className="text-xs text-amber-600 font-medium">Total Refilled</p>
              <p className="text-xl font-bold text-amber-700 mt-0.5">{totalRefill.toFixed(1)} L</p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Plate No.</Th>
                  <Th>Vehicle</Th>
                  <Th>Fuel</Th>
                  <Th>Remaining</Th>
                  <Th>Tank Level</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <Td><span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{row.plateNo}</span></Td>
                    <Td>{row.name}</Td>
                    <Td>{row.fuelType}</Td>
                    <Td right>{row.remaining.toFixed(1)} L</Td>
                    <td className="px-3 py-2.5 w-32">
                      <FuelBar remaining={row.remaining} capacity={row.tankCapacity} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.length > 0 && (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} angle={-30} textAnchor="end" interval={0} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} unit=" L" />
                  <Tooltip
                    formatter={(val, name) => [`${Number(val).toFixed(1)} L`, name]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  />
                  <Bar dataKey="remaining" name="Remaining" radius={[3, 3, 0, 0]}>
                    {data.map((entry, i) => {
                      const pct = entry.tankCapacity > 0 ? (entry.remaining / entry.tankCapacity) * 100 : 0;
                      return <Cell key={i} fill={pct > 50 ? "#059669" : pct > 25 ? "#d97706" : "#dc2626"} />;
                    })}
                  </Bar>
                  <Bar dataKey="refill" name="Refill" fill="#93c5fd" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}

function WarehouseDetail() {
  const { data, latestDate, loading } = useWarehouseData();
  const totalAmount = data.reduce((s, r) => s + r.openingAmount, 0);

  return (
    <Panel title={`Warehouse Stock${latestDate ? ` — ${latestDate}` : ""}`}>
      {loading ? <LoadingRows /> : (
        <>
          <div className="bg-violet-50 rounded-xl p-3 border border-violet-100">
            <p className="text-xs text-violet-600 font-medium">Total Stock Value (Opening)</p>
            <p className="text-xl font-bold text-violet-700 mt-0.5">{formatCurrency(totalAmount)} Ks</p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Item</Th>
                  <Th>Opening Qty</Th>
                  <Th>Amount (Ks)</Th>
                  <Th>Purchase Qty</Th>
                  <Th>Amount (Ks)</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <Td>{row.itemName}</Td>
                    <Td right>{row.openingQty.toLocaleString()}</Td>
                    <Td right>{formatCurrency(row.openingAmount)}</Td>
                    <Td right>{row.purchaseQty > 0 ? row.purchaseQty.toLocaleString() : "—"}</Td>
                    <Td right>{row.purchaseAmount > 0 ? formatCurrency(row.purchaseAmount) : "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Panel>
  );
}

function GeneratorDetail() {
  const { data, latestDate, loading } = useGeneratorData();
  const totalRemaining = data.reduce((s, r) => s + r.remaining, 0);
  const totalRefill = data.reduce((s, r) => s + r.refill, 0);

  return (
    <Panel title={`Generator Fuel${latestDate ? ` — ${latestDate}` : ""}`}>
      {loading ? <LoadingRows /> : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <p className="text-xs text-amber-600 font-medium">Total Remaining</p>
              <p className="text-xl font-bold text-amber-700 mt-0.5">{totalRemaining.toFixed(1)} L</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-xs text-blue-600 font-medium">Total Refill</p>
              <p className="text-xl font-bold text-blue-700 mt-0.5">{totalRefill.toFixed(1)} L</p>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Shop</Th>
                  <Th>Generator</Th>
                  <Th>Capacity</Th>
                  <Th>Remaining</Th>
                  <Th>Level</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <Td>{row.shopName}</Td>
                    <Td>{row.generatorType}</Td>
                    <Td right>{row.tankCapacity} L</Td>
                    <Td right>{row.remaining.toFixed(1)} L</Td>
                    <td className="px-3 py-2.5 w-28">
                      <FuelBar remaining={row.remaining} capacity={row.tankCapacity} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Panel>
  );
}

function ServiceDetail({ sheetName, title }: { sheetName: string; title: string }) {
  const { data, latestDate, loading } = useServiceRequestData(sheetName);
  const totalReq = data.reduce((s, r) => s + r.reqForm, 0);
  const totalFinish = data.reduce((s, r) => s + r.finish, 0);
  const totalOngoing = data.reduce((s, r) => s + r.ongoing, 0);

  return (
    <Panel title={`${title} Requests${latestDate ? ` — ${latestDate}` : ""}`}>
      {loading ? <LoadingRows /> : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <p className="text-xs text-slate-500 font-medium">Total Req</p>
              <p className="text-xl font-bold text-slate-700 mt-0.5">{totalReq}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <p className="text-xs text-emerald-600 font-medium">Finished</p>
              <p className="text-xl font-bold text-emerald-700 mt-0.5">{totalFinish}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <p className="text-xs text-amber-600 font-medium">Ongoing</p>
              <p className="text-xl font-bold text-amber-700 mt-0.5">{totalOngoing}</p>
            </div>
          </div>
          {data.some(d => d.reqForm > 0 || d.finish > 0) ? (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full">
                <thead>
                  <tr>
                    <Th>Department</Th>
                    <Th>Requests</Th>
                    <Th>Finished</Th>
                    <Th>Ongoing</Th>
                    <Th>Progress</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.map((row, i) => {
                    const pct = row.reqForm > 0 ? (row.finish / row.reqForm) * 100 : 0;
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <Td>{row.department}</Td>
                        <Td right>{row.reqForm || "—"}</Td>
                        <Td right><span className="text-emerald-600 font-medium">{row.finish || "—"}</span></Td>
                        <Td right><span className="text-amber-600 font-medium">{row.ongoing || "—"}</span></Td>
                        <td className="px-3 py-2.5 w-28">
                          {row.reqForm > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                                <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${Math.min(pct, 100)}%` }} />
                              </div>
                              <span className="text-xs text-slate-400 w-8 text-right">{pct.toFixed(0)}%</span>
                            </div>
                          ) : <span className="text-xs text-slate-300">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">No request data for this period</div>
          )}
        </>
      )}
    </Panel>
  );
}

const deptConfig: Record<string, { label: string; component: React.FC }> = {
  Vehicle: { label: "Vehicle", component: VehicleDetail },
  Warehouse: { label: "Warehouse", component: WarehouseDetail },
  Generator: { label: "Generator", component: GeneratorDetail },
  CCTV: { label: "CCTV", component: () => <ServiceDetail sheetName="CCTV" title="CCTV" /> },
  IT: { label: "IT", component: () => <ServiceDetail sheetName="IT" title="IT" /> },
  "M & E": { label: "M & E", component: () => <ServiceDetail sheetName="M & E" title="M & E" /> },
};

export default function DetailPanel({ dept, onClose }: Props) {
  const config = deptConfig[dept];
  const Content = config?.component;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-800">{config?.label} Department</h2>
            <p className="text-xs text-slate-500 mt-0.5">Detailed operational data</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {Content ? <Content /> : <p className="text-slate-500">No detail view available.</p>}
        </div>
      </div>
    </div>
  );
}
