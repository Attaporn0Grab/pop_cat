import React, { useEffect, useMemo, useRef, useState } from "react";

// Popcat Anywhere — click anywhere on screen to POP
// - ตารางคะแนนด้านล่าง แสดงแค่ 3 อันดับแรก โดยกด ⬆ เพื่อดูทั้งหมด / ⬇ เพื่อซ่อนกลับ
// - เอฟเฟกต์เด้ง, ตัวเลข +1 ลอยขึ้น, เสียงป็อป (เปิด/ปิดได้)
// - คิด CPS (Clicks per second) และบันทึกลง localStorage
// - ไม่มีปุ่มรีเซ็ต

function flagEmoji(code) {
  if (!code || code.length !== 2) return "🌐";
  const A = 0x1f1e6;
  const base = "A".charCodeAt(0);
  const [c1, c2] = code.toUpperCase().split("");
  return String.fromCodePoint(A + (c1.charCodeAt(0) - base)) +
         String.fromCodePoint(A + (c2.charCodeAt(0) - base));
}

function getRegionFromNavigator() {
  try {
    const lang = (navigator.language || "en-US").toUpperCase();
    const parts = lang.split("-");
    const region = parts.length > 1 ? parts[1] : (parts[0] === "EN" ? "US" : parts[0]);
    return region.length === 2 ? region : "TH";
  } catch {
    return "TH";
  }
}

function getRegionName(code) {
  try {
    const dn = new Intl.DisplayNames([navigator.language || "th-TH"], { type: "region" });
    return dn.of(code) || code;
  } catch {
    const fallback = {
      TH: "Thailand", TW: "Taiwan", JP: "Japan", KR: "Korea", US: "United States",
      MY: "Malaysia", VN: "Vietnam", SG: "Singapore", PH: "Philippines",
      HK: "Hong Kong", ID: "Indonesia", IN: "India", CN: "China",
      GB: "United Kingdom", DE: "Germany", FR: "France", BR: "Brazil",
    };
    return fallback[code] || code;
  }
}

const INITIAL_COUNTRIES = [
  "TH","TW","JP","KR","US","MY","VN","SG","PH","HK","ID","IN","CN","GB","DE","FR","BR"
];

const LS_KEY = "popcat-anywhere-v1";

