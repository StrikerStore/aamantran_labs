import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import { CopyField } from '../components/CopyField';
import { absoluteInviteUrl } from '../lib/config';

/**
 * Device preview.
 *
 * The `view` parameter is forced rather than left to the user agent: the
 * backend picks the desktop or mobile entry file from the UA, so an iframe on a
 * laptop would always get the desktop file no matter how narrow it is. Forcing
 * it means the width and the entry file agree, which is the thing being tested.
 */
const DEVICES = [
  { id: 'iphone',  label: 'iPhone',      w: 390,  h: 844,  view: 'mobile',  round: true },
  { id: 'android', label: 'Android',     w: 412,  h: 915,  view: 'mobile',  round: true },
  { id: 'tablet',  label: 'iPad',        w: 820,  h: 1080, view: 'desktop', round: true },
  { id: 'desktop', label: 'Desktop',     w: 1440, h: 900,  view: 'desktop', round: false },
];

/** Scale a device down so it fits the stage without the page scrolling sideways. */
function useStageScale(deviceWidth) {
  const ref = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function measure() {
      const available = ref.current?.clientWidth;
      if (!available) return;
      setScale(Math.min(1, (available - 60) / deviceWidth));
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [deviceWidth]);

  return [ref, scale];
}

export default function Preview() {
  const toast = useToast();

  const [state, setState]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState('iphone');
  const [landscape, setLandscape] = useState(false);
  const [qr, setQr] = useState('');
  // Bumped to force the iframe to re-fetch after a ZIP re-upload.
  const [nonce, setNonce] = useState(0);

  const device = DEVICES.find((d) => d.id === deviceId) || DEVICES[0];
  const w = landscape ? device.h : device.w;
  const h = landscape ? device.w : device.h;

  const [stageRef, scale] = useStageScale(w);

  const load = useCallback(async () => {
    try {
      setState(await api.sandbox.get());
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const previewUrl = state?.urls?.preview || '';
  const shareUrl = absoluteInviteUrl(previewUrl);

  useEffect(() => {
    if (!shareUrl) return;
    QRCode.toDataURL(shareUrl, { width: 200, margin: 1, color: { dark: '#e6e9ef', light: '#161a21' } })
      .then(setQr)
      .catch(() => setQr(''));
  }, [shareUrl]);

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  if (!state?.event) {
    return (
      <div>
        <div className="page-head"><h1 className="page-title">Preview &amp; devices</h1></div>
        <div className="card">
          <div className="empty">
            <div className="empty-icon">📭</div>
            Upload a template first.
          </div>
        </div>
      </div>
    );
  }

  // The `view` override and the cache-busting nonce ride along in the query.
  const frameSrc = previewUrl
    ? `${previewUrl}${previewUrl.includes('?') ? '&' : '?'}view=${device.view}&_=${nonce}`
    : '';

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title">Preview &amp; devices</h1>
        <p className="page-sub">
          Serving the <strong>{device.view}</strong> entry file at {w}×{h}
        </p>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="btn-row" style={{ marginBottom: 12 }}>
            {DEVICES.map((d) => (
              <button
                key={d.id}
                className={`btn btn-sm ${d.id === deviceId ? 'btn-primary' : ''}`}
                onClick={() => setDeviceId(d.id)}
              >
                {d.label}
                <span style={{ opacity: 0.7, fontWeight: 400 }}>{d.w}px</span>
              </button>
            ))}
            <button className="btn btn-sm" onClick={() => setLandscape((v) => !v)}>
              {landscape ? '⟲ Portrait' : '⟳ Landscape'}
            </button>
            <button className="btn btn-sm" onClick={() => setNonce((n) => n + 1)}>
              ↻ Reload
            </button>
            <button className="btn btn-sm" onClick={() => window.open(previewUrl, '_blank', 'noreferrer')}>
              ↗ New tab
            </button>
          </div>

          <div className="preview-stage" ref={stageRef}>
            <div
              className={`device ${device.round ? '' : 'flat'}`}
              style={{
                width:  w * scale + 20,
                height: h * scale + 20,
              }}
            >
              <iframe
                key={`${device.id}-${landscape}-${nonce}`}
                title="Invitation preview"
                src={frameSrc}
                width={w}
                height={h}
                style={{
                  width: w,
                  height: h,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
              />
            </div>
          </div>

          <p className="hint">
            Scaled to {Math.round(scale * 100)}% to fit. Layout is measured at the real{' '}
            {w}px, so media queries behave exactly as they will on the device.
          </p>
        </div>
      </div>

      {/* ── Real device ─────────────────────────────────────────── */}
      <div className="card">
        <div className="card-head">
          <span className="card-title">Open on a real phone</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {qr && (
              <img
                src={qr}
                alt="QR code for the invite link"
                width={168}
                height={168}
                style={{ borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}
              />
            )}
            <div style={{ flex: 1, minWidth: 260 }}>
              <CopyField label="Invite link" value={shareUrl} />
              <p className="hint" style={{ marginTop: 0 }}>
                An iframe cannot reproduce touch scrolling, the iOS URL bar collapsing mid-scroll,
                or audio autoplay rules. Scan this before signing anything off.
              </p>
              {shareUrl.startsWith('http://localhost') && (
                <p className="hint" style={{ color: 'var(--accent)' }}>
                  This is a localhost URL — a phone on your network cannot open it. Set
                  <code> VITE_PUBLIC_INVITE_BASE_URL</code> to your machine's LAN address or a
                  deployed API to test on a handset.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
