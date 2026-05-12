import { useEffect, useMemo, useState } from 'react';
import { Dropdown } from './Dropdown';

type Mode = 'decode' | 'verify' | 'sign';

type HsAlg = 'HS256' | 'HS384' | 'HS512';
type RsAlg = 'RS256' | 'RS384' | 'RS512';
type EsAlg = 'ES256' | 'ES384' | 'ES512';
type Alg = HsAlg | RsAlg | EsAlg | 'none';

const ALG_OPTIONS: { value: Alg; label: string; family: 'HMAC' | 'RSA' | 'ECDSA' | 'none' }[] = [
  { value: 'HS256', label: 'HS256 — HMAC + SHA-256', family: 'HMAC' },
  { value: 'HS384', label: 'HS384 — HMAC + SHA-384', family: 'HMAC' },
  { value: 'HS512', label: 'HS512 — HMAC + SHA-512', family: 'HMAC' },
  { value: 'RS256', label: 'RS256 — RSA + SHA-256', family: 'RSA' },
  { value: 'RS384', label: 'RS384 — RSA + SHA-384', family: 'RSA' },
  { value: 'RS512', label: 'RS512 — RSA + SHA-512', family: 'RSA' },
  { value: 'ES256', label: 'ES256 — ECDSA P-256 + SHA-256', family: 'ECDSA' },
  { value: 'ES384', label: 'ES384 — ECDSA P-384 + SHA-384', family: 'ECDSA' },
  { value: 'ES512', label: 'ES512 — ECDSA P-521 + SHA-512', family: 'ECDSA' },
  { value: 'none', label: 'none — unsigned (debug only)', family: 'none' },
];

function algFamily(alg: Alg): 'HMAC' | 'RSA' | 'ECDSA' | 'none' {
  return ALG_OPTIONS.find((o) => o.value === alg)?.family ?? 'none';
}

function asArrayBuffer(u: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(u.byteLength);
  new Uint8Array(ab).set(u);
  return ab;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function base64UrlEncodeString(s: string): string {
  return base64UrlEncode(new TextEncoder().encode(s));
}

function base64UrlDecodeString(s: string): string {
  return new TextDecoder().decode(base64UrlDecode(s));
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const body = pem
    .trim()
    .split('\n')
    .filter((l) => !l.startsWith('-----'))
    .join('')
    .replace(/\s/g, '');
  const bin = atob(body);
  const buf = new ArrayBuffer(bin.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
  return buf;
}

function ecNamedCurve(alg: EsAlg): 'P-256' | 'P-384' | 'P-521' {
  return alg === 'ES256' ? 'P-256' : alg === 'ES384' ? 'P-384' : 'P-521';
}

function hashName(alg: HsAlg | RsAlg | EsAlg): 'SHA-256' | 'SHA-384' | 'SHA-512' {
  if (alg === 'ES512') return 'SHA-512';
  const bits = alg.slice(2);
  return bits === '256' ? 'SHA-256' : bits === '384' ? 'SHA-384' : 'SHA-512';
}

async function signBytes(alg: Alg, keyMaterial: string, data: Uint8Array): Promise<Uint8Array> {
  if (alg === 'none') return new Uint8Array();
  const family = algFamily(alg);

  const buf = asArrayBuffer(data);

  if (family === 'HMAC') {
    const key = await crypto.subtle.importKey(
      'raw',
      asArrayBuffer(new TextEncoder().encode(keyMaterial)),
      { name: 'HMAC', hash: hashName(alg as HsAlg) },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, buf);
    return new Uint8Array(sig);
  }

  if (family === 'RSA') {
    const key = await crypto.subtle.importKey(
      'pkcs8',
      pemToArrayBuffer(keyMaterial),
      { name: 'RSASSA-PKCS1-v1_5', hash: hashName(alg as RsAlg) },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, buf);
    return new Uint8Array(sig);
  }

  if (family === 'ECDSA') {
    const key = await crypto.subtle.importKey(
      'pkcs8',
      pemToArrayBuffer(keyMaterial),
      { name: 'ECDSA', namedCurve: ecNamedCurve(alg as EsAlg) },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: hashName(alg as EsAlg) }, key, buf);
    return new Uint8Array(sig);
  }

  throw new Error(`Unsupported algorithm: ${alg}`);
}

async function verifyBytes(
  alg: Alg,
  keyMaterial: string,
  data: Uint8Array,
  signature: Uint8Array
): Promise<boolean> {
  if (alg === 'none') return false;
  const family = algFamily(alg);
  const dataBuf = asArrayBuffer(data);
  const sigBuf = asArrayBuffer(signature);

  if (family === 'HMAC') {
    const key = await crypto.subtle.importKey(
      'raw',
      asArrayBuffer(new TextEncoder().encode(keyMaterial)),
      { name: 'HMAC', hash: hashName(alg as HsAlg) },
      false,
      ['verify']
    );
    return crypto.subtle.verify('HMAC', key, sigBuf, dataBuf);
  }

  if (family === 'RSA') {
    const key = await crypto.subtle.importKey(
      'spki',
      pemToArrayBuffer(keyMaterial),
      { name: 'RSASSA-PKCS1-v1_5', hash: hashName(alg as RsAlg) },
      false,
      ['verify']
    );
    return crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sigBuf, dataBuf);
  }

  if (family === 'ECDSA') {
    const key = await crypto.subtle.importKey(
      'spki',
      pemToArrayBuffer(keyMaterial),
      { name: 'ECDSA', namedCurve: ecNamedCurve(alg as EsAlg) },
      false,
      ['verify']
    );
    return crypto.subtle.verify(
      { name: 'ECDSA', hash: hashName(alg as EsAlg) },
      key,
      sigBuf,
      dataBuf
    );
  }

  return false;
}

