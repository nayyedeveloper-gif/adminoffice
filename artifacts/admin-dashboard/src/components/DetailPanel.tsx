import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useVehicleData, useWarehouseData, useGeneratorData, useServiceRequestData } from "@/hooks/useDepartmentData";
import { formatCurrency } from "@/lib/googleSheets";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

interface Props {
  dept: string;
  selectedDate?: string;
  onClose: () => void;
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        <div className="h-px bg-slate-100 mt-2" />
      </div>
      {children}
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-9 bg-slate-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className={`px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 ${right ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}

function Td({ children, right, muted, accent }: { children: React.ReactNode; right?: boolean; muted?: boolean; accent?: string }) {
  return (
    <td className={`px-3 py-2.5 text-sm ${right ? "text-right tabular-nums" : ""} ${muted ? "text-slate-400" : "text-slate-700"} ${accent || ""}`}>
      {children}
    </td>
  );
}

function FuelBar({ remaining, capacity, color }: { remaining: number; capacity: number; color?: string }) {
  const pct = capacity > 0 ? Math.min((remaining / capacity) * 100, 100) : 0;
  const fill = color || (pct > 50 ? "#059669" : pct > 25 ? "#d97706" : "#dc2626");
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 rounded-full h-1.5">
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: fill }} />
      </div>
      <span className="text-xs text-slate-400 w-8 text-right tabular-nums">{pct.toFixed(0)}%</span>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={`rounded-xl p-3.5 border`} style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}>
      <p className="text-xs font-medium" style={{ color }}>{label}</p>
      <p className="text-xl font-bold mt-0.5" style={{ color }}>{value}</p>
      {sub && <p className="text-xs mt-0.5 opacity-70" style={{ color }}>{sub}</p>}
    </div>
  );
}

function VehicleDetail({ selectedDate }: { selectedDate?: string }) {
  const { data, availableDates, currentDate, loading } = useVehicleData(selectedDate);

  const totalRemaining = data.reduce((s, r) => s + r.remaining, 0);
  const totalRefill = data.reduce((s, r) => s + r.refill, 0);
  const totalCapacity = data.reduce((s, r) => s + r.tankCapacity, 0);
  const overallPct = totalCapacity > 0 ? ((totalRemaining / totalCapacity) * 100).toFixed(0) : "0";

  return (
    <Panel
      title="Vehicle Fuel Tracker"
      subtitle={currentDate ? `Data as of ${currentDate} · ${availableDates.length} days recorded` : ""}
    >
      {loading ? <LoadingRows /> : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Remaining" value={`${totalRemaining.toFixed(0)} L`} sub={`${overallPct}% of capacity`} color="#059669" />
            <StatCard label="Total Refill" value={`${totalRefill.toFixed(0)} L`} sub="Today" color="#0891b2" />
            <StatCard label="Vehicles" value={String(data.length)} sub="Tracked" color="#7c3aed" />
          </div>

          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Plate No.</Th>
                  <Th>Vehicle</Th>
                  <Th>Fuel</Th>
                  <Th right>Remaining</Th>
                  <Th right>Refill</Th>
                  <Th>Level</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <Td><span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{row.plateNo}</span></Td>
                    <Td>{row.name}</Td>
                    <Td muted>{row.fuelType}</Td>
                    <Td right>{row.remaining.toFixed(1)} L</Td>
                    <Td right>{row.refill > 0 ? <span className="text-blue-600 font-medium">+{row.refill.toFixed(1)} L</span> : <span className="text-slate-300">—</span>}</Td>
                    <td className="px-3 py-2.5 w-32">
                      <FuelBar remaining={row.remaining} capacity={row.tankCapacity} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.length > 0 && (
            <>
              <p className="text-xs text-slate-400 font-medium">Fuel level by vehicle</p>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} angle={-30} textAnchor="end" interval={0} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} unit=" L" axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(val, name) => [`${Number(val).toFixed(1)} L`, name]}
                      contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                    />
                    <Bar dataKey="remaining" name="Remaining" radius={[3, 3, 0, 0]} maxBarSize={28}>
                      {data.map((entry, i) => {
                        const pct = entry.tankCapacity > 0 ? (entry.remaining / entry.tankCapacity) * 100 : 0;
                        return <Cell key={i} fill={pct > 50 ? "#059669" : pct > 25 ? "#d97706" : "#dc2626"} />;
                      })}
                    </Bar>
                    <Bar dataKey="refill" name="Refill" fill="#93c5fd" radius={[3, 3, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </>
      )}
    </Panel>
  );
}

function WarehouseDetail({ selectedDate }: { selectedDate?: string }) {
  const { data, availableDates, currentDate, loading } = useWarehouseData(selectedDate);
  const totalAmount = data.reduce((s, r) => s + r.openingAmount, 0);
  const totalPurchaseAmount = data.reduce((s, r) => s + r.purchaseAmount, 0);

  return (
    <Panel
      title="Warehouse Stock"
      subtitle={currentDate ? `Data as of ${currentDate} · ${availableDates.length} days recorded` : ""}
    >
      {loading ? <LoadingRows /> : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Opening Stock Value" value={`${formatCurrency(totalAmount)} Ks`} sub={`${data.length} categories`} color="#7c3aed" />
            <StatCard label="Today Purchase Value" value={`${formatCurrency(totalPurchaseAmount)} Ks`} sub="Received today" color="#0891b2" />
          </div>
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Item Category</Th>
                  <Th right>Opening Qty</Th>
                  <Th right>Opening Amt (Ks)</Th>
                  <Th right>Purchase Qty</Th>
                  <Th right>Purchase Amt (Ks)</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <Td>{row.itemName}</Td>
                    <Td right>{row.openingQty > 0 ? row.openingQty.toLocaleString() : <span className="text-slate-300">—</span>}</Td>
                    <Td right accent="font-medium text-violet-700">{row.openingAmount > 0 ? formatCurrency(row.openingAmount) : <span className="text-slate-300">—</span>}</Td>
                    <Td right>{row.purchaseQty > 0 ? row.purchaseQty.toLocaleString() : <span className="text-slate-300">—</span>}</Td>
                    <Td right accent="text-blue-600">{row.purchaseAmount > 0 ? formatCurrency(row.purchaseAmount) : <span className="text-slate-300">—</span>}</Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td className="px-3 py-2.5 text-xs font-bold text-slate-600 uppercase">Total</td>
                  <td colSpan={1} />
                  <td className="px-3 py-2.5 text-right font-bold text-violet-700 text-sm tabular-nums">{formatCurrency(totalAmount)}</td>
                  <td />
                  <td className="px-3 py-2.5 text-right font-bold text-blue-600 text-sm tabular-nums">{formatCurrency(totalPurchaseAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </Panel>
  );
}

function GeneratorDetail({ selectedDate }: { selectedDate?: string }) {
  const { data, availableDates, currentDate, loading } = useGeneratorData(selectedDate);
  const totalRemaining = data.reduce((s, r) => s + r.remaining, 0);
  const totalRefill = data.reduce((s, r) => s + r.refill, 0);
  const totalCapacity = data.reduce((s, r) => s + r.tankCapacity, 0);
  const overallPct = totalCapacity > 0 ? ((totalRemaining / totalCapacity) * 100).toFixed(0) : "0";

  return (
    <Panel
      title="Generator Fuel"
      subtitle={currentDate ? `Data as of ${currentDate} · ${availableDates.length} days recorded` : ""}
    >
      {loading ? <LoadingRows /> : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Remaining" value={`${totalRemaining.toFixed(0)} L`} sub={`${overallPct}% avg level`} color="#d97706" />
            <StatCard label="Refilled" value={`${totalRefill.toFixed(0)} L`} sub="Today total" color="#0891b2" />
            <StatCard label="Generators" value={String(data.length)} sub="Active" color="#059669" />
          </div>
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Shop</Th>
                  <Th>Type</Th>
                  <Th right>Capacity</Th>
                  <Th right>Remaining</Th>
                  <Th right>Refill</Th>
                  <Th>Level</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <Td>{row.shopName}</Td>
                    <Td muted>{row.generatorType}</Td>
                    <Td right muted>{row.tankCapacity > 0 ? `${row.tankCapacity} L` : "—"}</Td>
                    <Td right>{row.remaining.toFixed(1)} L</Td>
                    <Td right>{row.refill > 0 ? <span className="text-blue-600 font-medium">+{row.refill.toFixed(1)} L</span> : <span className="text-slate-300">—</span>}</Td>
                    <td className="px-3 py-2.5 w-28">
                      <FuelBar remaining={row.remaining} capacity={row.tankCapacity} color="#d97706" />
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

function ServiceDetail({ sheetName, title, selectedDate }: { sheetName: string; title: string; selectedDate?: string }) {
  const { data, availableDates, currentDate, loading } = useServiceRequestData(sheetName, selectedDate);
  const totalReq = data.reduce((s, r) => s + r.reqForm, 0);
  const totalFinish = data.reduce((s, r) => s + r.finish, 0);
  const totalOngoing = data.reduce((s, r) => s + r.ongoing, 0);
  const completionRate = totalReq > 0 ? ((totalFinish / totalReq) * 100).toFixed(0) : "0";

  return (
    <Panel
      title={`${title} Service Requests`}
      subtitle={currentDate ? `Data as of ${currentDate} · ${availableDates.length} days recorded` : ""}
    >
      {loading ? <LoadingRows /> : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Total Requests" value={String(totalReq)} sub="Submitted" color="#64748b" />
            <StatCard label="Finished" value={String(totalFinish)} sub={`${completionRate}% completion`} color="#059669" />
            <StatCard label="Ongoing" value={String(totalOngoing)} sub="In progress" color="#d97706" />
          </div>
          {data.some(d => d.reqForm > 0 || d.finish > 0 || d.ongoing > 0) ? (
            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr>
                    <Th>Department</Th>
                    <Th right>Requests</Th>
                    <Th right>Finished</Th>
                    <Th right>Ongoing</Th>
                    <Th>Completion</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.map((row, i) => {
                    const pct = row.reqForm > 0 ? (row.finish / row.reqForm) * 100 : 0;
                    const hasData = row.reqForm > 0 || row.finish > 0 || row.ongoing > 0;
                    return (
                      <tr key={i} className={`hover:bg-slate-50 ${!hasData ? "opacity-40" : ""}`}>
                        <Td>{row.department}</Td>
                        <Td right>{row.reqForm || <span className="text-slate-300">—</span>}</Td>
                        <Td right accent="font-medium text-emerald-600">{row.finish || <span className="text-slate-300">—</span>}</Td>
                        <Td right accent="font-medium text-amber-600">{row.ongoing || <span className="text-slate-300">—</span>}</Td>
                        <td className="px-3 py-2.5 w-32">
                          {row.reqForm > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                                <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${Math.min(pct, 100)}%` }} />
                              </div>
                              <span className="text-xs text-slate-400 w-8 text-right tabular-nums">{pct.toFixed(0)}%</span>
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
            <div className="text-center py-10 text-slate-400 text-sm">
              No request data for this period
            </div>
          )}
        </>
      )}
    </Panel>
  );
}

