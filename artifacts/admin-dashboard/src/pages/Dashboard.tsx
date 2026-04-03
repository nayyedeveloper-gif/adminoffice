import { useAttendanceData, useCanteenData, usePurchaseData } from "@/hooks/useSheetData";
import { formatCurrency, formatNumber } from "@/lib/googleSheets";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Users,
  ShoppingCart,
  Utensils,
  RefreshCw,
  AlertCircle,
  TrendingDown,
  Clock,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";

const CHART_COLORS = ["#1e40af", "#059669", "#dc2626", "#d97706", "#7c3aed", "#0891b2", "#be185d", "#65a30d"];

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  loading,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide truncate">{title}</p>
          {loading ? (
            <div className="h-8 w-16 bg-slate-100 rounded animate-pulse mt-2" />
          ) : (
            <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          )}
          {subtitle && !loading && <p className="text-xs text-slate-400 mt-1 truncate">{subtitle}</p>}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3"
          style={{ backgroundColor: `${color}18` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function SectionBadge({ rate }: { rate: number }) {
  if (rate >= 90)
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
        Excellent
      </span>
    );
  if (rate >= 75)
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        Good
      </span>
    );
  if (rate >= 50)
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
        Fair
      </span>
    );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
      Low
    </span>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <RefreshCw size={22} className="animate-spin text-blue-600" />
      <span className="ml-2 text-slate-500 text-sm">Loading data from Google Sheets...</span>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-600 text-sm">
      <AlertCircle size={16} />
      <span>{message}</span>
    </div>
  );
}

function DateBadge({ date }: { date: string }) {
  if (!date) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 rounded-full px-2.5 py-1">
      <Clock size={11} />
      {date}
    </span>
  );
}