type DecodedJwt = {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  signedData: Uint8Array;
  signatureBytes: Uint8Array;
};

function decodeJwt(token: string): DecodedJwt | { error: string } {
  const parts = token.trim().split('.');
  if (parts.length !== 3) return { error: 'JWT must have exactly three dot-separated parts' };
  const [headerB64, payloadB64, signatureB64] = parts;
  try {
    const header = JSON.parse(base64UrlDecodeString(headerB64));
    const payload = JSON.parse(base64UrlDecodeString(payloadB64));
    if (typeof header !== 'object' || header === null)
      return { error: 'Header is not a JSON object' };
    if (typeof payload !== 'object' || payload === null)
      return { error: 'Payload is not a JSON object' };
    const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signatureBytes = base64UrlDecode(signatureB64);
    return {
      header: header as Record<string, unknown>,
      payload: payload as Record<string, unknown>,
      signature: signatureB64,
      signedData,
      signatureBytes,
    };
  } catch (e) {
    return { error: `Failed to decode: ${e instanceof Error ? e.message : 'unknown error'}` };
  }
}

type ClaimCheck = { name: string; status: 'ok' | 'warn' | 'fail'; message: string };

function relativeSeconds(seconds: number): string {
  const abs = Math.abs(seconds);
  if (abs < 60) return `${Math.round(abs)}s`;
  if (abs < 3600) return `${Math.round(abs / 60)}m`;
  if (abs < 86400) return `${Math.round(abs / 3600)}h`;
  return `${Math.round(abs / 86400)}d`;
}

const CLAIM_LEEWAY_SECONDS = 60;

function validateClaims(payload: Record<string, unknown>, nowSeconds: number): ClaimCheck[] {
  const checks: ClaimCheck[] = [];

  if (typeof payload.exp === 'number') {
    const delta = payload.exp - nowSeconds;
    if (delta < 0) {
      checks.push({
        name: 'exp',
        status: 'warn',
        message: `expired ${relativeSeconds(delta)} ago`,
      });
    } else {
      checks.push({
        name: 'exp',
        status: 'ok',
        message: `expires in ${relativeSeconds(delta)}`,
      });
    }
  }

  if (typeof payload.nbf === 'number') {
    const delta = payload.nbf - nowSeconds;
    if (delta > CLAIM_LEEWAY_SECONDS) {
      checks.push({
        name: 'nbf',
        status: 'fail',
        message: `not valid for another ${relativeSeconds(delta)}`,
      });
    } else {
      checks.push({ name: 'nbf', status: 'ok', message: 'not-before satisfied' });
    }
  }

  if (typeof payload.iat === 'number') {
    const delta = payload.iat - nowSeconds;
    if (delta > CLAIM_LEEWAY_SECONDS) {
      checks.push({
        name: 'iat',
        status: 'warn',
        message: `issued ${relativeSeconds(delta)} in the future`,
      });
    } else {
      checks.push({
        name: 'iat',
        status: 'ok',
        message: `issued ${relativeSeconds(-delta)} ago`,
      });
    }
  }

  if (typeof payload.iss === 'string') {
    checks.push({ name: 'iss', status: 'ok', message: payload.iss });
  }
  if (typeof payload.aud === 'string') {
    checks.push({ name: 'aud', status: 'ok', message: payload.aud });
  } else if (Array.isArray(payload.aud)) {
    checks.push({ name: 'aud', status: 'ok', message: payload.aud.join(', ') });
  }
  if (typeof payload.sub === 'string') {
    checks.push({ name: 'sub', status: 'ok', message: payload.sub });
  }
  if (typeof payload.jti === 'string') {
    checks.push({ name: 'jti', status: 'ok', message: payload.jti });
  }

  return checks;
}

const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
const SAMPLE_HMAC_SECRET = 'your-256-bit-secret';

