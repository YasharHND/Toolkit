import { useEffect, useMemo, useState } from 'react';
import { Dropdown } from './Dropdown';

type EpochUnit = 'seconds' | 'milliseconds' | 'microseconds' | 'nanoseconds';
type EpochUnitChoice = 'auto' | EpochUnit;

const UNIT_OPTIONS: { value: EpochUnitChoice; label: string }[] = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'seconds', label: 'Seconds (s)' },
  { value: 'milliseconds', label: 'Milliseconds (ms)' },
  { value: 'microseconds', label: 'Microseconds (μs)' },
  { value: 'nanoseconds', label: 'Nanoseconds (ns)' },
];

const UNIT_LABEL: Record<EpochUnit, string> = {
  seconds: 'Seconds',
  milliseconds: 'Milliseconds',
  microseconds: 'Microseconds',
  nanoseconds: 'Nanoseconds',
};

// Pick whichever unit, when applied, produces an instant closest to "now".
// Falls back to seconds for tiny values (e.g. `0` or test fixtures) where
// every unit lands far from now and the choice is essentially arbitrary.
function detectEpochUnit(value: number): EpochUnit {
  const now = Date.now();
  const candidates: [EpochUnit, number][] = [
    ['seconds', 1000],
    ['milliseconds', 1],
    ['microseconds', 1 / 1000],
    ['nanoseconds', 1 / 1_000_000],
  ];
  let best: EpochUnit = 'seconds';
  let bestDistance = Infinity;
  for (const [unit, msPerUnit] of candidates) {
    const distance = Math.abs(value * msPerUnit - now);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = unit;
    }
  }
  return best;
}

function parseEpochToMillis(raw: string, unit: EpochUnit): number | null {
  if (!/^-?\d+(?:\.\d+)?$/.test(raw)) return null;
  if (raw.includes('.')) {
    const num = Number(raw);
    if (!Number.isFinite(num)) return null;
    switch (unit) {
      case 'seconds':
        return num * 1000;
      case 'milliseconds':
        return num;
      case 'microseconds':
        return num / 1000;
      case 'nanoseconds':
        return num / 1_000_000;
    }
  }
  const big = BigInt(raw);
  let millisBig: bigint;
  switch (unit) {
    case 'seconds':
      millisBig = big * 1_000n;
      break;
    case 'milliseconds':
      millisBig = big;
      break;
    case 'microseconds':
      millisBig = big / 1_000n;
      break;
    case 'nanoseconds':
      millisBig = big / 1_000_000n;
      break;
  }
  const num = Number(millisBig);
  return Number.isFinite(num) ? num : null;
}

function formatMillisAs(millis: number, unit: EpochUnit): string {
  const truncated = Math.trunc(millis);
  switch (unit) {
    case 'seconds':
      return String(Math.trunc(truncated / 1000));
    case 'milliseconds':
      return String(truncated);
    case 'microseconds':
      return String(BigInt(truncated) * 1_000n);
    case 'nanoseconds':
      return String(BigInt(truncated) * 1_000_000n);
  }
}

function tzOffsetMillis(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts: Record<string, string> = {};
  dtf.formatToParts(date).forEach((p) => {
    if (p.type !== 'literal') parts[p.type] = p.value;
  });
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  const instantSeconds = Math.floor(date.getTime() / 1000) * 1000;
  return asUtc - instantSeconds;
}

function offsetToString(offsetMillis: number): string {
  const sign = offsetMillis >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMillis);
  const h = Math.floor(abs / 3_600_000);
  const m = Math.floor((abs % 3_600_000) / 60_000);
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

type Components = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
  fractionalSecond: string;
  weekday: string;
};

function formatComponents(date: Date, timeZone: string): Components {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    weekday: 'long',
  });
  const parts: Record<string, string> = {};
  dtf.formatToParts(date).forEach((p) => {
    if (p.type !== 'literal') parts[p.type] = p.value;
  });
  return {
    year: parts.year ?? '',
    month: parts.month ?? '',
    day: parts.day ?? '',
    hour: parts.hour ?? '',
    minute: parts.minute ?? '',
    second: parts.second ?? '',
    fractionalSecond: parts.fractionalSecond ?? '000',
    weekday: parts.weekday ?? '',
  };
}