export default function DetailPanel({ dept, selectedDate, onClose }: Props) {
  const configs: Record<string, { label: string; component: React.FC<{ selectedDate?: string }> }> = {
    Vehicle: { label: "Vehicle", component: ({ selectedDate }) => <VehicleDetail selectedDate={selectedDate} /> },
    Warehouse: { label: "Warehouse", component: ({ selectedDate }) => <WarehouseDetail selectedDate={selectedDate} /> },
    Generator: { label: "Generator", component: ({ selectedDate }) => <GeneratorDetail selectedDate={selectedDate} /> },
    CCTV: { label: "CCTV", component: ({ selectedDate }) => <ServiceDetail sheetName="CCTV" title="CCTV" selectedDate={selectedDate} /> },
    IT: { label: "IT", component: ({ selectedDate }) => <ServiceDetail sheetName="IT" title="IT" selectedDate={selectedDate} /> },
    "M & E": { label: "M & E", component: ({ selectedDate }) => <ServiceDetail sheetName="M & E" title="M & E" selectedDate={selectedDate} /> },
  };

  const config = configs[dept];
  const Content = config?.component;

  return (
    <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
      <div className="flex-1 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
          <div>
            <h2 className="text-base font-bold text-slate-800">{config?.label} Department</h2>
            <p className="text-xs text-slate-400 mt-0.5">Detailed operational data</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {Content ? <Content selectedDate={selectedDate} /> : (
            <p className="text-slate-400 text-sm">No detail view available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
