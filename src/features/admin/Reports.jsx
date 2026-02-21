import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import BottomNavbar from '../../shared/navigation/BottomNavbar';
import { FilterSelect } from '../../shared/components/OptionInput';

const STORAGE_KEY = 'hlBookings';
const CHART_COLORS = ['#3878c2', '#63bce6', '#4bad40', '#f59e0b', '#ef4444', '#8b5cf6'];
const CHART_TYPE_LABELS = {
  bar: 'Bar Graph',
  line: 'Line Graph',
  pie: 'Pie Chart',
};

const REPORTS = [
  { key: 'bookingVolume', label: 'Booking Volume Trend', views: ['bar', 'line'] },
  { key: 'serviceMix', label: 'Service Mix Report', views: ['bar', 'pie'] },
  { key: 'addons', label: 'Add-ons Consumption Report', views: ['bar', 'pie'] },
  { key: 'paymentSplit', label: 'Payment Method Split', views: ['bar', 'pie'] },
  { key: 'collectionOption', label: 'Collection/Delivery Distribution', views: ['bar', 'pie'] },
  { key: 'preferredTime', label: 'Preferred Date/Time Peak Windows', views: ['bar', 'line'] },
  { key: 'successFailure', label: 'Booking Success vs Failure Rate', views: ['bar', 'pie'] },
];

const COLLECTION_OPTION_LABELS = {
  dropOffPickUpLater: 'Drop-off & Pick up later',
  dropOffDelivered: 'Drop-off & Delivered',
  pickedUpDelivered: 'Picked up & Delivered',
};