function isoInZone(date: Date, timeZone: string): string {
  const c = formatComponents(date, timeZone);
  const offset = tzOffsetMillis(date, timeZone);
  const tail = offset === 0 ? 'Z' : offsetToString(offset);
  return `${c.year}-${c.month}-${c.day}T${c.hour}:${c.minute}:${c.second}.${c.fractionalSecond}${tail}`;
}

function rfc2822In(date: Date, timeZone: string): string {
  const c = formatComponents(date, timeZone);
  const dayShort = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date);
  const monthShort = new Intl.DateTimeFormat('en-US', { timeZone, month: 'short' }).format(date);
  const offset = offsetToString(tzOffsetMillis(date, timeZone)).replace(':', '');
  return `${dayShort}, ${c.day} ${monthShort} ${c.year} ${c.hour}:${c.minute}:${c.second} ${offset}`;
}

function localeIn(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    dateStyle: 'full',
    timeStyle: 'long',
  }).format(date);
}

function dayOfYear(date: Date, timeZone: string): number {
  const c = formatComponents(date, timeZone);
  const start = Date.UTC(Number(c.year), 0, 1);
  const here = Date.UTC(Number(c.year), Number(c.month) - 1, Number(c.day));
  return Math.floor((here - start) / 86_400_000) + 1;
}

function isoWeekOfYear(date: Date, timeZone: string): { week: number; weekYear: number } {
  const c = formatComponents(date, timeZone);
  const target = new Date(Date.UTC(Number(c.year), Number(c.month) - 1, Number(c.day)));
  const dow = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dow + 3);
  const weekYear = target.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(weekYear, 0, 4));
  const diff = (target.getTime() - firstThursday.getTime()) / 86_400_000;
  return { week: Math.floor(diff / 7) + 1, weekYear };
}

function relativeTime(targetMs: number, nowMs: number): string {
  const diff = targetMs - nowMs;
  const abs = Math.abs(diff);
  if (abs < 1000) return 'just now';
  const future = diff > 0;
  const units: [number, string][] = [
    [31_536_000_000, 'year'],
    [2_592_000_000, 'month'],
    [86_400_000, 'day'],
    [3_600_000, 'hour'],
    [60_000, 'minute'],
    [1_000, 'second'],
  ];
  for (const [size, label] of units) {
    if (abs >= size) {
      const n = Math.floor(abs / size);
      const noun = n === 1 ? label : `${label}s`;
      return future ? `in ${n} ${noun}` : `${n} ${noun} ago`;
    }
  }
  return 'just now';
}

const DATETIME_LOCAL_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;

type WallClock = { y: number; mo: number; d: number; h: number; mi: number; s: number; ms: number };

function parseDatetimeLocal(value: string): WallClock | null {
  const m = DATETIME_LOCAL_PATTERN.exec(value);
  if (!m) return null;
  return {
    y: Number(m[1]),
    mo: Number(m[2]),
    d: Number(m[3]),
    h: Number(m[4]),
    mi: Number(m[5]),
    s: m[6] ? Number(m[6]) : 0,
    ms: m[7] ? Number(m[7].padEnd(3, '0')) : 0,
  };
}

function wallClockToEpochMillis(c: WallClock, timeZone: string): number {
  const guess = Date.UTC(c.y, c.mo - 1, c.d, c.h, c.mi, c.s, c.ms);
  const offset = tzOffsetMillis(new Date(guess), timeZone);
  return guess - offset;
}

function nowAsDatetimeLocal(date: Date, timeZone: string): string {
  const c = formatComponents(date, timeZone);
  return `${c.year}-${c.month}-${c.day}T${c.hour}:${c.minute}:${c.second}.${c.fractionalSecond}`;
}

const PANEL_CLASS = 'rounded-xl border border-zinc-600 bg-zinc-700 p-6 shadow-xl';
const ROW_CLASS = 'flex items-center gap-3 rounded-lg bg-zinc-800 px-4 py-3';
const LABEL_CLASS = 'text-sm font-medium text-zinc-400 w-32 flex-shrink-0';
const VALUE_CLASS = 'font-mono text-sm text-white truncate flex-1 min-w-0';
const COPY_BTN_CLASS =
  'rounded-md px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-600 hover:text-white transition-colors flex-shrink-0';
