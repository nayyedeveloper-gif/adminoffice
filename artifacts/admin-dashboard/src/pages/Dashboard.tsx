import { useState } from "react";
import { useAttendanceData, useCanteenData, usePurchaseData } from "@/hooks/useSheetData";
import { formatCurrency, formatNumber } from "@/lib/googleSheets";
import DetailPanel from "@/components/DetailPanel";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend, PieChart, Pie,
} from "recharts";
import {
  Users, ShoppingCart, Utensils, RefreshCw, AlertCircle,
  Clock, Building2, Car, Warehouse, Zap, Camera, Monitor, Wrench,
  ChevronRight, CheckCircle, XCircle, Filter, TrendingUp,
} from "lucide-react";

const SECTION_COLORS: Record<string, string> = {
  "Office & Event": "#1e40af",
  "MDY": "#7c3aed",
  "Warehouse & Store": "#0891b2",
  "Canteen": "#d97706",
  "M & E": "#dc2626",
  "Vehicle": "#059669",
  "IT": "#be185d",
  "CCTV": "#65a30d",
  "General Purchase": "#ea580c",
};

const PIE_COLORS = ["#1e40af", "#7c3aed", "#0891b2", "#d97706", "#dc2626", "#059669", "#be185d", "#65a30d", "#ea580c"];