const SAMPLE_RSA_PUBLIC = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAytSC8zzOrAaSC62N+7pT
76h+Tx6cS85G5mDC6dpyfnnErLGqpwmXzqRlCe+p6OkXksIdbnAfb7AFGRHlbTJd
1zTlRJfMvcJJ226pm+upyElvKe84HvUx97Hkbj0zVtznoXjVEy5FrzyXiSCAJli7
/Lmsa7sdi/PfUzPS/KOHirFKMxZ2frZUFolEPk1x8swXBe78X9JYFlQWFOUEkAvN
7B3tXbn7PFmrVeKhcQQxxGw0+5YhINCmB6vN+44lrHprzF58FI2432IFAav6aKm3
wA3R3onGvpZbJvv84Tml5q5eVZ7vi6vcKhIPXl5kD78tiQ2pYld3sGlpbv2CR0vW
nQIDAQAB
-----END PUBLIC KEY-----`;

const SAMPLE_RSA_PRIVATE = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDK1ILzPM6sBpIL
rY37ulPvqH5PHpxLzkbmYMLp2nJ+ecSssaqnCZfOpGUJ76no6ReSwh1ucB9vsAUZ
EeVtMl3XNOVEl8y9wknbbqmb66nISW8p7zge9TH3seRuPTNW3OeheNUTLkWvPJeJ
IIAmWLv8uaxrux2L899TM9L8o4eKsUozFnZ+tlQWiUQ+TXHyzBcF7vxf0lgWVBYU
5QSQC83sHe1dufs8WatV4qFxBDHEbDT7liEg0KYHq837jiWsemvMXnwUjbjfYgUB
q/poqbfADdHeica+llsm+/zhOaXmrl5Vnu+Lq9wqEg9eXmQPvy2JDaliV3ewaWlu
/YJHS9adAgMBAAECggEAJ639VEKAGA1NAvXYAfgItajb1PSjFP1sx2MEnqU6ot2F
iVdUkEsDJMzqa1A0iDkZgH9zLIjIzZu805O5s2wYCaLye0HLLxBUTJZQng0zcNhU
4/pFm2DSfqeRjbNxWLvsoJ036gGyZj7PUmdGSrovRJi6T3USqa9y8B8CVqRTPuFo
wSI0beF4zaWfjoA1uoFrwATd3F7Zvkd3XZ7E/dEQAQaWvE3cWDy8qRg67wl1lAde
vweeEkxTyT3mQ5DXXZjLv7jm1Z9Crkezdy33PDVt3vdxMp2eID3Q7fZ+173U3wXy
IzIDOYZeLyzFDKDPFmYVVYErbX/0O4oMPx4/UpyJjQKBgQD1Up/as5FeahUGukB5
YbDXWNSoRBeaUf0T6qgIIkN9g6+hpk0dwRteYz+Qsgff8DPrg491BHhQHOSRyH2/
BbeMAkJpggFiPs4zXfc4WtCG4TEoyXdjEpmmJXmoZRzQH6BwCxnog4F6Bg7BGtc3
SsJGdDX1b5Boi5GWSGiHKt9XRwKBgQDTqG+g9p1yxBtSdX/MSQBylXgjFYFkoW7W
IrAa3f9OtX4YOR7cM5lpw45wTc2vEPYUgfuCM3/E7HEbOWlbPcpLitcnjC0/kwMU
2gIkjIwYhcgmnX3gzzDHOG40+MZOBe9WejLLQlu1UDinWYPJP6SsOellLyagsfxj
nEJOxs6c+wKBgCcktN73kfVnpc06ALmdbdMemGf03XNBK8l2wrLxjKVFUsvPNjTO
MCjCW00iKwF/WTl193jraqsVwR7Fx9Kn/d54KdKd7MyZStuFXcH/M5Ch8+8XHlaP
jDaneh71a0CGG1plWw/vk8Q9nTMQrlBjPFZzinyL/ZXA100MZqlSnOpXAoGAGNoL
GVw7inEqQBlZwxPDQLD6JSxuP/GQgQYbpVvxkT1QK+nxDKvmVHvIqrkH8IlOS4Qj
ktsXInkcorSwAS2VJh+MObGE0pUhZH5giAgUnwB+SsJtOEs7j/i5P/EB38Fko8O/
WQxWlkhwDn49MhEN9cbq9518rJuZZdzAEF3ZfqcCgYEA5+iB2P9N1XdR9GLizYmC
aLp24Ypp+IUl+0UuPo30scvMZNKQQfXsbtAgf2x2v33PdJtEY2K7XKjWOUvgBAtL
xMlX1qvYDKdI0bMBuRRWbBYSCV88QwOFvMvxJgge9lkDhNCSiJoBzMokZxXC7nOX
SR/YzrOqRna3B4XkqZlSPb4=
-----END PRIVATE KEY-----`;

const SAMPLE_EC_PUBLIC = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAETkB62evzEb0VwQrRpvnoLJ3GArrH
RWUdg95zDtmj45SwP+kzQ49DLwn7JEq1HXJvC0CHvuiLFmvqwlvzpIyWkw==
-----END PUBLIC KEY-----`;

const SAMPLE_EC_PRIVATE = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgAORYplPnpeDemoR2
TRlnfYrx7bOm2IySHx01FTZ6vCuhRANCAAROQHrZ6/MRvRXBCtGm+egsncYCusdF
ZR2D3nMO2aPjlLA/6TNDj0MvCfskSrUdcm8LQIe+6IsWa+rCW/OkjJaT
-----END PRIVATE KEY-----`;

