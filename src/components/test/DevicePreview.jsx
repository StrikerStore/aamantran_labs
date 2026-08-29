import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { CopyField } from '../CopyField';
import { absoluteInviteUrl } from '../../lib/config';

/**
 * The live server render, in a device frame.
 *
 * The `view` parameter is forced rather than left to the user agent: the
 * backend picks the desktop or mobile entry file from the UA, so an iframe on a
 * laptop would always get the desktop file no matter how narrow it is. Forcing
 * it means the width and the entry file agree, which is the thing being tested.
 */
const DEVICES = [
  { id: 'iphone',  label: 'iPhone',  w: 390,  h: 844,  view: 'mobile',  round: true },
  { id: 'android', label: 'Android', w: 412,  h: 915,  view: 'mobile',  round: true },
  { id: 'tablet',  label: 'iPad',    w: 820,  h: 1080, view: 'desktop', round: true },
  { id: 'desktop', label: 'Desktop', w: 1440, h: 900,  view: 'desktop', round: false },
];

/** Scale a device down so it fits the stage without the page scrolling sideways. */
function useStageScale(deviceWidth) {
  const ref = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    function measure() {
      const available = el.clientWidth;
      if (!available) return;
      setScale(Math.min(1, (available - 60) / deviceWidth));
    }

    measure();

    // The stage lives in a resizable grid column, so a window resize alone
    // misses the case where the editor column reflows and the stage changes
    // width underneath it.
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [deviceWidth]);

  return [ref, scale];
}

export function DevicePreview({ previewUrl, nonce, onReload }) {
  const [deviceId, setDeviceId]   = useState('iphone');
  const [landscape, setLandscape] = useState(false);
  const [qr, setQr]               = useState('');

  const device = DEVICES.find((d) => d.id === deviceId) || DEVICES[0];
  const w = landscape ? device.h : device.w;
  const h = landscape ? device.w : device.h;

  const [stageRef, scale] = useStageScale(w);

  const shareUrl = absoluteInviteUrl(previewUrl);

  useEffect(() => {
    if (!shareUrl) { setQr(''); return; }
    QRCode.toDataURL(shareUrl, {
      width: 200,
      margin: 1,
      color: { dark: '#2e2618', light: '#ffffff' },
    }).then(setQr).catch(() => setQr(''));
  }, [shareUrl]);

  const frameSrc = previewUrl
    ? `${previewUrl}${previewUrl.includes('?') ? '&' : '?'}view=${device.view}&_=${nonce}`
    : '';

  return (
    <>
      <div className="card">
        <div className="card-head">
          <span className="card-title">Live preview</span>
          <span className="badge badge-gold">
            {device.view} &middot; {w}&times;{h}
          </span>
        </div>
        <div className="card-body">
          <div className="btn-row" style={{ marginBottom: 14 }}>
            <div className="seg">
              {DEVICES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={d.id === deviceId ? 'on' : ''}
                  onClick={() => setDeviceId(d.id)}
                >
                  {d.label}
                  <small>{d.w}</small>
                </button>
              ))}
            </div>
            <button className="btn btn-sm" onClick={() => setLandscape((v) => !v)}>
              {landscape ? <>&#8634; Portrait</> : <>&#8635; Landscape</>}
            </button>
            <button className="btn btn-sm" onClick={onReload}>&#10227; Reload</button>
            <button
              className="btn btn-sm"
              onClick={() => window.open(previewUrl, '_blank', 'noreferrer')}
            >
              &#8599; New tab
            </button>
          </div>

          <div className="preview-stage" ref={stageRef}>
            <div
              className={`device ${device.round ? '' : 'flat'}`}
              style={{ width: w * scale + 20, height: h * scale + 20 }}
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
            Scaled to {Math.round(scale * 100)}% to fit. Layout is measured at the real {w}px,
            so media queries behave exactly as they will on the device.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <span className="card-title">Open on a real phone</span>
        </div>
        <div className="card-body">
          <div className="qr-row">
            {qr && (
              <img
                className="qr-code"
                src={qr}
                alt="QR code for the invite link"
                width={168}
                height={168}
              />
            )}
            <div style={{ flex: 1, minWidth: 240 }}>
              <CopyField label="Invite link" value={shareUrl} />
              <p className="hint" style={{ marginTop: 0 }}>
                An iframe cannot reproduce touch scrolling, the iOS URL bar collapsing mid-scroll,
                or audio autoplay rules. Scan this before signing anything off.
              </p>
              {shareUrl.startsWith('http://localhost') && (
                <p className="hint" style={{ color: 'var(--peach-deep)', fontWeight: 700 }}>
                  This is a localhost URL, so a phone on your network cannot open it. Set
                  <code> VITE_PUBLIC_INVITE_BASE_URL</code> to your machine&apos;s LAN address or
                  a deployed API to test on a handset.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