const COPIED_BTN_CLASS =
  'rounded-md bg-orange-600 px-2.5 py-1 text-xs font-medium text-white flex-shrink-0';
const INPUT_CLASS =
  'w-full rounded-lg border border-zinc-500 bg-zinc-600 px-4 py-3 font-mono text-sm text-white placeholder-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50';
const SECONDARY_BTN_CLASS =
  'rounded-lg border border-zinc-500 bg-zinc-600 px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-400 hover:bg-zinc-500 hover:text-white';

function Row({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className={ROW_CLASS}>
      <span className={LABEL_CLASS}>{label}</span>
      <span className={VALUE_CLASS}>{value}</span>
      <button onClick={onCopy} className={copied ? COPIED_BTN_CLASS : COPY_BTN_CLASS}>
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

export function TimestampConverter() {
  const [tick, setTick] = useState(() => Date.now());
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setTick(Date.now()), 100);
    return () => clearInterval(id);
  }, [paused]);

  const localTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const [tz, setTz] = useState(localTz);
  const allZones = useMemo(() => {
    const supportedFn = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] })
      .supportedValuesOf;
    const supported = supportedFn ? supportedFn('timeZone') : [];
    return Array.from(new Set(['UTC', localTz, ...supported]));
  }, [localTz]);

  const [epochInput, setEpochInput] = useState('');
  const [epochUnitChoice, setEpochUnitChoice] = useState<EpochUnitChoice>('auto');
  const [humanInput, setHumanInput] = useState('');

  const [copied, setCopied] = useState<string | null>(null);
  const copy = (key: string, value: string) => {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(key);
      setTimeout(() => setCopied((prev) => (prev === key ? null : prev)), 1500);
    });
  };

  const nowDate = useMemo(() => new Date(tick), [tick]);

  type EpochResult =
    | { kind: 'ok'; date: Date; unit: EpochUnit; millis: number }
    | { kind: 'err'; error: string };
  type HumanResult = { kind: 'ok'; date: Date; millis: number } | { kind: 'err'; error: string };

  const epochResult = useMemo<EpochResult | null>(() => {
    const trimmed = epochInput.trim();
    if (!trimmed) return null;
    const probeUnit: EpochUnit =
      epochUnitChoice === 'auto' ? detectEpochUnit(Number(trimmed)) : epochUnitChoice;
    const millis = parseEpochToMillis(trimmed, probeUnit);
    if (millis === null) return { kind: 'err', error: 'Enter a valid number' };
    if (Math.abs(millis) > 8.64e15) return { kind: 'err', error: 'Outside JavaScript Date range' };
    return { kind: 'ok', date: new Date(millis), unit: probeUnit, millis };
  }, [epochInput, epochUnitChoice]);

  const humanResult = useMemo<HumanResult | null>(() => {
    const trimmed = humanInput.trim();
    if (!trimmed) return null;
    const parsed = parseDatetimeLocal(trimmed);
    if (!parsed) return { kind: 'err', error: 'Use format YYYY-MM-DDTHH:MM:SS.sss' };
    const millis = wallClockToEpochMillis(parsed, tz);
    if (Math.abs(millis) > 8.64e15) return { kind: 'err', error: 'Outside JavaScript Date range' };
    return { kind: 'ok', date: new Date(millis), millis };
  }, [humanInput, tz]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className={PANEL_CLASS}>
        <h2 className="mb-2 text-2xl font-bold text-white">Timestamp Converter</h2>
        <p className="text-sm text-zinc-400">
          Convert between epoch values (seconds, ms, μs, ns) and human-readable dates with full
          timezone support.
        </p>
      </div>

      <div className={PANEL_CLASS}>
        <label className="mb-2 block text-sm font-medium text-zinc-300">Timezone</label>
        <Dropdown
          options={allZones.map((z) => ({ value: z, label: z }))}
          value={tz}
          onChange={setTz}
          placeholder="Select a timezone"
          searchable
          searchPlaceholder="Search timezones…"
        />
        <p className="mt-2 text-xs text-zinc-500">
          Detected: {localTz}
          {tz !== localTz && (
            <button
              onClick={() => setTz(localTz)}
              className="ml-2 text-orange-400 hover:text-orange-300"
            >
              reset
            </button>
          )}
          <span className="ml-2 text-zinc-600">·</span>
          <span className="ml-2">UTC offset: {offsetToString(tzOffsetMillis(nowDate, tz))}</span>
        </p>
      </div>

      <div className={PANEL_CLASS}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Current Time</h3>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-xs text-zinc-400">
              <span
                className={`h-2 w-2 rounded-full ${
                  paused ? 'bg-zinc-500' : 'animate-pulse bg-orange-500'
                }`}
              />
              {paused ? 'paused' : 'live'}
            </span>
            <button
              onClick={() => setPaused((p) => !p)}
              className="rounded-md border border-zinc-500 bg-zinc-600 px-3 py-1 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-400 hover:bg-zinc-500 hover:text-white"
            >
              {paused ? 'Resume' : 'Pause'}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Row
            label="ISO 8601"
            value={isoInZone(nowDate, tz)}
            copied={copied === 'now-iso'}
            onCopy={() => copy('now-iso', isoInZone(nowDate, tz))}
          />
          <Row
            label="ISO 8601 UTC"
            value={nowDate.toISOString()}
            copied={copied === 'now-iso-utc'}
            onCopy={() => copy('now-iso-utc', nowDate.toISOString())}
          />
          <Row
            label="RFC 2822"
            value={rfc2822In(nowDate, tz)}
            copied={copied === 'now-rfc'}
            onCopy={() => copy('now-rfc', rfc2822In(nowDate, tz))}
          />
          <Row
            label="Locale"
            value={localeIn(nowDate, tz)}
            copied={copied === 'now-loc'}
            onCopy={() => copy('now-loc', localeIn(nowDate, tz))}
          />
          <Row
            label="Seconds"
            value={formatMillisAs(tick, 'seconds')}
            copied={copied === 'now-s'}
            onCopy={() => copy('now-s', formatMillisAs(tick, 'seconds'))}
          />
          <Row
            label="Milliseconds"
            value={formatMillisAs(tick, 'milliseconds')}
            copied={copied === 'now-ms'}
            onCopy={() => copy('now-ms', formatMillisAs(tick, 'milliseconds'))}
          />
          <Row
            label="Microseconds"
            value={formatMillisAs(tick, 'microseconds')}
            copied={copied === 'now-us'}
            onCopy={() => copy('now-us', formatMillisAs(tick, 'microseconds'))}
          />
          <Row
            label="Nanoseconds"
            value={formatMillisAs(tick, 'nanoseconds')}
            copied={copied === 'now-ns'}
            onCopy={() => copy('now-ns', formatMillisAs(tick, 'nanoseconds'))}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => setEpochInput(formatMillisAs(Date.now(), 'milliseconds'))}
            className={SECONDARY_BTN_CLASS}
          >
            Use now in Epoch input
          </button>
          <button
            onClick={() => setHumanInput(nowAsDatetimeLocal(new Date(), tz))}
            className={SECONDARY_BTN_CLASS}
          >
            Use now in Human input
          </button>
        </div>
      </div>

      <div className={PANEL_CLASS}>
        <h3 className="mb-4 text-lg font-semibold text-white">Epoch → Human</h3>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={epochInput}
            onChange={(e) => setEpochInput(e.target.value)}
            placeholder="e.g. 1762083045123"
            className={`${INPUT_CLASS} flex-1`}
            inputMode="numeric"
          />
          <div className="sm:w-56">
            <Dropdown
              options={UNIT_OPTIONS}
              value={epochUnitChoice}
              onChange={(v) => setEpochUnitChoice(v as EpochUnitChoice)}
            />
          </div>
        </div>
        {epochResult?.kind === 'err' && (
          <p className="mb-4 text-sm text-red-400">{epochResult.error}</p>
        )}
        {epochResult?.kind === 'ok' && (
          <div className="space-y-2">
            {epochUnitChoice === 'auto' && (
              <p className="px-1 text-xs text-zinc-500">
                Detected unit:{' '}
                <span className="font-medium text-orange-400">{UNIT_LABEL[epochResult.unit]}</span>
              </p>
            )}
            <Row
              label="ISO 8601"
              value={isoInZone(epochResult.date, tz)}
              copied={copied === 'eh-iso'}
              onCopy={() => copy('eh-iso', isoInZone(epochResult.date, tz))}
            />
            <Row
              label="ISO 8601 UTC"
              value={epochResult.date.toISOString()}
              copied={copied === 'eh-iso-utc'}
              onCopy={() => copy('eh-iso-utc', epochResult.date.toISOString())}
            />
            <Row
              label="RFC 2822"
              value={rfc2822In(epochResult.date, tz)}
              copied={copied === 'eh-rfc'}
              onCopy={() => copy('eh-rfc', rfc2822In(epochResult.date, tz))}
            />
            <Row
              label="Locale"
              value={localeIn(epochResult.date, tz)}
              copied={copied === 'eh-loc'}
              onCopy={() => copy('eh-loc', localeIn(epochResult.date, tz))}
            />
            <Row
              label="Day of week"
              value={formatComponents(epochResult.date, tz).weekday}
              copied={copied === 'eh-dow'}
              onCopy={() => copy('eh-dow', formatComponents(epochResult.date, tz).weekday)}
            />
            <Row
              label="Day of year"
              value={String(dayOfYear(epochResult.date, tz))}
              copied={copied === 'eh-doy'}
              onCopy={() => copy('eh-doy', String(dayOfYear(epochResult.date, tz)))}
            />
            <Row
              label="ISO week"
              value={(() => {
                const w = isoWeekOfYear(epochResult.date, tz);
                return `${w.weekYear}-W${String(w.week).padStart(2, '0')}`;
              })()}
              copied={copied === 'eh-week'}
              onCopy={() => {
                const w = isoWeekOfYear(epochResult.date, tz);
                copy('eh-week', `${w.weekYear}-W${String(w.week).padStart(2, '0')}`);
              }}
            />
            <Row
              label="Relative"
              value={relativeTime(epochResult.date.getTime(), tick)}
              copied={copied === 'eh-rel'}
              onCopy={() => copy('eh-rel', relativeTime(epochResult.date.getTime(), tick))}
            />
          </div>
        )}
      </div>

      <div className={PANEL_CLASS}>
        <h3 className="mb-4 text-lg font-semibold text-white">Human → Epoch</h3>
        <div className="mb-4">
          <label htmlFor="human-input" className="mb-2 block text-sm font-medium text-zinc-300">
            Wall-clock date in {tz}
          </label>
          <input
            id="human-input"
            value={humanInput}
            onChange={(e) => setHumanInput(e.target.value)}
            placeholder="2026-05-02T14:30:45.123"
            className={INPUT_CLASS}
          />
          <p className="mt-1 text-xs text-zinc-500">Format: YYYY-MM-DDTHH:MM:SS.sss</p>
        </div>
        {humanResult?.kind === 'err' && (
          <p className="mb-4 text-sm text-red-400">{humanResult.error}</p>
        )}
        {humanResult?.kind === 'ok' && (
          <div className="space-y-2">
            <Row
              label="Seconds"
              value={formatMillisAs(humanResult.millis, 'seconds')}
              copied={copied === 'he-s'}
              onCopy={() => copy('he-s', formatMillisAs(humanResult.millis, 'seconds'))}
            />
            <Row
              label="Milliseconds"
              value={formatMillisAs(humanResult.millis, 'milliseconds')}
              copied={copied === 'he-ms'}
              onCopy={() => copy('he-ms', formatMillisAs(humanResult.millis, 'milliseconds'))}
            />
            <Row
              label="Microseconds"
              value={formatMillisAs(humanResult.millis, 'microseconds')}
              copied={copied === 'he-us'}
              onCopy={() => copy('he-us', formatMillisAs(humanResult.millis, 'microseconds'))}
            />
            <Row
              label="Nanoseconds"
              value={formatMillisAs(humanResult.millis, 'nanoseconds')}
              copied={copied === 'he-ns'}
              onCopy={() => copy('he-ns', formatMillisAs(humanResult.millis, 'nanoseconds'))}
            />
            <Row
              label="ISO 8601 UTC"
              value={humanResult.date.toISOString()}
              copied={copied === 'he-iso'}
              onCopy={() => copy('he-iso', humanResult.date.toISOString())}
            />
            <Row
              label="Relative"
              value={relativeTime(humanResult.date.getTime(), tick)}
              copied={copied === 'he-rel'}
              onCopy={() => copy('he-rel', relativeTime(humanResult.date.getTime(), tick))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