function sampleKey(alg: Alg, role: 'sign' | 'verify'): string {
  const family = algFamily(alg);
  if (family === 'HMAC') return SAMPLE_HMAC_SECRET;
  if (family === 'RSA') return role === 'sign' ? SAMPLE_RSA_PRIVATE : SAMPLE_RSA_PUBLIC;
  if (family === 'ECDSA') return role === 'sign' ? SAMPLE_EC_PRIVATE : SAMPLE_EC_PUBLIC;
  return '';
}

const SAMPLE_HEADER_JSON = (alg: Alg) => JSON.stringify({ alg, typ: 'JWT' }, null, 2);
const SAMPLE_PAYLOAD_JSON = JSON.stringify(
  { sub: '1234567890', name: 'John Doe', iat: 1516239022 },
  null,
  2
);

function arrayBufferToPem(buf: ArrayBuffer, label: string): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);
  const lines: string[] = [];
  for (let i = 0; i < b64.length; i += 64) lines.push(b64.slice(i, i + 64));
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
}

async function derivePublicKeyPem(alg: Alg, privateKeyMaterial: string): Promise<string> {
  const family = algFamily(alg);
  if (family === 'HMAC') return privateKeyMaterial;
  if (family === 'none') return '';

  if (family === 'RSA') {
    const priv = await crypto.subtle.importKey(
      'pkcs8',
      pemToArrayBuffer(privateKeyMaterial),
      { name: 'RSASSA-PKCS1-v1_5', hash: hashName(alg as RsAlg) },
      true,
      ['sign']
    );
    const jwk = await crypto.subtle.exportKey('jwk', priv);
    const publicJwk = { kty: jwk.kty, n: jwk.n, e: jwk.e, ext: true, key_ops: ['verify'] };
    const pub = await crypto.subtle.importKey(
      'jwk',
      publicJwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: hashName(alg as RsAlg) },
      true,
      ['verify']
    );
    return arrayBufferToPem(await crypto.subtle.exportKey('spki', pub), 'PUBLIC KEY');
  }

  if (family === 'ECDSA') {
    const priv = await crypto.subtle.importKey(
      'pkcs8',
      pemToArrayBuffer(privateKeyMaterial),
      { name: 'ECDSA', namedCurve: ecNamedCurve(alg as EsAlg) },
      true,
      ['sign']
    );
    const jwk = await crypto.subtle.exportKey('jwk', priv);
    const publicJwk = {
      kty: jwk.kty,
      crv: jwk.crv,
      x: jwk.x,
      y: jwk.y,
      ext: true,
      key_ops: ['verify'],
    };
    const pub = await crypto.subtle.importKey(
      'jwk',
      publicJwk,
      { name: 'ECDSA', namedCurve: ecNamedCurve(alg as EsAlg) },
      true,
      ['verify']
    );
    return arrayBufferToPem(await crypto.subtle.exportKey('spki', pub), 'PUBLIC KEY');
  }

  return '';
}

async function generateSampleJwt(alg: Alg): Promise<string> {
  const headerB64 = base64UrlEncodeString(JSON.stringify({ alg, typ: 'JWT' }));
  const payloadB64 = base64UrlEncodeString(SAMPLE_PAYLOAD_JSON);
  if (alg === 'none') return `${headerB64}.${payloadB64}.`;
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const sig = await signBytes(alg, sampleKey(alg, 'sign'), data);
  return `${headerB64}.${payloadB64}.${base64UrlEncode(sig)}`;
}

const PANEL_CLASS = 'rounded-xl border border-zinc-600 bg-zinc-700 p-6 shadow-xl';
const INPUT_CLASS =
  'w-full rounded-lg border border-zinc-500 bg-zinc-600 px-4 py-3 font-mono text-sm text-white placeholder-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50';
const SECONDARY_BTN_CLASS =
  'rounded-lg border border-zinc-500 bg-zinc-600 px-4 py-2 text-sm font-semibold text-zinc-200 transition-colors hover:border-zinc-400 hover:bg-zinc-500 hover:text-white';

function CopyButton({ value, idKey }: { value: string; idKey: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  const onClick = () => {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(idKey);
      setTimeout(() => setCopied(null), 1500);
    });
  };
  const isCopied = copied === idKey;
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
        isCopied
          ? 'bg-orange-600 text-white'
          : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-white'
      }`}
    >
      {isCopied ? 'Copied' : 'Copy'}
    </button>
  );
}

function JsonPanel({
  title,
  value,
  segmentColor,
  segmentText,
  copyKey,
  copyValue,
}: {
  title: string;
  value: string;
  segmentColor: string;
  segmentText: string;
  copyKey: string;
  copyValue: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-600 bg-zinc-800">
      <div className="flex items-center justify-between border-b border-zinc-700 px-4 py-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 rounded-full ${segmentColor}`}
            aria-hidden="true"
          />
          <span className="text-sm font-semibold text-zinc-200">{title}</span>
          <span className="text-xs text-zinc-500">{segmentText}</span>
        </div>
        <CopyButton value={copyValue} idKey={copyKey} />
      </div>
      <pre className="overflow-auto px-4 py-3 font-mono text-sm text-zinc-100">{value}</pre>
    </div>
  );
}

