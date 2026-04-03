import { useState, useMemo } from "react";
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
  ChevronRight, CheckCircle, XCircle, Filter, TrendingUp, TrendingDown,
  CalendarDays, ChevronLeft, ChevronRight as ChevRight, Minus,
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
  { key: "Vehicle", label: "Vehicle", icon: Car, color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
  { key: "Warehouse", label: "Warehouse", icon: Warehouse, color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  { key: "Generator", label: "Generator", icon: Zap, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  { key: "CCTV", label: "CCTV", icon: Camera, color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  { key: "IT", label: "IT", icon: Monitor, color: "#1e40af", bg: "#eff6ff", border: "#bfdbfe" },
  { key: "M & E", label: "M & E", icon: Wrench, color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
];

type Tab = "attendance" | "canteen" | "purchase";

function Delta({ current, prev, unit = "", invert = false }: { current: number; prev: number; unit?: string; invert?: boolean }) {
  if (prev === 0 && current === 0) return null;
  const diff = current - prev;
  if (diff === 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs text-slate-400">
      <Minus size={10} />same
    </span>
  );
  const positive = invert ? diff < 0 : diff > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${positive ? "text-emerald-600" : "text-red-500"}`}>
      {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {diff > 0 ? "+" : ""}{diff.toFixed(0)}{unit}
    </span>
  );
}

function KpiCard({
  title, value, subtitle, icon: Icon, color, loading, delta,
}: {
  title: string; value: string; subtitle?: string;
  icon: React.ElementType; color: string; loading?: boolean; delta?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest truncate">{title}</p>
          {loading ? (
            <div className="h-7 w-20 bg-slate-100 rounded animate-pulse mt-2" />
          ) : (
            <p className="text-[1.55rem] font-bold text-slate-800 mt-1 leading-none">{value}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {subtitle && !loading && <p className="text-xs text-slate-400">{subtitle}</p>}
            {delta && !loading && delta}
          </div>
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
          <Icon size={17} style={{ color }} />
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
    <div className="flex items-center justify-center py-14">
      <RefreshCw size={18} className="animate-spin text-blue-500" />
      <span className="ml-2 text-slate-400 text-sm">Loading from Google Sheets…</span>
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

const ChartTooltip = ({
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
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
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
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}
          </span>
          <span className="text-xs font-semibold text-slate-700">{formatCurrency(p.value)} Ks</span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("attendance");
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  const attendance = useAttendanceData(selectedDate);
  const canteen = useCanteenData(selectedDate);
  const purchase = usePurchaseData(selectedDate);

  const allAvailableDates = attendance.availableDates;
  const effectiveDate = attendance.currentDate;
  const prevDate = attendance.prevDate;

  const dateIdx = allAvailableDates.indexOf(effectiveDate);
  const canGoPrev = dateIdx > 0;
  const canGoNext = dateIdx < allAvailableDates.length - 1;

  const goToPrev = () => {
    if (canGoPrev) setSelectedDate(allAvailableDates[dateIdx - 1]);
  };
  const goToNext = () => {
    if (canGoNext) setSelectedDate(allAvailableDates[dateIdx + 1]);
    else setSelectedDate(undefined);
  };
  const goToLatest = () => setSelectedDate(undefined);

  const isLatest = !selectedDate || selectedDate === attendance.latestDate;

  const totalPresent = attendance.data.reduce((s, r) => s + r.latestPresent, 0);
  const totalStaff = attendance.data.reduce((s, r) => s + r.latestTotal, 0);
  const totalAbsent = attendance.data.reduce((s, r) => s + r.latestAbsent, 0);
  const overallRate = totalStaff > 0 ? (totalPresent / totalStaff) * 100 : 0;

  const prevTotalPresent = attendance.data.reduce((s, r) => s + r.prevPresent, 0);
  const prevTotalAbsent = attendance.data.reduce((s, r) => s + r.prevAbsent, 0);

  const totalCanteenSale = canteen.data.reduce((s, r) => s + r.sale, 0);
  const totalCanteenClosing = canteen.data.reduce((s, r) => s + r.closing, 0);
  const prevTotalSale = canteen.prevData?.reduce((s, r) => s + r.sale, 0) ?? 0;

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

  const dayLabel = useMemo(() => {
    if (!effectiveDate) return "";
    const parts = effectiveDate.split("/");
    if (parts.length !== 3) return effectiveDate;
    const [p1, p2, p3] = parts.map(Number);
    let d: number, m: number, y: number;
    if (p1 > 12) { d = p1; m = p2; y = p3; }
    else { m = p1; d = p2; y = p3; }
    const validDate = new Date(y, m - 1, d);
    if (isNaN(validDate.getTime())) return effectiveDate;
    return validDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }, [effectiveDate]);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {selectedDept && (
        <DetailPanel dept={selectedDept} selectedDate={selectedDate} onClose={() => setSelectedDept(null)} />
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="flex items-center justify-between py-3 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center shadow-sm">
                <Building2 size={15} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-800 leading-tight">Admin Department Dashboard</h1>
                <p className="text-xs text-blue-600 font-medium">Chairman Overview</p>
              </div>
            </div>

            {/* Date Navigator */}
            <div className="flex items-center gap-2">
              {!isLatest && (
                <button
                  onClick={goToLatest}
                  className="text-xs text-blue-600 font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  Today
                </button>
              )}
              <div className="flex items-center gap-1 bg-slate-100 rounded-xl px-1 py-1">
                <button
                  onClick={goToPrev}
                  disabled={!canGoPrev}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Previous day"
                >
                  <ChevronLeft size={14} />
                </button>
                <div className="flex items-center gap-1.5 px-1">
                  <CalendarDays size={13} className="text-slate-500" />
                  <select
                    value={selectedDate || ""}
                    onChange={e => setSelectedDate(e.target.value || undefined)}
                    className="text-xs font-semibold text-slate-700 bg-transparent border-0 outline-none cursor-pointer appearance-none"
                    style={{ minWidth: "80px" }}
                  >
                    <option value="">Latest</option>
                    {[...allAvailableDates].reverse().map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={goToNext}
                  disabled={!canGoNext}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Next day"
                >
                  <ChevRight size={14} />
                </button>
              </div>
              {!attendance.loading && effectiveDate && (
                <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock size={11} />
                  {dayLabel}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-5 py-5 space-y-4">

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            title="Total Staff"
            value={String(totalStaff)}
            subtitle="Across all sections"
            icon={Users}
            color="#1e40af"
            loading={attendance.loading}
          />
          <KpiCard
            title="Attendance Rate"
            value={attendance.loading ? "—" : `${overallRate.toFixed(1)}%`}
            subtitle={`${totalPresent} present · ${totalAbsent} absent`}
            icon={TrendingUp}
            color={overallRate >= 90 ? "#059669" : overallRate >= 75 ? "#d97706" : "#dc2626"}
            loading={attendance.loading}
            delta={prevDate ? <Delta current={totalPresent} prev={prevTotalPresent} unit=" staff" /> : undefined}
          />
          <KpiCard
            title="Canteen Sales"
            value={canteen.loading ? "—" : `${formatNumber(totalCanteenSale)} Ks`}
            subtitle={`Closing: ${formatNumber(totalCanteenClosing)} Ks`}
            icon={Utensils}
            color="#d97706"
            loading={canteen.loading}
            delta={prevDate && prevTotalSale > 0 ? <Delta current={totalCanteenSale} prev={prevTotalSale} unit=" Ks" /> : undefined}
          />
          <KpiCard
            title="Pending Purchases"
            value={purchase.loading ? "—" : String(totalOngoing)}
            subtitle={`${totalFinish} completed`}
            icon={ShoppingCart}
            color="#7c3aed"
            loading={purchase.loading}
          />
        </div>

        {/* Alerts + date context */}
        <div className="flex flex-wrap gap-2">
          {!attendance.loading && totalAbsent > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-lg flex-1 min-w-0">
              <AlertCircle size={14} className="text-amber-600 flex-shrink-0" />
              <span className="text-sm text-amber-800">
                <strong>{totalAbsent} staff absent</strong>
                {prevDate && prevTotalAbsent !== totalAbsent && (
                  <span className="ml-1.5 text-amber-600 text-xs">
                    (was {prevTotalAbsent} on {prevDate})
                  </span>
                )}
              </span>
            </div>
          )}
          {!attendance.loading && totalAbsent === 0 && totalStaff > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-lg flex-1 min-w-0">
              <CheckCircle size={14} className="text-emerald-600 flex-shrink-0" />
              <span className="text-sm text-emerald-800">Full attendance — all staff present</span>
            </div>
          )}
        </div>

        {/* Main Tabs */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-100 bg-slate-50">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wide transition-all relative ${
                    activeTab === tab.id ? "text-blue-700 bg-white" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Icon size={13} />
                  {tab.label}
                  {activeTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-700 rounded-full" />}
                </button>
              );
            })}
          </div>

          <div className="p-5">

            {/* ── ATTENDANCE ── */}
            {activeTab === "attendance" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Users size={12} />Department Attendance
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-2.5 py-1.5">
                      <Filter size={11} className="text-slate-400" />
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
                    <div className="grid lg:grid-cols-[3fr_2fr] gap-4">
                      <div>
                        <p className="text-xs text-slate-400 mb-3">Staff count by section</p>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={filteredAttendance} margin={{ top: 4, right: 4, left: -18, bottom: 60 }} barCategoryGap="25%" barGap={2}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                              <XAxis dataKey="section" tick={{ fontSize: 10, fill: "#94a3b8" }} angle={-35} textAnchor="end" interval={0} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} />
                              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} iconType="circle" iconSize={8} />
                              <Bar dataKey="latestTotal" name="Total" fill="#e2e8f0" radius={[3, 3, 0, 0]} maxBarSize={22} />
                              <Bar dataKey="latestPresent" name="Present" radius={[3, 3, 0, 0]} maxBarSize={22}>
                                {filteredAttendance.map((entry, i) => (
                                  <Cell key={i} fill={SECTION_COLORS[entry.section] || "#1e40af"} />
                                ))}
                              </Bar>
                              <Bar dataKey="latestAbsent" name="Absent" fill="#fca5a5" radius={[3, 3, 0, 0]} maxBarSize={22} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-3">Present staff distribution</p>
                        <div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={pieData} cx="50%" cy="45%" innerRadius={48} outerRadius={72} paddingAngle={2} dataKey="value" strokeWidth={0}>
                                {pieData.map((entry, i) => (
                                  <Cell key={i} fill={SECTION_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "12px" }} formatter={(val) => [`${val} staff`, ""]} />
                              <Legend wrapperStyle={{ fontSize: "10px", paddingTop: "4px" }} iconType="circle" iconSize={7} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-100 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Section</th>
                            <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
                            <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Present</th>
                            <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Absent</th>
                            {prevDate && <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">vs {prevDate}</th>}
                            <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rate</th>
                            <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredAttendance.map((row, i) => (
                            <tr
                              key={i}
                              className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                              onClick={() => setSectionFilter(sectionFilter === row.section ? "all" : row.section)}
                              title={`Click to filter: ${row.section}`}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: SECTION_COLORS[row.section] || "#94a3b8" }} />
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
                              {prevDate && (
                                <td className="px-3 py-3 text-center">
                                  <Delta current={row.latestPresent} prev={row.prevPresent} />
                                </td>
                              )}
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2 min-w-[100px]">
                                  <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${Math.min(row.attendanceRate, 100)}%`, backgroundColor: SECTION_COLORS[row.section] || "#1e40af" }} />
                                  </div>
                                  <span className="text-xs text-slate-500 w-9 text-right tabular-nums">{row.attendanceRate.toFixed(0)}%</span>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-center"><SectionBadge rate={row.attendanceRate} /></td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-slate-200 bg-slate-50">
                            <td className="px-4 py-2.5 text-xs font-bold text-slate-700 uppercase tracking-wide">Total</td>
                            <td className="px-3 py-2.5 text-center font-bold text-slate-700 tabular-nums">{totalStaff}</td>
                            <td className="px-3 py-2.5 text-center font-bold text-emerald-700 tabular-nums">{totalPresent}</td>
                            <td className="px-3 py-2.5 text-center font-bold tabular-nums">
                              <span className={totalAbsent > 0 ? "text-red-600" : "text-slate-300"}>{totalAbsent > 0 ? totalAbsent : "—"}</span>
                            </td>
                            {prevDate && (
                              <td className="px-3 py-2.5 text-center">
                                <Delta current={totalPresent} prev={prevTotalPresent} />
                              </td>
                            )}
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

            {/* ── CANTEEN ── */}
            {activeTab === "canteen" && (
              <div className="space-y-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Utensils size={12} />Canteen Financial Overview
                </p>
                {canteen.loading && <LoadingSpinner />}
                {canteen.error && <ErrorBox message={canteen.error} />}
                {!canteen.loading && canteen.data.length > 0 && (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Opening", val: canteen.data.reduce((s, r) => s + r.opening, 0), color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
                        { label: "Purchase", val: canteen.data.reduce((s, r) => s + r.purchase, 0), color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
                        { label: "Sales", val: totalCanteenSale, color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
                        { label: "Closing", val: totalCanteenClosing, color: "#1e40af", bg: "#eff6ff", border: "#bfdbfe" },
                      ].map(item => (
                        <div key={item.label} className="rounded-xl p-3.5 border" style={{ backgroundColor: item.bg, borderColor: item.border }}>
                          <p className="text-xs font-medium" style={{ color: item.color }}>{item.label}</p>
                          <p className="text-lg font-bold mt-1" style={{ color: item.color }}>
                            {formatCurrency(item.val)} <span className="text-sm font-normal opacity-70">Ks</span>
                          </p>
                          {item.label === "Sales" && prevDate && prevTotalSale > 0 && (
                            <div className="mt-1"><Delta current={item.val} prev={prevTotalSale} unit=" Ks" /></div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-3">Opening / Purchase / Sale / Closing by shop</p>
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={canteen.data} margin={{ top: 4, right: 4, left: -10, bottom: 60 }} barCategoryGap="25%" barGap={2}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="shop" tick={{ fontSize: 10, fill: "#94a3b8" }} angle={-30} textAnchor="end" interval={0} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={v => formatNumber(v)} axisLine={false} tickLine={false} />
                            <Tooltip content={<CurrencyTooltip />} cursor={{ fill: "#f8fafc" }} />
                            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} iconType="circle" iconSize={8} />
                            <Bar dataKey="opening" name="Opening" fill="#cbd5e1" radius={[3, 3, 0, 0]} maxBarSize={16} />
                            <Bar dataKey="purchase" name="Purchase" fill="#fbbf24" radius={[3, 3, 0, 0]} maxBarSize={16} />
                            <Bar dataKey="sale" name="Sale" fill="#059669" radius={[3, 3, 0, 0]} maxBarSize={16} />
                            <Bar dataKey="closing" name="Closing" fill="#1e40af" radius={[3, 3, 0, 0]} maxBarSize={16} />
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
                              <td className="px-4 py-3 text-right text-slate-400 tabular-nums">{formatCurrency(row.opening)}</td>
                              <td className="px-4 py-3 text-right text-amber-600 tabular-nums">{row.purchase > 0 ? formatCurrency(row.purchase) : <span className="text-slate-300">—</span>}</td>
                              <td className="px-4 py-3 text-right font-semibold text-emerald-600 tabular-nums">{formatCurrency(row.sale)}</td>
                              <td className="px-4 py-3 text-right font-semibold text-blue-600 tabular-nums">{formatCurrency(row.closing)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-slate-200 bg-slate-50">
                            <td className="px-4 py-2.5 text-xs font-bold text-slate-700 uppercase tracking-wide">Total</td>
                            <td className="px-4 py-2.5 text-right font-bold text-slate-500 tabular-nums">{formatCurrency(canteen.data.reduce((s, r) => s + r.opening, 0))}</td>
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

            {/* ── PURCHASE ── */}
            {activeTab === "purchase" && (
              <div className="space-y-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <ShoppingCart size={12} />General Purchase Tracker
                </p>
                {purchase.loading && <LoadingSpinner />}
                {purchase.error && <ErrorBox message={purchase.error} />}
                {!purchase.loading && purchase.data.length > 0 && (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl p-3.5 border border-slate-200 bg-slate-50">
                        <p className="text-xs text-slate-500 font-medium">Total Requests</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{purchase.data.reduce((s, r) => s + r.qty, 0)}</p>
                      </div>
                      <div className="rounded-xl p-3.5 border border-emerald-100 bg-emerald-50">
                        <p className="text-xs text-emerald-600 font-medium">Completed</p>
                        <p className="text-2xl font-bold text-emerald-700 mt-1">{totalFinish}</p>
                      </div>
                      <div className="rounded-xl p-3.5 border border-amber-100 bg-amber-50">
                        <p className="text-xs text-amber-600 font-medium">Ongoing</p>
                        <p className="text-2xl font-bold text-amber-700 mt-1">{totalOngoing}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-3">Requests by category</p>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={purchase.data} margin={{ top: 4, right: 4, left: -20, bottom: 50 }} barGap={2}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="description" tick={{ fontSize: 10, fill: "#94a3b8" }} angle={-25} textAnchor="end" interval={0} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} />
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
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            Department Details
            <span className="text-slate-300 font-normal">— Click to view</span>
            {selectedDate && <span className="text-blue-500 font-normal">for {selectedDate}</span>}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {DEPT_MODULES.map(dept => {
              const Icon = dept.icon;
              return (
                <button
                  key={dept.key}
                  onClick={() => setSelectedDept(dept.key)}
                  className="group bg-white rounded-xl p-4 border shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 text-left"
                  style={{ borderColor: dept.border }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: dept.bg, border: `1px solid ${dept.border}` }}>
                    <Icon size={15} style={{ color: dept.color }} />
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

        <p className="text-center text-xs text-slate-300 pb-2">
          Data sourced from Google Sheets · {allAvailableDates.length} days recorded · Refreshes on page load
        </p>
      </div>
    </div>
  );
}