const DEPT_MODULES = [
  { key: "Vehicle", label: "Vehicle", icon: Car, color: "#059669", bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-700" },
  { key: "Warehouse", label: "Warehouse", icon: Warehouse, color: "#7c3aed", bg: "bg-violet-50", border: "border-violet-100", text: "text-violet-700" },
  { key: "Generator", label: "Generator", icon: Zap, color: "#d97706", bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-700" },
  { key: "CCTV", label: "CCTV", icon: Camera, color: "#059669", bg: "bg-teal-50", border: "border-teal-100", text: "text-teal-700" },
  { key: "IT", label: "IT", icon: Monitor, color: "#1e40af", bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-700" },
  { key: "M & E", label: "M & E", icon: Wrench, color: "#dc2626", bg: "bg-red-50", border: "border-red-100", text: "text-red-700" },
];

function KpiCard({
  title, value, subtitle, icon: Icon, color, loading,
}: {
  title: string; value: string; subtitle?: string;
  icon: React.ElementType; color: string; loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest truncate">{title}</p>
          {loading ? (
            <div className="h-7 w-20 bg-slate-100 rounded animate-pulse mt-2" />
          ) : (
            <p className="text-[1.6rem] font-bold text-slate-800 mt-1 leading-none">{value}</p>
          )}
          {subtitle && !loading && (
            <p className="text-xs text-slate-400 mt-1.5 truncate">{subtitle}</p>
          )}
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function SectionBadge({ rate }: { rate: number }) {
  if (rate >= 90) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle size={10} />Excellent</span>;
  if (rate >= 75) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"><CheckCircle size={10} />Good</span>;
  if (rate >= 50) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">Fair</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200"><XCircle size={10} />Low</span>;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <RefreshCw size={20} className="animate-spin text-blue-600" />
      <span className="ml-2 text-slate-400 text-sm">Loading from Google Sheets...</span>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
      <AlertCircle size={15} />
      <span>{message}</span>
    </div>
  );
}

function DateTag({ date }: { date: string }) {
  if (!date) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-100 rounded-full px-2.5 py-1 font-medium">
      <Clock size={11} />
      {date}
    </span>
  );
}

const CustomTooltip = ({
  active, payload, label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 min-w-[140px]">
      <p className="text-xs font-semibold text-slate-600 mb-2 pb-1.5 border-b border-slate-100">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 mt-1">
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
          <span className="text-xs font-semibold text-slate-700">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

const CurrencyTooltip = ({
  active, payload, label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 min-w-[180px]">
      <p className="text-xs font-semibold text-slate-600 mb-2 pb-1.5 border-b border-slate-100">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 mt-1">
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
          <span className="text-xs font-semibold text-slate-700">{formatCurrency(p.value)} Ks</span>
        </div>
      ))}
    </div>
  );
};

type Tab = "attendance" | "canteen" | "purchase";

export default function Dashboard() {
  const attendance = useAttendanceData();
  const canteen = useCanteenData();
  const purchase = usePurchaseData();

  const [activeTab, setActiveTab] = useState<Tab>("attendance");
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [sectionFilter, setSectionFilter] = useState<string>("all");

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const totalPresent = attendance.data.reduce((s, r) => s + r.latestPresent, 0);
  const totalStaff = attendance.data.reduce((s, r) => s + r.latestTotal, 0);
  const totalAbsent = attendance.data.reduce((s, r) => s + r.latestAbsent, 0);
  const overallRate = totalStaff > 0 ? (totalPresent / totalStaff) * 100 : 0;
  const totalCanteenSale = canteen.data.reduce((s, r) => s + r.sale, 0);
  const totalCanteenClosing = canteen.data.reduce((s, r) => s + r.closing, 0);
  const totalOngoing = purchase.data.reduce((s, r) => s + r.ongoing, 0);
  const totalFinish = purchase.data.reduce((s, r) => s + r.finish, 0);

  const filteredAttendance = sectionFilter === "all"
    ? attendance.data
    : attendance.data.filter(d => d.section === sectionFilter);

  const pieData = attendance.data
    .filter(d => d.latestPresent > 0)
    .map(d => ({ name: d.section, value: d.latestPresent }));

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "attendance", label: "Attendance", icon: Users },
    { id: "canteen", label: "Canteen", icon: Utensils },
    { id: "purchase", label: "Purchase", icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Detail Panel */}
      {selectedDept && (
        <DetailPanel dept={selectedDept} onClose={() => setSelectedDept(null)} />
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-[1200px] mx-auto px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Building2 size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-800 leading-tight">Admin Department Dashboard</h1>
                <p className="text-xs text-blue-600 font-medium">Chairman Overview</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock size={12} />
              <span className="hidden sm:inline">{today}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-5 py-5 space-y-4">

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard title="Total Staff" value={String(totalStaff)} subtitle="Across all sections" icon={Users} color="#1e40af" loading={attendance.loading} />
          <KpiCard
            title="Attendance Rate"
            value={attendance.loading ? "—" : `${overallRate.toFixed(1)}%`}
            subtitle={`${totalPresent} present · ${totalAbsent} absent`}
            icon={TrendingUp}
            color={overallRate >= 90 ? "#059669" : overallRate >= 75 ? "#d97706" : "#dc2626"}
            loading={attendance.loading}
          />
          <KpiCard title="Canteen Sales" value={canteen.loading ? "—" : `${formatNumber(totalCanteenSale)} Ks`} subtitle={`Closing: ${formatNumber(totalCanteenClosing)} Ks`} icon={Utensils} color="#d97706" loading={canteen.loading} />
          <KpiCard title="Pending Purchases" value={purchase.loading ? "—" : String(totalOngoing)} subtitle={`${totalFinish} completed`} icon={ShoppingCart} color="#7c3aed" loading={purchase.loading} />
        </div>

        {/* Alert */}
        {!attendance.loading && totalAbsent > 0 && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle size={15} className="text-amber-600 flex-shrink-0" />
            <span className="text-sm text-amber-800">
              <strong>{totalAbsent}</strong> staff absent today
              {attendance.latestDate && <span className="text-amber-500 ml-1.5 font-normal">({attendance.latestDate})</span>}
            </span>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wide transition-all relative ${
                    activeTab === tab.id
                      ? "text-blue-600 bg-white"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-5">
            {/* ── ATTENDANCE TAB ── */}
            {activeTab === "attendance" && (
              <div className="space-y-5">
                {/* Filter row */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    <Users size={13} />
                    Department Attendance
                  </div>
                  <div className="flex items-center gap-2">
                    <DateTag date={attendance.latestDate} />
                    <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5">
                      <Filter size={12} className="text-slate-400" />
                      <select
                        value={sectionFilter}
                        onChange={e => setSectionFilter(e.target.value)}
                        className="text-xs text-slate-600 bg-transparent border-0 outline-none cursor-pointer font-medium"
                      >
                        <option value="all">All Sections</option>
                        {attendance.data.map(d => (
                          <option key={d.section} value={d.section}>{d.section}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {attendance.loading && <LoadingSpinner />}
                {attendance.error && <ErrorBox message={attendance.error} />}

                {!attendance.loading && !attendance.error && attendance.data.length > 0 && (
                  <>
                    {/* Charts row */}
                    <div className="grid lg:grid-cols-[3fr_2fr] gap-4">
                      {/* Bar chart */}
                      <div>
                        <p className="text-xs text-slate-400 font-medium mb-3">Staff count by section</p>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={filteredAttendance}
                              margin={{ top: 4, right: 4, left: -18, bottom: 60 }}
                              barCategoryGap="25%"
                              barGap={2}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                              <XAxis
                                dataKey="section"
                                tick={{ fontSize: 10, fill: "#94a3b8" }}
                                angle={-35}
                                textAnchor="end"
                                interval={0}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                tick={{ fontSize: 10, fill: "#94a3b8" }}
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                              />
                              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                              <Legend
                                wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }}
                                iconType="circle"
                                iconSize={8}
                              />
                              <Bar dataKey="latestTotal" name="Total" fill="#cbd5e1" radius={[3, 3, 0, 0]} maxBarSize={24} />
                              <Bar dataKey="latestPresent" name="Present" fill="#1e40af" radius={[3, 3, 0, 0]} maxBarSize={24}>
                                {filteredAttendance.map((entry, i) => (
                                  <Cell key={i} fill={SECTION_COLORS[entry.section] || "#1e40af"} />
                                ))}
                              </Bar>
                              <Bar dataKey="latestAbsent" name="Absent" fill="#fca5a5" radius={[3, 3, 0, 0]} maxBarSize={24} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Pie chart */}
                      <div>
                        <p className="text-xs text-slate-400 font-medium mb-3">Present staff distribution</p>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="45%"
                                innerRadius={48}
                                outerRadius={72}
                                paddingAngle={2}
                                dataKey="value"
                                strokeWidth={0}
                              >
                                {pieData.map((entry, i) => (
                                  <Cell key={i} fill={SECTION_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                                formatter={(val) => [`${val} staff`, ""]}
                              />
                              <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "4px" }} iconType="circle" iconSize={7} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-xl border border-slate-100 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Section</th>
                            <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
                            <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Present</th>
                            <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Absent</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rate</th>
                            <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredAttendance.map((row, i) => (
                            <tr
                              key={i}
                              className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                              title={`Click to filter by ${row.section}`}
                              onClick={() => setSectionFilter(sectionFilter === row.section ? "all" : row.section)}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: SECTION_COLORS[row.section] || "#94a3b8" }}
                                  />
                                  <span className="font-medium text-slate-800">{row.section}</span>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-center text-slate-500 tabular-nums">{row.latestTotal}</td>
                              <td className="px-3 py-3 text-center font-semibold text-emerald-600 tabular-nums">{row.latestPresent}</td>
                              <td className="px-3 py-3 text-center font-semibold tabular-nums">
                                <span className={row.latestAbsent > 0 ? "text-red-500" : "text-slate-300"}>
                                  {row.latestAbsent > 0 ? row.latestAbsent : "—"}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2 min-w-[100px]">
                                  <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                                    <div
                                      className="h-1.5 rounded-full transition-all"
                                      style={{
                                        width: `${Math.min(row.attendanceRate, 100)}%`,
                                        backgroundColor: SECTION_COLORS[row.section] || "#1e40af",
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs text-slate-500 w-9 text-right tabular-nums">
                                    {row.attendanceRate.toFixed(0)}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <SectionBadge rate={row.attendanceRate} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-slate-200 bg-slate-50">
                            <td className="px-4 py-2.5 text-xs font-bold text-slate-700 uppercase tracking-wide">Total</td>
                            <td className="px-3 py-2.5 text-center font-bold text-slate-700 tabular-nums">{totalStaff}</td>
                            <td className="px-3 py-2.5 text-center font-bold text-emerald-700 tabular-nums">{totalPresent}</td>
                            <td className="px-3 py-2.5 text-center font-bold tabular-nums">
                              <span className={totalAbsent > 0 ? "text-red-600" : "text-slate-300"}>
                                {totalAbsent > 0 ? totalAbsent : "—"}
                              </span>
                            </td>
                            <td className="px-3 py-2.5" colSpan={2}>
                              <span className="text-xs font-bold text-blue-700">{overallRate.toFixed(1)}% overall</span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── CANTEEN TAB ── */}
            {activeTab === "canteen" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    <Utensils size={13} />
                    Canteen Financial Overview
                  </div>
                  <DateTag date={canteen.latestDate} />
                </div>

                {canteen.loading && <LoadingSpinner />}
                {canteen.error && <ErrorBox message={canteen.error} />}

                {!canteen.loading && canteen.data.length > 0 && (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Opening", val: canteen.data.reduce((s, r) => s + r.opening, 0), color: "text-slate-700", bg: "bg-slate-50 border-slate-200" },
                        { label: "Purchase", val: canteen.data.reduce((s, r) => s + r.purchase, 0), color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
                        { label: "Sales", val: totalCanteenSale, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
                        { label: "Closing", val: totalCanteenClosing, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
                      ].map(item => (
                        <div key={item.label} className={`rounded-xl p-3.5 border ${item.bg}`}>
                          <p className="text-xs font-medium text-slate-500">{item.label}</p>
                          <p className={`text-lg font-bold mt-1 ${item.color}`}>{formatCurrency(item.val)} <span className="text-sm font-normal">Ks</span></p>
                        </div>
                      ))}
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 font-medium mb-3">Opening / Purchase / Sale / Closing by shop</p>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={canteen.data}
                            margin={{ top: 4, right: 4, left: -10, bottom: 60 }}
                            barCategoryGap="25%"
                            barGap={2}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis
                              dataKey="shop"
                              tick={{ fontSize: 10, fill: "#94a3b8" }}
                              angle={-30}
                              textAnchor="end"
                              interval={0}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fontSize: 10, fill: "#94a3b8" }}
                              tickFormatter={v => formatNumber(v)}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip content={<CurrencyTooltip />} cursor={{ fill: "#f8fafc" }} />
                            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} iconType="circle" iconSize={8} />
                            <Bar dataKey="opening" name="Opening" fill="#cbd5e1" radius={[3, 3, 0, 0]} maxBarSize={18} />
                            <Bar dataKey="purchase" name="Purchase" fill="#fbbf24" radius={[3, 3, 0, 0]} maxBarSize={18} />
                            <Bar dataKey="sale" name="Sale" fill="#059669" radius={[3, 3, 0, 0]} maxBarSize={18} />
                            <Bar dataKey="closing" name="Closing" fill="#1e40af" radius={[3, 3, 0, 0]} maxBarSize={18} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-100 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Shop</th>
                            <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Opening</th>
                            <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Purchase</th>
                            <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sale</th>
                            <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Closing</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {canteen.data.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-medium text-slate-800">{row.shop}</td>
                              <td className="px-4 py-3 text-right text-slate-500 tabular-nums">{formatCurrency(row.opening)}</td>
                              <td className="px-4 py-3 text-right text-amber-600 tabular-nums">{row.purchase > 0 ? formatCurrency(row.purchase) : "—"}</td>
                              <td className="px-4 py-3 text-right font-semibold text-emerald-600 tabular-nums">{formatCurrency(row.sale)}</td>
                              <td className="px-4 py-3 text-right font-semibold text-blue-600 tabular-nums">{formatCurrency(row.closing)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-slate-200 bg-slate-50">
                            <td className="px-4 py-2.5 text-xs font-bold text-slate-700 uppercase tracking-wide">Total</td>
                            <td className="px-4 py-2.5 text-right font-bold text-slate-600 tabular-nums">{formatCurrency(canteen.data.reduce((s, r) => s + r.opening, 0))}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-amber-700 tabular-nums">{formatCurrency(canteen.data.reduce((s, r) => s + r.purchase, 0))}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-emerald-700 tabular-nums">{formatCurrency(totalCanteenSale)}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-blue-700 tabular-nums">{formatCurrency(totalCanteenClosing)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── PURCHASE TAB ── */}
            {activeTab === "purchase" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    <ShoppingCart size={13} />
                    General Purchase Tracker
                  </div>
                  <DateTag date={purchase.latestDate} />
                </div>

                {purchase.loading && <LoadingSpinner />}
                {purchase.error && <ErrorBox message={purchase.error} />}

                {!purchase.loading && purchase.data.length > 0 && (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                        <p className="text-xs text-slate-500 font-medium">Total Requests</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{purchase.data.reduce((s, r) => s + r.qty, 0)}</p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-200">
                        <p className="text-xs text-emerald-600 font-medium">Completed</p>
                        <p className="text-2xl font-bold text-emerald-700 mt-1">{totalFinish}</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-200">
                        <p className="text-xs text-amber-600 font-medium">Ongoing</p>
                        <p className="text-2xl font-bold text-amber-700 mt-1">{totalOngoing}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 font-medium mb-3">Requests by category</p>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={purchase.data} margin={{ top: 4, right: 4, left: -20, bottom: 50 }} barGap={2}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="description" tick={{ fontSize: 10, fill: "#94a3b8" }} angle={-25} textAnchor="end" interval={0} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }} iconType="circle" iconSize={8} />
                            <Bar dataKey="qty" name="Total" fill="#cbd5e1" radius={[3, 3, 0, 0]} maxBarSize={22} />
                            <Bar dataKey="finish" name="Finished" fill="#059669" radius={[3, 3, 0, 0]} maxBarSize={22} />
                            <Bar dataKey="ongoing" name="Ongoing" fill="#fbbf24" radius={[3, 3, 0, 0]} maxBarSize={22} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-100 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
                            <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Qty</th>
                            <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Finished</th>
                            <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ongoing</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Progress</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {purchase.data.map((row, i) => {
                            const pct = row.qty > 0 ? (row.finish / row.qty) * 100 : 0;
                            return (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium text-slate-800">{row.description}</td>
                                <td className="px-3 py-3 text-center text-slate-500 tabular-nums">{row.qty}</td>
                                <td className="px-3 py-3 text-center font-semibold text-emerald-600 tabular-nums">{row.finish}</td>
                                <td className="px-3 py-3 text-center font-semibold text-amber-600 tabular-nums">{row.ongoing}</td>
                                <td className="px-3 py-3">
                                  <div className="flex items-center gap-2 min-w-[90px]">
                                    <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                                      <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${Math.min(pct, 100)}%` }} />
                                    </div>
                                    <span className="text-xs text-slate-400 w-9 text-right tabular-nums">{pct.toFixed(0)}%</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Department Modules */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Department Details</p>
            <span className="text-xs text-slate-400">— Click to view</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {DEPT_MODULES.map(dept => {
              const Icon = dept.icon;
              return (
                <button
                  key={dept.key}
                  onClick={() => setSelectedDept(dept.key)}
                  className={`group bg-white rounded-xl p-4 border ${dept.border} shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 text-left`}
                >
                  <div className={`w-8 h-8 rounded-lg ${dept.bg} ${dept.border} border flex items-center justify-center mb-3`}>
                    <Icon size={16} style={{ color: dept.color }} />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{dept.label}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="text-xs text-slate-400">View details</span>
                    <ChevronRight size={11} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs text-slate-300 pb-1">
          Data sourced from Google Sheets · Refreshes on page load
        </p>
      </div>
    </div>
  );
}
