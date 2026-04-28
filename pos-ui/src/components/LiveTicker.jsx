import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { pharmaTips } from '../utils/pharmaTips';
import axios from 'axios';

const LiveTicker = () => {
  const socket = useSocket();
  const [liveAlert, setLiveAlert] = useState(null);
  const [stats, setStats] = useState({ total: 0, count: 0 });

  const [lastTx, setLastTx] = useState(() => {
    const saved = localStorage.getItem("OPP_STICKY_LAST_TX");
    return saved ? JSON.parse(saved) : { time: "--:--", amount: "0.00" };
  });

  const fetchTodayStats = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(
        "http://localhost:3001/api/pharmacist/daily-summary",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setStats({
          total: res.data.data.netSales || 0,
          count: res.data.data.totalInvoices || 0
        });
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { fetchTodayStats(); }, [fetchTodayStats]);

  useEffect(() => {
    if (!socket) return;

    socket.on("NEW_SALE_EVENT", (data) => {
      setStats({
        total: data.totalSales,
        count: data.totalInvoices
      });

      if (!data.isSilent) {
        setLiveAlert(data);

        const txInfo = {
          time: data.time,
          amount: data.amount,
          invoiceNo: data.invoiceNo
        };

        setLastTx(txInfo);
        localStorage.setItem("OPP_STICKY_LAST_TX", JSON.stringify(txInfo));

        setTimeout(() => setLiveAlert(null), 8000);
      }
    });

    return () => socket.off("NEW_SALE_EVENT");
  }, [socket]);

  const combinedTips = pharmaTips
    .map(t => `${t.en} • ${t.bn}`)
    .join("   ◆   ");

  return (
    <>
      <div className={`tv-ticker ${liveAlert ? 'alert' : ''}`}>
        <div className="tv-inner">

          {!liveAlert && (
            <>
              {/* LEFT */}
              <div className="tv-left">
                <div className="tv-live">
                  <span className="tv-live-dot" />
                  LIVE ONEPOINT
                </div>

                <div className="tv-stat">
                  <span>TODAY SALES</span>
                  <b>৳ {Number(stats.total).toLocaleString(undefined,{minimumFractionDigits:2})}</b>
                </div>

                <div className="tv-stat">
                  <span>TXN</span>
                  <b>{stats.count}</b>
                </div>
              </div>

              {/* CENTER */}
              <div className="tv-middle">
                <div className="tv-marquee">
                  <div>{combinedTips}</div>
                  <div>{combinedTips}</div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="tv-right">
                <span className="last">LAST SALE</span>
                <span className="amt">৳ {lastTx.amount}</span>
                <span className="time">{lastTx.time}</span>
              </div>
            </>
          )}

          {/* BREAKING */}
          {liveAlert && (
            <div className="tv-breaking">
              <strong>Invoice Successfully Issued for Settlement:</strong>
              <span>Sales Receipt</span>
              <b>{liveAlert.invoiceNo}</b>
              <span>Amount</span>
              <b>৳ {Number(liveAlert.amount).toFixed(2)}</b>
              <span>at</span>
              <b>{liveAlert.time}</b>
              <div className="progress" />
            </div>
          )}
        </div>
      </div>

      <style>{`
        .tv-ticker {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 32px;
          z-index: 9999;
           background:
            linear-gradient(
              180deg,
              rgba(255,255,255,0.08) -35%,
              rgba(1,2,11,0.75) 35%,
              rgba(1,2,11,0.85) 100%
            );
          backdrop-filter: blur(14px) saturate(140%);
          -webkit-backdrop-filter: blur(14px) saturate(140%);
          border-bottom: 1px solid rgba(255,255,255,0.12);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.15),
            0 6px 20px rgba(0,0,0,0.4);
          font-family: Inter, system-ui, sans-serif;
          color: #fff;
          filter: none !important;
          backdrop-filter: blur(14px) !important;
        }


        .tv-ticker.alert {
          background:
            linear-gradient(
              180deg,
              rgba(180,0,0,0.95) 0%,
              rgba(120,0,0,0.98) 100%
            );
          backdrop-filter: none;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.25),
            0 8px 24px rgba(0,0,0,0.5);
        }

        .tv-ticker::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255,255,255,0.06) 50%,
            transparent 100%
          );
          pointer-events: none;
        }


        .tv-inner {
          display: flex;
          align-items: center;
          height: 100%;
          line-height: 1;
        }

        /* LEFT */
        .tv-left {
          display: flex;
          align-items: center;
          gap: 14px;
          padding-left: 12px;
          flex-shrink: 0;
        }

        .tv-live {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.2px;
          color: #ff3b3b;
        }

        .tv-live-dot {
          width: 6px;
          height: 6px;
          background: #ff3b3b;
          border-radius: 50%;
          animation: blink 1s infinite;
        }

        .tv-stat {
          display: flex;
          align-items: center;
          gap: 3px;
          white-space: nowrap;
        }

        .tv-stat span {
          font-size: 9px;
          color: rgba(255,255,255,0.6);
        }

        .tv-stat b {
          display: inline;        /* 🔥 FIX */
          font-size: 12px;        /* slightly smaller, cleaner */
          font-weight: 800;
          color: #00ff9d;
        }


        /* CENTER */
        .tv-middle {
          flex: 1;
          overflow: hidden;
          mask-image: linear-gradient(to right, transparent, black 6%, black 94%, transparent);
        }

        .tv-marquee {
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          will-change: transform;
          animation: scroll 110s linear infinite; /* speed ↑ */
        }

        @keyframes scroll {
          0%   { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }

        .tv-marquee div {
          padding-right: 100px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.2px;
          color: rgba(255,255,255,0.75);
        }
        .net-sale,
        .txn-position {
          position: relative;     /* not absolute */
          top: 0;
        }
          

        /* RIGHT */
        .tv-right {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          border-left: 1px solid rgba(255,255,255,0.1);
          white-space: nowrap;
        }

        .tv-right .last {
          font-size: 9px;
          color: #ffcc00;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .tv-right .amt {
          font-size: 13px;
          font-weight: 800;
        }

        .tv-right .time {
          font-size: 10px;
          color: rgba(255,255,255,0.5);
        }

        /* BREAKING */
        .tv-breaking {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 14px;
          font-weight: 800;
          position: relative;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          white-space: nowrap;
        }

        .tv-breaking strong {
          background: #fff;
          color: #8b0000;
          padding: 3px 10px;
          border-radius: 3px;
          font-size: 11px;
          font-weight: 900;
        }

        .tv-breaking b {
          font-weight: 900;
        }

        .progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 2px;
          background: rgba(255,255,255,0.7);
          animation: progress 15s linear forwards;
        }

        @keyframes scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        @keyframes blink {
          0%,100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </>
  );
};

export default LiveTicker;