const DUMMY_BOOKINGS = [
  {
    id: 'HL-250101-1001',
    createdAt: '2026-01-03T09:30:00.000Z',
    collectionOption: 'dropOffPickUpLater',
    optionLabel: 'Drop-off & Pick up later',
    services: { wash: 1, dry: 1, fold: 0 },
    addons: { detergent: 1, conditioner: 1 },
    paymentMethod: 'cash',
    bookingStatus: 'success',
    collectionInfo: { time: '09:00' },
    deliveryInfo: { time: '15:00' },
    timeline: [{ status: 'Booking Received', timestamp: '2026-01-03T09:30:00.000Z' }],
  },
  {
    id: 'HL-250105-1002',
    createdAt: '2026-01-05T11:15:00.000Z',
    collectionOption: 'dropOffDelivered',
    optionLabel: 'Drop-off & Delivered',
    services: { wash: 1, dry: 0, fold: 1 },
    addons: { detergent: 2, conditioner: 0 },
    paymentMethod: 'gcash',
    bookingStatus: 'success',
    collectionInfo: { time: '11:00' },
    deliveryInfo: { time: '16:00' },
    timeline: [{ status: 'Booking Received', timestamp: '2026-01-05T11:15:00.000Z' }],
  },
  {
    id: 'HL-250108-1003',
    createdAt: '2026-01-08T13:45:00.000Z',
    collectionOption: 'pickedUpDelivered',
    optionLabel: 'Picked up & Delivered',
    services: { wash: 1, dry: 1, fold: 1 },
    addons: { detergent: 1, conditioner: 2 },
    paymentMethod: 'gcash',
    bookingStatus: 'failure',
    collectionInfo: { time: '13:00' },
    deliveryInfo: { time: '17:00' },
    timeline: [{ status: 'Booking Failed', timestamp: '2026-01-08T13:45:00.000Z' }],
  },
  {
    id: 'HL-250114-1004',
    createdAt: '2026-01-14T10:10:00.000Z',
    collectionOption: 'dropOffDelivered',
    optionLabel: 'Drop-off & Delivered',
    services: { wash: 1, dry: 1, fold: 0 },
    addons: { detergent: 0, conditioner: 1 },
    paymentMethod: 'gcash',
    bookingStatus: 'success',
    collectionInfo: { time: '10:00' },
    deliveryInfo: { time: '14:00' },
    timeline: [{ status: 'Booking Received', timestamp: '2026-01-14T10:10:00.000Z' }],
  },
  {
    id: 'HL-250120-1005',
    createdAt: '2026-01-20T15:05:00.000Z',
    collectionOption: 'dropOffPickUpLater',
    optionLabel: 'Drop-off & Pick up later',
    services: { wash: 0, dry: 1, fold: 1 },
    addons: { detergent: 1, conditioner: 0 },
    paymentMethod: 'cash',
    bookingStatus: 'success',
    collectionInfo: { time: '15:00' },
    deliveryInfo: { time: '10:00' },
    timeline: [{ status: 'Booking Received', timestamp: '2026-01-20T15:05:00.000Z' }],
  },
  {
    id: 'HL-250129-1006',
    createdAt: '2026-01-29T16:40:00.000Z',
    collectionOption: 'pickedUpDelivered',
    optionLabel: 'Picked up & Delivered',
    services: { wash: 1, dry: 0, fold: 0 },
    addons: { detergent: 0, conditioner: 2 },
    paymentMethod: 'gcash',
    bookingStatus: 'failure',
    collectionInfo: { time: '16:00' },
    deliveryInfo: { time: '12:00' },
    timeline: [{ status: 'Booking Cancelled', timestamp: '2026-01-29T16:40:00.000Z' }],
  },
  {
    id: 'HL-250202-1007',
    createdAt: '2026-02-02T09:50:00.000Z',
    collectionOption: 'dropOffDelivered',
    optionLabel: 'Drop-off & Delivered',
    services: { wash: 1, dry: 1, fold: 1 },
    addons: { detergent: 2, conditioner: 1 },
    paymentMethod: 'gcash',
    bookingStatus: 'success',
    collectionInfo: { time: '09:00' },
    deliveryInfo: { time: '13:00' },
    timeline: [{ status: 'Booking Received', timestamp: '2026-02-02T09:50:00.000Z' }],
  },
  {
    id: 'HL-250206-1008',
    createdAt: '2026-02-06T12:30:00.000Z',
    collectionOption: 'dropOffPickUpLater',
    optionLabel: 'Drop-off & Pick up later',
    services: { wash: 0, dry: 1, fold: 1 },
    addons: { detergent: 1, conditioner: 1 },
    paymentMethod: 'cash',
    bookingStatus: 'success',
    collectionInfo: { time: '12:00' },
    deliveryInfo: { time: '16:00' },
    timeline: [{ status: 'Booking Received', timestamp: '2026-02-06T12:30:00.000Z' }],
  },
  {
    id: 'HL-250211-1009',
    createdAt: '2026-02-11T14:20:00.000Z',
    collectionOption: 'pickedUpDelivered',
    optionLabel: 'Picked up & Delivered',
    services: { wash: 1, dry: 1, fold: 0 },
    addons: { detergent: 0, conditioner: 1 },
    paymentMethod: 'gcash',
    bookingStatus: 'success',
    collectionInfo: { time: '14:00' },
    deliveryInfo: { time: '18:00' },
    timeline: [{ status: 'Booking Received', timestamp: '2026-02-11T14:20:00.000Z' }],
  },
  {
    id: 'HL-250215-1010',
    createdAt: '2026-02-15T10:40:00.000Z',
    collectionOption: 'dropOffDelivered',
    optionLabel: 'Drop-off & Delivered',
    services: { wash: 1, dry: 0, fold: 1 },
    addons: { detergent: 2, conditioner: 2 },
    paymentMethod: 'gcash',
    bookingStatus: 'failure',
    collectionInfo: { time: '10:00' },
    deliveryInfo: { time: '15:00' },
    timeline: [{ status: 'Payment Flagged', timestamp: '2026-02-15T10:40:00.000Z' }],
  },
  {
    id: 'HL-250217-1011',
    createdAt: '2026-02-17T11:55:00.000Z',
    collectionOption: 'dropOffPickUpLater',
    optionLabel: 'Drop-off & Pick up later',
    services: { wash: 1, dry: 1, fold: 1 },
    addons: { detergent: 1, conditioner: 0 },
    paymentMethod: 'cash',
    bookingStatus: 'success',
    collectionInfo: { time: '11:00' },
    deliveryInfo: { time: '14:00' },
    timeline: [{ status: 'Booking Received', timestamp: '2026-02-17T11:55:00.000Z' }],
  },
  {
    id: 'HL-250219-1012',
    createdAt: '2026-02-19T16:10:00.000Z',
    collectionOption: 'pickedUpDelivered',
    optionLabel: 'Picked up & Delivered',
    services: { wash: 1, dry: 0, fold: 0 },
    addons: { detergent: 0, conditioner: 1 },
    paymentMethod: 'gcash',
    bookingStatus: 'success',
    collectionInfo: { time: '16:00' },
    deliveryInfo: { time: '12:00' },
    timeline: [{ status: 'Booking Received', timestamp: '2026-02-19T16:10:00.000Z' }],
  },
];

function parseStoredBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toSafeDate(input) {
  if (!input) return null;
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getBookingCreatedAt(booking) {
  const firstTimeline = Array.isArray(booking.timeline) ? booking.timeline[0]?.timestamp : '';
  const directDate = booking.createdAt || booking.date;
  return toSafeDate(firstTimeline) || toSafeDate(directDate);
}

function getWeekLabel(date) {
  const oneJan = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date - oneJan) / 86400000) + 1;
  const week = Math.ceil(dayOfYear / 7);
  return `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function normalizeCount(value) {
  if (typeof value === 'boolean') return value ? 1 : 0;
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getServiceCounts(booking) {
  const services = booking.services || {};
  return {
    wash: normalizeCount(services.wash),
    dry: normalizeCount(services.dry),
    fold: normalizeCount(services.fold),
  };
}

function getAddonCounts(booking) {
  const addons = booking.addons || {};
  return {
    detergent: normalizeCount(addons.detergent) * 2,
    conditioner: normalizeCount(addons.conditioner) * 2,
  };
}

function getPaymentMode(booking) {
  const method = String(booking.paymentMethod || '').toLowerCase();
  if (method === 'gcash') return 'GCash';
  if (method === 'cash') return 'Cash';
  return 'Unknown';
}

function getOutcome(booking) {
  if (booking.bookingStatus) {
    return String(booking.bookingStatus).toLowerCase() === 'success' ? 'Success' : 'Failure';
  }

  const timelineText = Array.isArray(booking.timeline)
    ? booking.timeline.map((entry) => String(entry.status || '').toLowerCase()).join(' ')
    : '';

  if (timelineText.includes('cancel') || timelineText.includes('fail') || timelineText.includes('flagged')) {
    return 'Failure';
  }

  return 'Success';
}

function bucketTime(timeValue) {
  const time = String(timeValue || '');
  const [hourString] = time.split(':');
  const hour = Number(hourString);
  if (!Number.isFinite(hour)) return null;

  if (hour < 10) return '09:00-10:59';
  if (hour < 12) return '11:00-11:59';
  if (hour < 14) return '12:00-13:59';
  if (hour < 16) return '14:00-15:59';
  return '16:00-18:00';
}

function buildDistributionData(records) {
  return Object.entries(records)
    .map(([name, value]) => ({ name, value }))
    .filter((entry) => entry.value > 0);
}

function ReportChart({ view, data, xKey = 'name', yKey = 'value' }) {
  if (!data.length) {
    return (
      <div className="h-80 w-full rounded-2xl bg-[#ffffff] p-6 flex flex-col items-center justify-center text-[#3878c2]">
        <p className="text-base font-semibold">No valid data yet for this report.</p>
        <p className="mt-1 text-xs text-[#374151]">Create bookings first or use richer booking fields.</p>
      </div>
    );
  }

  if (view === 'pie') {
    return (
      <div className="h-80 w-full rounded-2xl border border-[#3878c2] bg-white p-4 shadow-sm">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey={yKey} nameKey={xKey} innerRadius={58} outerRadius={95} paddingAngle={3}>
              {data.map((entry, index) => (
                <Cell key={`${entry[xKey]}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (view === 'line') {
    return (
      <div className="h-80 w-full rounded-2xl border border-[#3878c2] bg-white p-4 shadow-sm">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey={xKey} tick={{ fill: '#3878c2', fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey={yKey} stroke="#3878c2" strokeWidth={3} dot={{ r: 4, fill: '#3878c2' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-80 w-full rounded-2xl border border-[#3878c2] bg-white p-4 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey={xKey} tick={{ fill: '#3878c2', fontSize: 11 }} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey={yKey} radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`${entry[xKey]}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Reports() {
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState('bookingVolume');
  const [chartView, setChartView] = useState('bar');
  const [timeframe, setTimeframe] = useState('monthly');

  const storedBookings = useMemo(() => parseStoredBookings(), []);
  const isUsingDummyData = storedBookings.length === 0;
  const bookings = isUsingDummyData ? DUMMY_BOOKINGS : storedBookings;

  const computed = useMemo(() => {
    const volumeMap = {};
    const serviceMap = { Wash: 0, Dry: 0, Fold: 0 };
    const addonsMap = { Detergent: 0, Conditioner: 0 };
    const paymentMap = { GCash: 0, Cash: 0, Unknown: 0 };
    const collectionMap = {
      'Drop-off & Pick up later': 0,
      'Drop-off & Delivered': 0,
      'Picked up & Delivered': 0,
      Unknown: 0,
    };
    const peakWindowsMap = {
      '09:00-10:59': 0,
      '11:00-11:59': 0,
      '12:00-13:59': 0,
      '14:00-15:59': 0,
      '16:00-18:00': 0,
    };
    const outcomeMap = { Success: 0, Failure: 0 };

    bookings.forEach((booking) => {
      const createdAt = getBookingCreatedAt(booking);
      if (createdAt) {
        const key =
          timeframe === 'daily'
            ? createdAt.toISOString().slice(0, 10)
            : timeframe === 'weekly'
              ? getWeekLabel(createdAt)
              : `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
        volumeMap[key] = (volumeMap[key] || 0) + 1;
      }

      const services = getServiceCounts(booking);
      serviceMap.Wash += services.wash;
      serviceMap.Dry += services.dry;
      serviceMap.Fold += services.fold;

      const addons = getAddonCounts(booking);
      addonsMap.Detergent += addons.detergent;
      addonsMap.Conditioner += addons.conditioner;

      const paymentMode = getPaymentMode(booking);
      paymentMap[paymentMode] = (paymentMap[paymentMode] || 0) + 1;

      const optionLabel =
        COLLECTION_OPTION_LABELS[booking.collectionOption] ||
        booking.optionLabel ||
        'Unknown';
      collectionMap[optionLabel] = (collectionMap[optionLabel] || 0) + 1;

      const collectionTimeBucket = bucketTime(booking.collectionInfo?.time || booking.collectionTime);
      const deliveryTimeBucket = bucketTime(booking.deliveryInfo?.time || booking.deliveryTime);
      if (collectionTimeBucket) peakWindowsMap[collectionTimeBucket] += 1;
      if (deliveryTimeBucket) peakWindowsMap[deliveryTimeBucket] += 1;

      const outcome = getOutcome(booking);
      outcomeMap[outcome] = (outcomeMap[outcome] || 0) + 1;
    });

    let bookingVolume = Object.entries(volumeMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => ({ name, value }));

    if (!bookingVolume.length && bookings.length > 0) {
      bookingVolume = [{ name: 'Total Bookings', value: bookings.length }];
    }

    return {
      bookingVolume,
      serviceMix: buildDistributionData(serviceMap),
      addons: buildDistributionData(addonsMap),
      paymentSplit: buildDistributionData(paymentMap),
      collectionOption: buildDistributionData(collectionMap),
      preferredTime: buildDistributionData(peakWindowsMap),
      successFailure: buildDistributionData(outcomeMap),
    };
  }, [bookings, timeframe]);

  const selectedConfig = REPORTS.find((report) => report.key === selectedReport) || REPORTS[0];

  const safeChartView = selectedConfig.views.includes(chartView)
    ? chartView
    : selectedConfig.views[0];

  const selectedData = computed[selectedReport] || [];

  return (
    <div className="min-h-screen bg-[#ffffff] px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-2xl md:max-w-5xl lg:max-w-6xl">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[#3878c2]">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center"
              aria-label="Go back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </button>
            <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs ${
            isUsingDummyData
              ? 'border-[#f59e0b] bg-[#fff7ed] text-[#b45309]'
              : 'border-[#3878c2] bg-[#eff6ff] text-[#3878c2]'
          }`}>
            Source: {isUsingDummyData ? `demo seed (${bookings.length} bookings)` : `localStorage (${bookings.length} bookings)`}
          </span>
        </header>

        <div className="mb-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-[#3878c2] bg-white p-4 shadow-sm">
            <label className="mb-1 block text-xs font-semibold uppercase text-[#3878c2]">Report</label>
            <FilterSelect
              id="reports-select"
              value={selectedReport}
              onChange={(event) => {
                const nextReport = event.target.value;
                setSelectedReport(nextReport);
                const nextConfig = REPORTS.find((report) => report.key === nextReport);
                if (nextConfig && !nextConfig.views.includes(chartView)) {
                  setChartView(nextConfig.views[0]);
                }
              }}
              options={REPORTS.map((report) => ({
                value: report.key,
                label: report.label,
              }))}
              className="w-full rounded-lg border border-[#3878c3] px-3 py-2 text-sm text-[#3878c3] focus:border-[#3878c2] focus:outline-none"
            />
          </div>

          <div className="rounded-2xl border border-[#3878c2] bg-white p-4 shadow-sm">
            <label className="mb-1 block text-xs font-semibold uppercase text-[#3878c2]">Chart Type</label>
            <div className="flex gap-2">
              {selectedConfig.views.map((view) => (
                <button
                  key={view}
                  onClick={() => setChartView(view)}
                  className={`rounded-lg px-3 py-2 text-sm capitalize transition-colors ${
                    safeChartView === view
                      ? 'bg-[#3878c2] text-white shadow-sm'
                      : 'border border-[#3878c2] bg-white text-[#3878c2] hover:bg-[#eff6ff]'
                  }`}
                >
                  {CHART_TYPE_LABELS[view]}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#3878c2] bg-white p-4 shadow-sm">
            <label className="mb-1 block text-xs font-semibold uppercase text-[#3878c2]">Timeframe</label>
            <FilterSelect
              id="reports-timeframe-select"
              value={timeframe}
              onChange={(event) => setTimeframe(event.target.value)}
              disabled={selectedReport !== 'bookingVolume'}
              options={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
              ]}
              className="w-full rounded-lg border border-[#3878c3] px-3 py-2 text-sm text-[#3878c3] focus:border-[#3878c2] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>
        </div>

        <div className="mb-2 text-sm font-semibold text-[#3878c2]">{selectedConfig.label}</div>
        <ReportChart view={safeChartView} data={selectedData} />

        <p className="mt-4 rounded-xl bg-white px-4 py-3 text-xs text-[#374151]">
          Some reports require richer booking fields (services, addons, payment method, collection/delivery times, booking status).
          The chart will populate automatically as those fields are saved in booking records.
        </p>
      </div>

      <BottomNavbar />
    </div>
  );
}