function ClaimList({ checks }: { checks: ClaimCheck[] }) {
  if (checks.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No claim checks emitted. Implement <code>validateClaims</code> to surface rules here.
      </p>
    );
  }
  const dot = (status: ClaimCheck['status']) =>
    status === 'ok' ? 'bg-emerald-500' : status === 'warn' ? 'bg-amber-400' : 'bg-red-500';
  const text = (status: ClaimCheck['status']) =>
    status === 'ok' ? 'text-emerald-400' : status === 'warn' ? 'text-amber-300' : 'text-red-400';
  return (
    <ul className="space-y-2">
      {checks.map((c, i) => (
        <li key={i} className="rounded-lg bg-zinc-800 px-4 py-2.5 text-sm leading-5">
          <span
            className={`mr-3 inline-block h-2 w-2 rounded-full align-middle ${dot(c.status)}`}
          />
          <span className="font-mono text-zinc-200">{c.name}</span>
          <span className={`ml-2 ${text(c.status)}`}>{c.message}</span>
        </li>
      ))}
    </ul>
  );
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function detectAlgFromHeader(header: Record<string, unknown>): Alg | null {
  const alg = header.alg;
  if (typeof alg !== 'string') return null;
  return ALG_OPTIONS.some((o) => o.value === alg) ? (alg as Alg) : null;
}