export default function PopcatAnywhere() {
  const userRegion = useMemo(() => getRegionFromNavigator(), []);

  const [country, setCountry] = useState(userRegion);
  const [expanded, setExpanded] = useState(false); // toggle ตารางทั้งหมด/ท็อป 3

  const [scoreboard, setScoreboard] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || "null");
      if (saved && saved.scoreboard) return saved.scoreboard;
    } catch {}
    const seed = {};
    for (const c of INITIAL_COUNTRIES) seed[c] = { name: getRegionName(c), clicks: 0 };
    if (!seed[userRegion]) seed[userRegion] = { name: getRegionName(userRegion), clicks: 0 };
    return seed;
  });

  const [total, setTotal] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || "null");
      return saved?.total ?? 0;
    } catch { return 0; }
  });

  const [popping, setPopping] = useState(false);
  const [cps, setCps] = useState(0);
  const [bestCps, setBestCps] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || "null");
      return saved?.bestCps ?? 0;
    } catch { return 0; }
  });

  const [soundOn, setSoundOn] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || "null");
      return saved?.soundOn ?? true;
    } catch { return true; }
  });

  const recentClicksRef = useRef([]);
  const audioCtxRef = useRef(null);
  const [floaters, setFloaters] = useState([]);
  const floaterIdRef = useRef(0);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ scoreboard, total, bestCps, soundOn }));
    } catch {}
  }, [scoreboard, total, bestCps, soundOn]);

  // รองรับ Space/Enter ให้ป็อปตรงกลาง
  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat) return;
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        popAtCenter();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [country, scoreboard]);

  const beep = () => {
    try {
      if (!soundOn) return;
      const ctx = audioCtxRef.current || new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.value = 880;
      g.gain.value = 0.0001;
      o.connect(g).connect(ctx.destination);
      const now = ctx.currentTime;
      g.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
      o.start(now);
      o.stop(now + 0.12);
    } catch {}
  };

  const addFloater = (x, y) => {
    const id = ++floaterIdRef.current;
    setFloaters((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setFloaters((prev) => prev.filter((f) => f.id !== id));
    }, 800);
  };

  const registerClick = (x, y) => {
    setScoreboard((prev) => {
      const next = { ...prev };
      const c = (next[country] ||= { name: getRegionName(country), clicks: 0 });
      c.clicks += 1;
      return next;
    });
    setTotal((t) => t + 1);

    const now = performance.now();
    const arr = recentClicksRef.current;
    arr.push(now);
    while (arr.length && now - arr[0] > 1000) arr.shift();
    const cur = arr.length;
    setCps(cur);
    setBestCps((b) => (cur > b ? cur : b));

    setPopping(true);
    setTimeout(() => setPopping(false), 90);
    addFloater(x, y);
    beep();
  };

  const onPointerDown = (e) => {
    let node = e.target;
    while (node) {
      if (node.getAttribute && node.getAttribute("data-nopop") === "true") return;
      node = node.parentNode;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    registerClick(x, y);
  };

  const popAtCenter = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    registerClick(vw / 2, vh / 2);
  };

  const sorted = useMemo(() => {
    const entries = Object.entries(scoreboard);
    entries.sort((a, b) => b[1].clicks - a[1].clicks);
    return entries;
  }, [scoreboard]);

  const displayed = expanded ? sorted : sorted.slice(0, 3);

  const countryOptions = useMemo(() => {
    const set = new Set([...INITIAL_COUNTRIES, country, userRegion, ...Object.keys(scoreboard)]);
    return Array.from(set);
  }, [country, userRegion, scoreboard]);

  return (
    <div
      className="min-h-screen w-full select-none bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 text-neutral-900 overflow-hidden relative"
      onPointerDown={onPointerDown}
    >
      {/* Floating +1 pop indicators */}
      {floaters.map((f) => (
        <span
          key={f.id}
          className="pointer-events-none absolute text-xl font-bold"
          style={{
            left: f.x,
            top: f.y,
            transform: "translate(-50%, -50%)",
            animation: "floatUp 0.8s ease-out forwards",
          }}
        >
          +1
        </span>
      ))}

      {/* Top bar controls */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2 rounded-full shadow-lg bg-white/70 backdrop-blur border border-white/60" data-nopop>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium hidden sm:block">ประเทศ:</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="px-3 py-1.5 rounded-full bg-white/90 border border-neutral-300 text-sm"
          >
            {countryOptions.map((c) => (
              <option key={c} value={c}>
                {flagEmoji(c)} {getRegionName(c)} ({c})
              </option>
            ))}
          </select>
        </div>
        <div className="h-5 w-px bg-neutral-300/60" />
        <button
          onClick={() => setSoundOn((s) => !s)}
          className="px-3 py-1.5 rounded-full text-sm border border-neutral-300 bg-white/90 hover:bg-white"
        >
          {soundOn ? "🔊 เสียงเปิด" : "🔇 เสียงปิด"}
        </button>
        <div className="h-5 w-px bg-neutral-300/60" />
        <div className="text-sm whitespace-nowrap">CPS: <span className="font-semibold">{cps}</span> • ดีสุด: <span className="font-semibold">{bestCps}</span></div>
      </div>

      {/* Centerpiece */}
      <div className="flex flex-col items-center justify-center pt-24 pb-40 sm:pb-48">
        <div className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight drop-shadow-sm">POP ANYWHERE</div>
        <div className="mt-2 text-neutral-600">คลิกที่ไหนก็ได้บนหน้าจอเพื่อเพิ่มแต้มให้ประเทศของคุณ</div>

        {/* Cat SVG with pop animation */}
        <div className="mt-8 w-[220px] sm:w-[260px] md:w-[300px] aspect-square">
          <div className={`w-full h-full transition-transform duration-100 ${popping ? "scale-105" : "scale-100"}`}>
            <CatFace popping={popping} />
          </div>
        </div>

        {/* Big Counter */}
        <div className="mt-6 text-4xl sm:text-5xl font-extrabold tabular-nums">{total.toLocaleString()}</div>
        <div className="text-sm text-neutral-600 mt-1">ยอดรวมทั้งหมด</div>
      </div>

      {/* Bottom Scoreboard */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <div className="mx-auto max-w-6xl p-3 sm:p-4">
          <div className="rounded-2xl border border-amber-200/80 bg-white/80 backdrop-blur shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-amber-100/70 border-b border-amber-200/80">
              <div className="font-semibold">ตารางคะแนนตามประเทศ</div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="px-3 py-1 text-sm rounded-full bg-white/90 border border-neutral-300 hover:bg-white"
                data-nopop
              >
                {expanded ? "⬇ ซ่อน" : "⬆ ดูทั้งหมด"}
              </button>
            </div>
            <div className="max-h-[36vh] overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-white/90 backdrop-blur border-b">
                  <tr>
                    <th className="text-left px-4 py-2 w-16">อันดับ</th>
                    <th className="text-left px-2 py-2">ประเทศ</th>
                    <th className="text-right px-4 py-2">คะแนน</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map(([code, data], idx) => (
                    <tr key={code} className={`${code === country ? "bg-amber-50" : ""} border-b last:border-b-0`}>
                      <td className="px-4 py-2 tabular-nums">{idx + 1}</td>
                      <td className="px-2 py-2 flex items-center gap-2">
                        <span className="text-lg">{flagEmoji(code)}</span>
                        <span className="font-medium">{data.name}</span>
                        <span className="text-[11px] text-neutral-500">({code})</span>
                        {code === country && (
                          <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">คุณ</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold tabular-nums">{data.clicks.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Styles for floater animation */}
      <style>
        {`
        @keyframes floatUp {
          0% { transform: translate(-50%, -50%) translateY(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) translateY(-40px); opacity: 0; }
        }
        `}
      </style>
    </div>
  );
}

function CatFace({ popping }) {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <radialGradient id="g1" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#fff3" />
          <stop offset="100%" stopColor="#0001" />
        </radialGradient>
      </defs>
      <g>
        <circle cx="100" cy="100" r="80" fill="#ffe4b5" />
        <circle cx="100" cy="100" r="80" fill="url(#g1)" />
        <path d="M35 70 L20 25 L60 55 Z" fill="#ffe4b5" stroke="#e0b98a" />
        <path d="M165 70 L180 25 L140 55 Z" fill="#ffe4b5" stroke="#e0b98a" />
        <circle cx="70" cy="95" r="8" fill="#222" />
        <circle cx="130" cy="95" r="8" fill="#222" />
        <polygon points="100,105 94,110 106,110" fill="#e59f71" />
        <line x1="40" y1="110" x2="80" y2="115" stroke="#8b5e34" strokeWidth="2" />
        <line x1="40" y1="120" x2="80" y2="120" stroke="#8b5e34" strokeWidth="2" />
        <line x1="160" y1="110" x2="120" y2="115" stroke="#8b5e34" strokeWidth="2" />
        <line x1="160" y1="120" x2="120" y2="120" stroke="#8b5e34" strokeWidth="2" />
        {popping ? (
          <ellipse cx="100" cy="130" rx="22" ry="12" fill="#7f1d1d" />
        ) : (
          <path d="M85 130 Q100 140 115 130" stroke="#7f1d1d" strokeWidth="4" fill="none" strokeLinecap="round" />
        )}
      </g>
    </svg>
  );
}