export default function Dashboard() {
  const attendance = useAttendanceData();
  const canteen = useCanteenData();
  const purchase = usePurchaseData();
  const [activeTab, setActiveTab] = useState<"attendance" | "canteen" | "purchase">("attendance");

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const totalPresent = attendance.data.reduce((s, r) => s + r.latestPresent, 0);
  const totalStaff = attendance.data.reduce((s, r) => s + r.latestTotal, 0);
  const totalAbsent = attendance.data.reduce((s, r) => s + r.latestAbsent, 0);
  const overallRate = totalStaff > 0 ? (totalPresent / totalStaff) * 100 : 0;

  const totalCanteenSale = canteen.data.reduce((s, r) => s + r.sale, 0);
  const totalCanteenClosing = canteen.data.reduce((s, r) => s + r.closing, 0);

  const totalOngoing = purchase.data.reduce((s, r) => s + r.ongoing, 0);
  const totalFinish = purchase.data.reduce((s, r) => s + r.finish, 0);

  const pieData = attendance.data
    .filter((d) => d.latestPresent > 0)
    .map((d) => ({ name: d.section, value: d.latestPresent }));

  const tabs = [
    { id: "attendance" as const, label: "Attendance", icon: Users },
    { id: "canteen" as const, label: "Canteen", icon: Utensils },
    { id: "purchase" as const, label: "Purchase", icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Building2 size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-slate-800 leading-tight">Admin Department Dashboard</h1>
                <p className="text-xs text-blue-600 font-medium">Chairman Overview</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Clock size={13} className="text-slate-400" />
              <span className="text-xs text-slate-500 hidden sm:block">{today}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Total Staff"
            value={formatNumber(totalStaff)}
            subtitle="Across all sections"
            icon={Users}
            color="#1e40af"
            loading={attendance.loading}
          />
          <StatCard
            title="Present Today"
            value={`${totalPresent} / ${totalStaff}`}
            subtitle={`${overallRate.toFixed(1)}% attendance rate`}
            icon={CheckCircle2}
            color="#059669"
            loading={attendance.loading}
          />
          <StatCard
            title="Canteen Sales"
            value={`${formatNumber(totalCanteenSale)} Ks`}
            subtitle={`Closing: ${formatNumber(totalCanteenClosing)} Ks`}
            icon={Utensils}
            color="#d97706"
            loading={canteen.loading}
          />
          <StatCard
            title="Pending Purchases"
            value={String(totalOngoing)}
            subtitle={`${totalFinish} completed`}
            icon={ShoppingCart}
            color="#7c3aed"
            loading={purchase.loading}
          />
        </div>

        {/* Absent Alert */}
        {!attendance.loading && totalAbsent > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center gap-3">
            <AlertCircle size={17} className="text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-semibold text-amber-800 text-sm">
                {totalAbsent} staff absent
              </span>
              <span className="text-amber-600 text-sm ml-1.5">across all departments today</span>
              {attendance.latestDate && (
                <span className="text-amber-500 text-xs ml-2">({attendance.latestDate})</span>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="flex border-b border-slate-100">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? "text-blue-600"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-5">
            {/* Attendance Tab */}
            {activeTab === "attendance" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-800">Department Attendance</h2>
                  <DateBadge date={attendance.latestDate} />
                </div>
                {attendance.loading && <LoadingSpinner />}
                {attendance.error && <ErrorBox message={attendance.error} />}
                {!attendance.loading && !attendance.error && attendance.data.length > 0 && (
                  <>
                    <div className="grid lg:grid-cols-5 gap-5">
                      <div className="lg:col-span-3">
                        <div className="h-60 sm:h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={attendance.data}
                              margin={{ top: 4, right: 4, left: -20, bottom: 64 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis
                                dataKey="section"
                                tick={{ fontSize: 10, fill: "#64748b" }}
                                angle={-35}
                                textAnchor="end"
                                interval={0}
                              />
                              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                              <Tooltip
                                contentStyle={{
                                  borderRadius: "8px",
                                  border: "1px solid #e2e8f0",
                                  fontSize: "12px",
                                }}
                              />
                              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }} />
                              <Bar dataKey="latestTotal" name="Total" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                              <Bar dataKey="latestPresent" name="Present" fill="#1e40af" radius={[3, 3, 0, 0]} />
                              <Bar dataKey="latestAbsent" name="Absent" fill="#dc2626" radius={[3, 3, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="lg:col-span-2">
                        <div className="h-60 sm:h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="45%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {pieData.map((_, index) => (
                                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                              <Legend wrapperStyle={{ fontSize: "10px" }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Section
                            </th>
                            <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Total
                            </th>
                            <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Present
                            </th>
                            <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Absent
                            </th>
                            <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Rate
                            </th>
                            <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {attendance.data.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 font-medium text-slate-800">{row.section}</td>
                              <td className="px-3 py-3 text-center text-slate-600">{row.latestTotal}</td>
                              <td className="px-3 py-3 text-center text-emerald-600 font-semibold">
                                {row.latestPresent}
                              </td>
                              <td className="px-3 py-3 text-center text-red-500 font-semibold">
                                {row.latestAbsent || "-"}
                              </td>
                              <td className="px-3 py-3 text-center">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                                    <div
                                      className="h-1.5 rounded-full bg-blue-500"
                                      style={{ width: `${Math.min(row.attendanceRate, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-slate-500 w-10 text-right">
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
                          <tr className="bg-blue-50 font-semibold border-t-2 border-blue-100">
                            <td className="px-4 py-3 text-blue-800 font-bold">TOTAL</td>
                            <td className="px-3 py-3 text-center text-slate-700">{totalStaff}</td>
                            <td className="px-3 py-3 text-center text-emerald-700 font-bold">{totalPresent}</td>
                            <td className="px-3 py-3 text-center text-red-600 font-bold">
                              {totalAbsent || "-"}
                            </td>
                            <td className="px-3 py-3 text-center" colSpan={2}>
                              <span className="text-blue-700 font-bold">{overallRate.toFixed(1)}%</span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Canteen Tab */}
            {activeTab === "canteen" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-800">Canteen Financial Overview</h2>
                  <DateBadge date={canteen.latestDate} />
                </div>
                {canteen.loading && <LoadingSpinner />}
                {canteen.error && <ErrorBox message={canteen.error} />}
                {!canteen.loading && canteen.data.length > 0 && (
                  <>
                    <div className="grid sm:grid-cols-4 gap-3">
                      {[
                        {
                          label: "Opening Balance",
                          val: canteen.data.reduce((s, r) => s + r.opening, 0),
                          color: "bg-slate-50 border-slate-200 text-slate-700",
                        },
                        {
                          label: "Purchase",
                          val: canteen.data.reduce((s, r) => s + r.purchase, 0),
                          color: "bg-amber-50 border-amber-200 text-amber-700",
                        },
                        {
                          label: "Total Sales",
                          val: totalCanteenSale,
                          color: "bg-emerald-50 border-emerald-200 text-emerald-700",
                        },
                        {
                          label: "Closing Balance",
                          val: totalCanteenClosing,
                          color: "bg-blue-50 border-blue-200 text-blue-700",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className={`rounded-xl p-4 border ${item.color}`}
                        >
                          <p className="text-xs font-medium opacity-70">{item.label}</p>
                          <p className="text-lg font-bold mt-1">{formatCurrency(item.val)} Ks</p>
                        </div>
                      ))}
                    </div>

                    {canteen.data.some(d => d.opening > 0 || d.sale > 0) && (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={canteen.data}
                            margin={{ top: 4, right: 4, left: -10, bottom: 60 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis
                              dataKey="shop"
                              tick={{ fontSize: 10, fill: "#64748b" }}
                              angle={-30}
                              textAnchor="end"
                              interval={0}
                            />
                            <YAxis
                              tick={{ fontSize: 10, fill: "#64748b" }}
                              tickFormatter={(v) => formatNumber(v)}
                            />
                            <Tooltip
                              formatter={(val) => formatCurrency(Number(val)) + " Ks"}
                              contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                            />
                            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "4px" }} />
                            <Bar dataKey="opening" name="Opening" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="purchase" name="Purchase" fill="#d97706" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="sale" name="Sale" fill="#059669" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="closing" name="Closing" fill="#1e40af" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Shop
                            </th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Opening
                            </th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Purchase
                            </th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Sale
                            </th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Closing
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {canteen.data.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-medium text-slate-800">{row.shop}</td>
                              <td className="px-4 py-3 text-right text-slate-600">
                                {formatCurrency(row.opening)}
                              </td>
                              <td className="px-4 py-3 text-right text-amber-600">
                                {formatCurrency(row.purchase)}
                              </td>
                              <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                                {formatCurrency(row.sale)}
                              </td>
                              <td className="px-4 py-3 text-right text-blue-600 font-semibold">
                                {formatCurrency(row.closing)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-blue-50 font-bold border-t-2 border-blue-100">
                            <td className="px-4 py-3 text-blue-800">TOTAL</td>
                            <td className="px-4 py-3 text-right text-slate-700">
                              {formatCurrency(canteen.data.reduce((s, r) => s + r.opening, 0))}
                            </td>
                            <td className="px-4 py-3 text-right text-amber-700">
                              {formatCurrency(canteen.data.reduce((s, r) => s + r.purchase, 0))}
                            </td>
                            <td className="px-4 py-3 text-right text-emerald-700">
                              {formatCurrency(totalCanteenSale)}
                            </td>
                            <td className="px-4 py-3 text-right text-blue-700">
                              {formatCurrency(totalCanteenClosing)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Purchase Tab */}
            {activeTab === "purchase" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-800">General Purchase Tracker</h2>
                  <DateBadge date={purchase.latestDate} />
                </div>
                {purchase.loading && <LoadingSpinner />}
                {purchase.error && <ErrorBox message={purchase.error} />}
                {!purchase.loading && purchase.data.length > 0 && (
                  <>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <p className="text-xs font-medium text-slate-500">Total Requests</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">
                          {purchase.data.reduce((s, r) => s + r.qty, 0)}
                        </p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                        <p className="text-xs font-medium text-emerald-600">Completed</p>
                        <p className="text-2xl font-bold text-emerald-700 mt-1">{totalFinish}</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                        <p className="text-xs font-medium text-amber-600">Ongoing</p>
                        <p className="text-2xl font-bold text-amber-700 mt-1">{totalOngoing}</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Description
                            </th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Qty
                            </th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Finished
                            </th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Ongoing
                            </th>
                            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                              Progress
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {purchase.data.map((row, i) => {
                            const progress = row.qty > 0 ? (row.finish / row.qty) * 100 : 0;
                            return (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-medium text-slate-800">{row.description}</td>
                                <td className="px-4 py-3 text-center text-slate-600">{row.qty}</td>
                                <td className="px-4 py-3 text-center text-emerald-600 font-semibold">
                                  {row.finish}
                                </td>
                                <td className="px-4 py-3 text-center text-amber-600 font-semibold">
                                  {row.ongoing}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                                      <div
                                        className="h-1.5 rounded-full bg-emerald-500"
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-slate-500 w-10 text-right">
                                      {progress.toFixed(0)}%
                                    </span>
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
          <h2 className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wide">Department Modules</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { name: "Vehicle", icon: "🚗", color: "#0891b2" },
              { name: "Warehouse", icon: "🏭", color: "#7c3aed" },
              { name: "Generator", icon: "⚡", color: "#d97706" },
              { name: "CCTV", icon: "📷", color: "#059669" },
              { name: "IT", icon: "💻", color: "#1e40af" },
              { name: "M & E", icon: "🔧", color: "#dc2626" },
            ].map((dept) => (
              <div
                key={dept.name}
                className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <div className="text-xl mb-2">{dept.icon}</div>
                <p className="text-xs font-semibold text-slate-700">{dept.name}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 pb-2">
          Data sourced from Google Sheets · Refreshes on page load
        </p>
      </div>
    </div>
  );
}