export function JwtTool() {
  const [mode, setMode] = useState<Mode>('decode');

  // Each mode owns its own token state so "Load sample" / "Clear" are scoped.
  const [decodeToken, setDecodeToken] = useState('');
  const [verifyToken, setVerifyToken] = useState('');

  // Verify-only
  const [verifyAlg, setVerifyAlg] = useState<Alg>('HS256');
  const [verifyKey, setVerifyKey] = useState('');

  // Sign-only
  const [signAlg, setSignAlg] = useState<Alg>('HS256');
  const [signHeader, setSignHeader] = useState('');
  const [signPayload, setSignPayload] = useState('');
  const [signKey, setSignKey] = useState('');

  // "Now" for claim checks. Kept in state so render stays pure; refreshed on a timer.
  const [nowSeconds, setNowSeconds] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNowSeconds(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  type VerifyOutcome = { kind: 'valid' } | { kind: 'invalid'; reason: string };
  type VerifyState = { kind: 'idle' } | { kind: 'pending' } | VerifyOutcome;

  // Async results, tagged with the inputs they came from, so stale results are ignored.
  const [verifyAsync, setVerifyAsync] = useState<{ tag: string; outcome: VerifyOutcome } | null>(
    null
  );
  const [signAsync, setSignAsync] = useState<{
    tag: string;
    result: { jwt: string } | { error: string };
  } | null>(null);

  const decoded = useMemo(() => {
    if (mode === 'sign') return null;
    const t = mode === 'decode' ? decodeToken : verifyToken;
    if (!t.trim()) return null;
    return decodeJwt(t);
  }, [mode, decodeToken, verifyToken]);

  const claimChecks = useMemo(() => {
    if (!decoded || 'error' in decoded) return [];
    return validateClaims(decoded.payload, nowSeconds);
  }, [decoded, nowSeconds]);

  // Synchronously derived verify state. Returns 'pending' when async verification is needed.
  const initialVerifyState = useMemo<VerifyState>(() => {
    if (mode !== 'verify') return { kind: 'idle' };
    if (!decoded || 'error' in decoded) return { kind: 'idle' };
    if (verifyAlg === 'none')
      return {
        kind: 'invalid',
        reason: 'The "none" algorithm is rejected by this verifier on principle.',
      };
    if (!verifyKey.trim()) return { kind: 'idle' };
    return { kind: 'pending' };
  }, [mode, decoded, verifyAlg, verifyKey]);

  const verifyTag =
    decoded && !('error' in decoded) ? `${verifyAlg}|${verifyKey}|${decoded.signature}` : '';
  const verifyState: VerifyState =
    initialVerifyState.kind === 'pending' && verifyAsync?.tag === verifyTag
      ? verifyAsync.outcome
      : initialVerifyState;

  useEffect(() => {
    if (initialVerifyState.kind !== 'pending') return;
    if (!decoded || 'error' in decoded) return;
    const tag = verifyTag;
    let cancelled = false;
    void verifyBytes(verifyAlg, verifyKey, decoded.signedData, decoded.signatureBytes)
      .then((ok) => {
        if (cancelled) return;
        setVerifyAsync({
          tag,
          outcome: ok
            ? { kind: 'valid' }
            : { kind: 'invalid', reason: 'Signature does not match.' },
        });
      })
      .catch((e) => {
        if (cancelled) return;
        setVerifyAsync({
          tag,
          outcome: {
            kind: 'invalid',
            reason: e instanceof Error ? e.message : 'Verification failed.',
          },
        });
      });
    return () => {
      cancelled = true;
    };
  }, [initialVerifyState.kind, verifyTag, verifyAlg, verifyKey, decoded]);

  // Synchronously parse/encode the sign inputs. Returns 'ready' with base64 parts when signable.
  type SignPrep =
    | { kind: 'idle' }
    | { kind: 'error'; message: string }
    | { kind: 'ready'; headerB64: string; payloadB64: string };
  const signPrep = useMemo<SignPrep>(() => {
    if (mode !== 'sign') return { kind: 'idle' };
    if (!signHeader.trim() || !signPayload.trim()) return { kind: 'idle' };
    let headerObj: Record<string, unknown>;
    let payloadObj: Record<string, unknown>;
    try {
      headerObj = JSON.parse(signHeader);
    } catch {
      return { kind: 'error', message: 'Header is not valid JSON.' };
    }
    try {
      payloadObj = JSON.parse(signPayload);
    } catch {
      return { kind: 'error', message: 'Payload is not valid JSON.' };
    }
    if (signAlg !== 'none' && !signKey.trim()) return { kind: 'idle' };
    headerObj.alg = signAlg;
    if (!('typ' in headerObj)) headerObj.typ = 'JWT';
    const headerB64 = base64UrlEncodeString(JSON.stringify(headerObj));
    const payloadB64 = base64UrlEncodeString(JSON.stringify(payloadObj));
    return { kind: 'ready', headerB64, payloadB64 };
  }, [mode, signHeader, signPayload, signAlg, signKey]);

  const signTag =
    signPrep.kind === 'ready'
      ? `${signPrep.headerB64}|${signPrep.payloadB64}|${signAlg}|${signKey}`
      : '';

  const { signedJwt, signError } = useMemo<{ signedJwt: string; signError: string }>(() => {
    if (signPrep.kind === 'idle') return { signedJwt: '', signError: '' };
    if (signPrep.kind === 'error') return { signedJwt: '', signError: signPrep.message };
    if (signAsync?.tag === signTag) {
      if ('jwt' in signAsync.result) return { signedJwt: signAsync.result.jwt, signError: '' };
      return { signedJwt: '', signError: signAsync.result.error };
    }
    return { signedJwt: '', signError: '' };
  }, [signPrep, signAsync, signTag]);

  useEffect(() => {
    if (signPrep.kind !== 'ready') return;
    const { headerB64, payloadB64 } = signPrep;
    const tag = signTag;
    let cancelled = false;
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    void signBytes(signAlg, signKey, data)
      .then((sig) => {
        if (cancelled) return;
        setSignAsync({
          tag,
          result: { jwt: `${headerB64}.${payloadB64}.${base64UrlEncode(sig)}` },
        });
      })
      .catch((e) => {
        if (cancelled) return;
        setSignAsync({
          tag,
          result: { error: e instanceof Error ? e.message : 'Signing failed.' },
        });
      });
    return () => {
      cancelled = true;
    };
  }, [signPrep, signTag, signAlg, signKey]);

  // Setting the verify token also picks up its alg from the header.
  const setVerifyTokenAndSync = (token: string) => {
    setVerifyToken(token);
    const t = token.trim();
    if (!t) return;
    const dec = decodeJwt(t);
    if ('error' in dec) return;
    const detected = detectAlgFromHeader(dec.header);
    if (detected) setVerifyAlg(detected);
  };

  const loadSample = async () => {
    if (mode === 'decode') {
      setDecodeToken(SAMPLE_JWT);
      return;
    }
    if (mode === 'verify') {
      try {
        const jwt = await generateSampleJwt(verifyAlg);
        setVerifyTokenAndSync(jwt);
        setVerifyKey(sampleKey(verifyAlg, 'verify'));
      } catch {
        // fall back to HS256 sample if the alg's sample signing fails
        setVerifyTokenAndSync(SAMPLE_JWT);
        setVerifyKey(SAMPLE_HMAC_SECRET);
      }
      return;
    }
    if (mode === 'sign') {
      setSignHeader(SAMPLE_HEADER_JSON(signAlg));
      setSignPayload(SAMPLE_PAYLOAD_JSON);
      setSignKey(sampleKey(signAlg, 'sign'));
    }
  };

  const openInVerify = async () => {
    if (!signedJwt) return;
    setVerifyToken(signedJwt);
    setVerifyAlg(signAlg);
    if (signAlg === 'none') {
      setVerifyKey('');
    } else {
      try {
        setVerifyKey(await derivePublicKeyPem(signAlg, signKey));
      } catch {
        setVerifyKey('');
      }
    }
    setMode('verify');
  };

  const clearMode = () => {
    if (mode === 'decode') {
      setDecodeToken('');
      return;
    }
    if (mode === 'verify') {
      setVerifyToken('');
      setVerifyKey('');
      return;
    }
    if (mode === 'sign') {
      setSignHeader('');
      setSignPayload('');
      setSignKey('');
    }
  };

  const headerJson = decoded && !('error' in decoded) ? safeJsonStringify(decoded.header) : '';
  const payloadJson = decoded && !('error' in decoded) ? safeJsonStringify(decoded.payload) : '';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className={PANEL_CLASS}>
        <h2 className="mb-2 text-2xl font-bold text-white">JWT Tool</h2>
        <p className="text-sm text-zinc-400">
          Decode, verify, and sign JSON Web Tokens. All cryptography runs in your browser via the
          Web Crypto API — no token data is sent anywhere.
        </p>
      </div>

      <div className={PANEL_CLASS}>
        <label className="mb-2 block text-sm font-medium text-zinc-300">Mode</label>
        <div className="flex gap-3">
          {(['decode', 'verify', 'sign'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-lg border-2 px-4 py-3 text-center font-medium capitalize transition-colors ${
                mode === m
                  ? 'border-orange-600 bg-orange-600 text-white'
                  : 'border-zinc-500 bg-zinc-600 text-zinc-300 hover:border-orange-500 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-3 border-t border-zinc-600 pt-4">
          {(() => {
            const isJsonValid = (s: string) => {
              try {
                JSON.parse(s);
                return true;
              } catch {
                return false;
              }
            };
            const allInputsValid =
              mode === 'decode'
                ? !!decoded && !('error' in decoded)
                : mode === 'verify'
                  ? !!decoded && !('error' in decoded) && verifyKey.trim().length > 0
                  : isJsonValid(signHeader) &&
                    isJsonValid(signPayload) &&
                    (signAlg === 'none' || signKey.trim().length > 0);
            if (allInputsValid) return null;
            return (
              <button onClick={() => void loadSample()} className={SECONDARY_BTN_CLASS}>
                Load sample
              </button>
            );
          })()}
          <button onClick={clearMode} className={SECONDARY_BTN_CLASS}>
            Clear
          </button>
        </div>
      </div>

      {mode !== 'sign' && (
        <div className={PANEL_CLASS}>
          <label htmlFor="jwt-input" className="mb-2 block text-sm font-medium text-zinc-300">
            JWT
          </label>
          <textarea
            id="jwt-input"
            value={mode === 'decode' ? decodeToken : verifyToken}
            onChange={(e) => {
              const v = e.target.value;
              if (mode === 'decode') setDecodeToken(v);
              else setVerifyTokenAndSync(v);
            }}
            placeholder="Paste a JWT (header.payload.signature)…"
            rows={4}
            className={`${INPUT_CLASS} resize-none break-all`}
          />
          {decoded && 'error' in decoded && (
            <p className="mt-2 text-sm text-red-400">{decoded.error}</p>
          )}
        </div>
      )}

      {mode === 'verify' && decoded && !('error' in decoded) && (
        <div className={PANEL_CLASS}>
          <h3 className="mb-4 text-lg font-semibold text-white">Verification</h3>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-zinc-300">Algorithm</label>
            <Dropdown
              options={ALG_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              value={verifyAlg}
              onChange={(v) => setVerifyAlg(v as Alg)}
            />
            {detectAlgFromHeader(decoded.header) &&
              detectAlgFromHeader(decoded.header) !== verifyAlg && (
                <p className="mt-1 text-xs text-amber-300">
                  Header says alg={String(decoded.header.alg)}, you&apos;ve selected {verifyAlg}. A
                  mismatch always fails verification.
                </p>
              )}
          </div>
          <div className="mb-4">
            <label htmlFor="verify-key" className="mb-2 block text-sm font-medium text-zinc-300">
              {algFamily(verifyAlg) === 'HMAC' ? 'Secret' : 'Public key (PEM, SPKI)'}
            </label>
            <textarea
              id="verify-key"
              value={verifyKey}
              onChange={(e) => setVerifyKey(e.target.value)}
              placeholder={
                algFamily(verifyAlg) === 'HMAC'
                  ? 'your-256-bit-secret'
                  : '-----BEGIN PUBLIC KEY-----\n…\n-----END PUBLIC KEY-----'
              }
              rows={algFamily(verifyAlg) === 'HMAC' ? 2 : 9}
              className={`${INPUT_CLASS} resize-none`}
            />
          </div>
          <div className="rounded-lg bg-zinc-800 px-4 py-3">
            {verifyState.kind === 'idle' && (
              <p className="text-sm text-zinc-400">Provide a key to verify.</p>
            )}
            {verifyState.kind === 'pending' && <p className="text-sm text-zinc-300">Verifying…</p>}
            {verifyState.kind === 'valid' && (
              <p className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                Signature verified
              </p>
            )}
            {verifyState.kind === 'invalid' && (
              <p className="flex items-center gap-2 text-sm font-medium text-red-400">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                {verifyState.reason}
              </p>
            )}
          </div>
        </div>
      )}

      {mode !== 'sign' && decoded && !('error' in decoded) && (
        <div className={PANEL_CLASS}>
          <h3 className="mb-4 text-lg font-semibold text-white">Decoded</h3>
          <div className="space-y-4">
            <JsonPanel
              title="Header"
              segmentColor="bg-fuchsia-400"
              segmentText="(algorithm + token type)"
              value={headerJson}
              copyKey="hdr"
              copyValue={headerJson}
            />
            <JsonPanel
              title="Payload"
              segmentColor="bg-violet-400"
              segmentText="(claims)"
              value={payloadJson}
              copyKey="pld"
              copyValue={payloadJson}
            />
            <div className="rounded-lg border border-zinc-600 bg-zinc-800">
              <div className="flex items-center justify-between border-b border-zinc-700 px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-sky-400" />
                  <span className="text-sm font-semibold text-zinc-200">Signature</span>
                  <span className="text-xs text-zinc-500">(base64url)</span>
                </div>
                <CopyButton value={decoded.signature} idKey="sig" />
              </div>
              <p className="px-4 py-3 font-mono text-sm break-all text-zinc-300">
                {decoded.signature || '(empty)'}
              </p>
            </div>
          </div>
        </div>
      )}

      {mode === 'verify' && decoded && !('error' in decoded) && (
        <div className={PANEL_CLASS}>
          <h3 className="mb-4 text-lg font-semibold text-white">Claim checks</h3>
          <ClaimList checks={claimChecks} />
        </div>
      )}

      {mode === 'sign' && (
        <>
          <div className={PANEL_CLASS}>
            <h3 className="mb-4 text-lg font-semibold text-white">Algorithm</h3>
            <Dropdown
              options={ALG_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              value={signAlg}
              onChange={(v) => {
                const alg = v as Alg;
                setSignAlg(alg);
                try {
                  const parsed = JSON.parse(signHeader);
                  if (parsed && typeof parsed === 'object' && parsed.alg !== alg) {
                    setSignHeader(JSON.stringify({ ...parsed, alg }, null, 2));
                  }
                } catch {
                  // user is mid-edit; leave the header as-is
                }
              }}
            />
            {signAlg === 'none' && (
              <p className="mt-2 text-xs text-amber-300">
                ⚠ Unsigned tokens are accepted by no sane production verifier. Use only for
                debugging.
              </p>
            )}
          </div>

          <div className={PANEL_CLASS}>
            <h3 className="mb-4 text-lg font-semibold text-white">Header</h3>
            <textarea
              value={signHeader}
              onChange={(e) => {
                const v = e.target.value;
                setSignHeader(v);
                try {
                  const parsed = JSON.parse(v) as { alg?: unknown };
                  if (
                    typeof parsed.alg === 'string' &&
                    parsed.alg !== signAlg &&
                    ALG_OPTIONS.some((o) => o.value === parsed.alg)
                  ) {
                    setSignAlg(parsed.alg as Alg);
                  }
                } catch {
                  // user is mid-edit; ignore
                }
              }}
              rows={5}
              className={`${INPUT_CLASS} resize-none`}
            />
          </div>

          <div className={PANEL_CLASS}>
            <h3 className="mb-4 text-lg font-semibold text-white">Payload</h3>
            <textarea
              value={signPayload}
              onChange={(e) => setSignPayload(e.target.value)}
              rows={8}
              className={`${INPUT_CLASS} resize-none`}
            />
          </div>

          {signAlg !== 'none' && (
            <div className={PANEL_CLASS}>
              <h3 className="mb-4 text-lg font-semibold text-white">
                {algFamily(signAlg) === 'HMAC' ? 'Secret' : 'Private key (PEM, PKCS#8)'}
              </h3>
              <textarea
                value={signKey}
                onChange={(e) => setSignKey(e.target.value)}
                placeholder={
                  algFamily(signAlg) === 'HMAC'
                    ? 'your-256-bit-secret'
                    : '-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----'
                }
                rows={algFamily(signAlg) === 'HMAC' ? 2 : 9}
                className={`${INPUT_CLASS} resize-none`}
              />
            </div>
          )}

          <div className={PANEL_CLASS}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Signed JWT</h3>
              {signedJwt && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setDecodeToken(signedJwt);
                      setMode('decode');
                    }}
                    className={SECONDARY_BTN_CLASS}
                  >
                    Open in Decode
                  </button>
                  <button onClick={() => void openInVerify()} className={SECONDARY_BTN_CLASS}>
                    Open in Verify
                  </button>
                  <CopyButton value={signedJwt} idKey="signed" />
                </div>
              )}
            </div>
            {signError && <p className="text-sm text-red-400">{signError}</p>}
            {!signError && signedJwt && (
              <p className="rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-3 font-mono text-sm break-all text-zinc-100">
                {signedJwt}
              </p>
            )}
            {!signError && !signedJwt && (
              <p className="text-sm text-zinc-400">
                Provide header, payload{signAlg !== 'none' ? ', and a key' : ''} to see the signed
                JWT.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
