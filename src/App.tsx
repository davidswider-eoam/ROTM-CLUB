import { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Search, 
  Disc, 
  Check, 
  Flag, 
  Plus, 
  X, 
  LayoutDashboard, 
  Users, 
  Contact,
  Package,
  Save,
  History as HistoryIcon,
  Trash2,
  DollarSign,
  Printer,
  TrendingUp,
  PieChart,
  Settings,
  ExternalLink,
  Calendar,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import './App.css';
import { SUBSCRIBERS, CATALOG, MONTHS } from './constants';
import { MUSIC_QUOTES } from './quotes';
import type { Subscriber, Catalog, HistoryEntry } from './types';
import { isActiveForMonth, isNewThisMonth, isLapsingThisMonth, statusFor, fmt } from './utils';
import logo from './assets/logo.png';

// Helper for tailwind-like class merging (if needed, though we use vanilla CSS)
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'dashboard' | 'subscribers' | 'catalog' | 'contacts' | 'add' | 'history' | 'settings';
type SubTab = 'all' | 'term' | 'monthly';

const ALL_MONTHS = ["2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04"];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [subTab, setSubTab] = useState<SubTab>("all");
  const [selectedMonth, setSelectedMonth] = useState("2026-02");
  const [shipped, setShipped] = useState<Set<string>>(new Set(["1", "8"]));
  const [filter, setFilter] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [detailSub, setDetailSub] = useState<Subscriber | null>(null);
  const [detailCatalogMonth, setDetailCatalogMonth] = useState<string | null>(null);
  const [catalogData, setCatalogData] = useState<Catalog>(CATALOG);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isGift, setIsGift] = useState(false);
  const [bcStoreUrl, setBcStoreUrl] = useState(() => localStorage.getItem('bcStoreUrl') || "");
  const searchRef = useRef<HTMLInputElement>(null);

  const zenQuote = useMemo(() => {
    return MUSIC_QUOTES[Math.floor(Math.random() * MUSIC_QUOTES.length)];
  }, []);

  useEffect(() => {
    localStorage.setItem('bcStoreUrl', bcStoreUrl);
  }, [bcStoreUrl]);

  const m = selectedMonth;
  
  const activeSubs = useMemo(() => SUBSCRIBERS.filter(s => isActiveForMonth(s, m)), [m]);
  const shipSubs = useMemo(() => activeSubs.filter(s => s.delivery === "ship"), [activeSubs]);
  const pickupSubs = useMemo(() => activeSubs.filter(s => s.delivery === "pickup"), [activeSubs]);
  const newSubs = useMemo(() => activeSubs.filter(s => isNewThisMonth(s, m)), [activeSubs, m]);
  const lapsingSubs = useMemo(() => activeSubs.filter(s => isLapsingThisMonth(s, m)), [activeSubs, m]);
  const lapsedCount = useMemo(() => SUBSCRIBERS.filter(s => s.end && s.end < m).length, [m]);

  const shippedThisMonth = useMemo(() => activeSubs.filter(s => shipped.has(s.id)), [activeSubs, shipped]);
  const totalToShip = activeSubs.length;
  const shippedCount = shippedThisMonth.length;

  const filteredSubs = useMemo(() => activeSubs.filter(s => {
    if (filter === "unshipped") return !shipped.has(s.id);
    if (filter === "pickup") return s.delivery === "pickup";
    if (filter === "flagged") return s.flag || s.notes?.includes("ASK") || s.notes?.includes("!!");
    return true;
  }), [activeSubs, filter, shipped]);

  const unshipped = useMemo(() => filteredSubs.filter(s => !shipped.has(s.id)), [filteredSubs, shipped]);
  const shippedList = useMemo(() => filteredSubs.filter(s => shipped.has(s.id)), [filteredSubs, shipped]);

  const searchResults = useMemo(() => searchQ.length > 1
    ? SUBSCRIBERS.filter(s =>
        s.order?.toLowerCase().includes(searchQ.toLowerCase()) ||
        s.billing.toLowerCase().includes(searchQ.toLowerCase()) ||
        s.recipient.toLowerCase().includes(searchQ.toLowerCase()) ||
        s.billingEmail?.toLowerCase().includes(searchQ.toLowerCase())
      ).slice(0, 6)
    : [], [searchQ]);

  const subTypeCounts = useMemo(() => {
    return SUBSCRIBERS.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, []);

  const displaySubscribers = useMemo(() => {
    return SUBSCRIBERS.filter(s => {
      if (subTab === 'monthly') return s.type === 'monthly';
      if (subTab === 'term') return s.type !== 'monthly';
      return true;
    });
  }, [subTab]);

  function logAction(action: string, details: string, category: HistoryEntry['category']) {
    const entry: HistoryEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      action,
      details,
      staffMember: "Staff", // Placeholder
      category
    };
    setHistory(prev => [entry, ...prev]);
  }

  function toggleShip(id: string) {
    const sub = SUBSCRIBERS.find(s => s.id === id);
    const currentlyShipped = shipped.has(id);
    setShipped(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    
    logAction(
      currentlyShipped ? "Unmarked Shipping" : "Marked Shipped",
      `${sub?.recipient} marked as ${currentlyShipped ? 'unshipped' : 'shipped'} for ${fmt(m)}`,
      'shipping'
    );
  }

  function updateCatalog(
    month: string, 
    artist: string, 
    album: string, 
    label: string, 
    contact: string, 
    notes: string, 
    wholesaleCost: number,
    predictedNew: number,
    damageBuffer: number,
    shopExtras: number
  ) {
    setCatalogData(prev => ({
      ...prev,
      [month]: { artist, album, label, contact, notes, wholesaleCost, predictedNew, damageBuffer, shopExtras }
    }));
    setDetailCatalogMonth(null);
    logAction(
      "Updated Catalog",
      `Changed ${fmt(month)} to ${artist} — ${album}. Forecasting: ${predictedNew} new, ${damageBuffer}% buffer, ${shopExtras} extras.`,
      'catalog'
    );
  }

  const getBCOrderLink = (orderNum: string) => {
    if (!bcStoreUrl || orderNum === "INSTORE") return null;
    let cleanUrl = bcStoreUrl.trim().replace(/\/+$/, "");
    if (!cleanUrl.includes("/manage")) {
      cleanUrl = `${cleanUrl}/manage`;
    }
    return `${cleanUrl}/orders?keywords=${orderNum}`;
  };

  const OrderLink = ({ order }: { order: string }) => {
    const link = getBCOrderLink(order);
    if (!link) return <span className="sub-order">#{order || "—"}</span>;
    return (
      <a 
        href={link} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="sub-order order-link"
        onClick={(e) => e.stopPropagation()}
        title="Search in BigCommerce"
      >
        #{order} <ExternalLink size={8} style={{ marginLeft: 2, display: 'inline' }} />
      </a>
    );
  };

  const SubRow = ({ sub }: { sub: Subscriber }) => {
    const isShipped = shipped.has(sub.id);
    const isNew = isNewThisMonth(sub, m);
    const isLapsing = isLapsingThisMonth(sub, m);
    const isGiftSub = sub.recipient !== sub.billing;
    
    return (
      <div className={cn("sub-row", isShipped && "shipped", sub.flag && "flagged")}>
        <div className={cn("check-box", isShipped && "checked")} onClick={() => toggleShip(sub.id)}>
          {isShipped && <Check size={14} strokeWidth={3} className="check-mark" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sub-name">{sub.recipient}</div>
          {isGiftSub && <div className="sub-gift">gift from {sub.billing}</div>}
        </div>
        <div className="sub-meta">
          {sub.notes && sub.notes !== "" && (sub.flag || sub.notes.includes("ASK") || sub.notes.includes("!")) &&
            <span className="sub-note" title={sub.notes}>⚑ {sub.notes}</span>}
          {isNew && <span className="badge new">New</span>}
          {isLapsing && <span className="badge lapsing">Last</span>}
          <span className={cn("badge", sub.delivery)}>{sub.delivery}</span>
          <OrderLink order={sub.order} />
          <button 
            style={{ background: "none", border: "1px solid #2e2e2e", color: "#888", borderRadius: "4px", padding: "3px 8px", cursor: "pointer", fontSize: "10px", fontFamily: "DM Mono,monospace" }}
            onClick={() => setDetailSub(sub)}
          >
            View
          </button>
        </div>
      </div>
    );
  };

  const copyEmails = (list: string[], label: string) => {
    const emailStr = list.join(", ");
    navigator.clipboard.writeText(emailStr);
    alert(`Copied ${list.length} ${label} emails to clipboard.`);
  };

  const printPickupList = () => {
    const pickups = activeSubs.filter(s => s.delivery === "pickup").sort((a, b) => a.recipient.localeCompare(b.recipient));
    const cat = catalogData[selectedMonth];
    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>ROTM Pickup Checklist - ${fmt(selectedMonth)}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #000; }
            h1 { margin-bottom: 5px; font-size: 24px; }
            .month { font-size: 18px; color: #666; margin-bottom: 20px; }
            .album-info { border: 2px solid #000; padding: 15px; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border-bottom: 1px solid #ccc; padding: 12px 8px; text-align: left; }
            th { text-transform: uppercase; font-size: 10px; color: #666; }
            .checkbox { width: 24px; height: 24px; border: 1px solid #000; display: inline-block; vertical-align: middle; }
            .recipient { font-weight: bold; font-size: 14px; }
            .order { font-family: monospace; font-size: 12px; color: #444; }
            .notes { font-size: 11px; color: #666; font-style: italic; }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; padding: 10px; background: #eee; border-radius: 4px; font-size: 13px;">
            <strong>Print Preview:</strong> This page is formatted for standard paper. Press <strong>Cmd+P</strong> or <strong>Ctrl+P</strong> to print.
          </div>
          <h1>Record of the Month Pickup Checklist</h1>
          <div class="month">${fmt(selectedMonth)}</div>
          
          <div class="album-info">
            <strong>Current Selection:</strong> ${cat ? `${cat.artist} — ${cat.album}` : 'No record assigned'}
            ${cat?.label ? `<br><small>Label: ${cat.label}</small>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px;">Done</th>
                <th>Recipient</th>
                <th>Order #</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${pickups.map(s => `
                <tr>
                  <td><div class="checkbox"></div></td>
                  <td>
                    <div class="recipient">${s.recipient}</div>
                    ${s.recipient !== s.billing ? `<small>Billing: ${s.billing}</small>` : ''}
                  </td>
                  <td class="order">#${s.order || '—'}</td>
                  <td class="notes">${s.notes || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 40px; font-size: 10px; color: #999; text-align: center;">
            Generated on ${new Date().toLocaleDateString()} · End of All Music ROTM System
          </div>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="app">
      {/* ZEN BAR */}
      <div style={{ background: "var(--text3)", color: "#fff", padding: "6px 20px", textAlign: "center", fontSize: "11px", fontWeight: 500, letterSpacing: "0.03em", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Sparkles size={10} />
        {zenQuote}
      </div>

      {/* NAV */}
      <nav className="nav" style={{ height: 64 }}>
        <div className="nav-logo" style={{ height: 64, padding: "0 16px", display: "flex", alignItems: "center", gap: "12px", borderRight: "1px solid var(--border)" }}>
          <img src={logo} alt="End of All Music" style={{ height: 48, width: 'auto' }} />
          <div style={{ fontWeight: 800, fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text3)", whiteSpace: "nowrap" }}>
            Record of the Month Club
          </div>
        </div>
        {[
          { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
          { key: 'subscribers', label: 'Subscribers', icon: <Users size={14} /> },
          { key: 'catalog', label: 'Catalog', icon: <Disc size={14} /> },
          { key: 'history', label: 'History', icon: <HistoryIcon size={14} /> },
          { key: 'contacts', label: 'Contacts', icon: <Contact size={14} /> },
          { key: 'add', label: '+ Add Sub', icon: <Plus size={14} /> },
          { key: 'settings', label: '', icon: <Settings size={16} /> }
        ].map(({ key, label, icon }) => (
          <button 
            key={key} 
            className={cn("nav-tab", activeTab === key && "active")} 
            style={{ height: 64, minWidth: key === 'settings' ? 64 : 'auto' }}
            onClick={() => setActiveTab(key as Tab)}
            title={key === 'settings' ? 'Settings' : label}
          >
            {icon} {label}
          </button>
        ))}
        <div className="nav-search" style={{ position: "relative", height: 64 }}>
          <Search size={14} strokeWidth={2.5} color="#555" />
          <input 
            ref={searchRef} 
            className="search-input" 
            placeholder="Search order, name, email…" 
            value={searchQ}
            onChange={e => { setSearchQ(e.target.value); setShowSearch(true); }}
            onFocus={() => setShowSearch(true)}
            onBlur={() => setTimeout(() => setShowSearch(false), 200)} 
          />
          {showSearch && searchResults.length > 0 && (
            <div className="search-overlay">
              {searchResults.map(s => (
                <div key={s.id} className="search-result" onClick={() => { setDetailSub(s); setSearchQ(""); setShowSearch(false); }}>
                  <div className="sr-name">
                    {s.recipient}
                    {s.recipient !== s.billing && <span style={{ color: "#666", fontWeight: 400 }}> · from {s.billing}</span>}
                  </div>
                  <div className="sr-meta">
                    <OrderLink order={s.order} />
                    <span>{s.type}</span>
                    <span>{fmt(s.start)} → {fmt(s.end)}</span>
                    <span className={cn("badge", statusFor(s, m))} style={{ fontSize: "9px" }}>{statusFor(s, m)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="content" style={{ height: "calc(100vh - 64px - 27px)" }}>
        {/* ── DASHBOARD ── */}
        {activeTab === "dashboard" && (
          <>
            <div className="month-bar">
              {MONTHS.map(mo => (
                <button 
                  key={mo} 
                  className={cn("month-btn", selectedMonth === mo && "active")} 
                  onClick={() => setSelectedMonth(mo)}
                >
                  {fmt(mo)}
                </button>
              ))}
              {catalogData[m] && (
                <div className="album-pill">
                  <Disc size={12} strokeWidth={2} />
                  <strong>{catalogData[m].artist}</strong>&nbsp;—&nbsp;{catalogData[m].album}
                </div>
              )}
            </div>

            <div className="stats-strip">
              <div className="stat-cell">
                <div className="stat-label">Active Subs</div>
                <div className="stat-value green">{activeSubs.length}</div>
                <div className="stat-sub">total for {fmt(m)}</div>
              </div>
              <div className="stat-cell">
                <div className="stat-label">To Ship</div>
                <div className="stat-value green">{shipSubs.length}</div>
                <div className="stat-sub">{pickupSubs.length} pickup</div>
              </div>
              <div className="stat-cell">
                <div className="stat-label">Shipped</div>
                <div className="stat-value amber">{shippedCount} / {totalToShip}</div>
                <div className="stat-sub">{totalToShip - shippedCount} remaining</div>
              </div>
              <div className="stat-cell">
                <div className="stat-label">New This Month</div>
                <div className="stat-value" style={{ color: "var(--text3)" }}>{newSubs.length}</div>
                <div className="stat-sub">first record</div>
              </div>
              <div className="stat-cell">
                <div className="stat-label">Lapsing</div>
                <div className="stat-value red">{lapsingSubs.length}</div>
                <div className="stat-sub">last record · {lapsedCount} archived</div>
              </div>
            </div>

            <div className="checklist-header">
              <div className="checklist-title">Shipping Checklist</div>
              <div className="progress-track">
                <div 
                  className="progress-fill" 
                  style={{ width: `${totalToShip > 0 ? (shippedCount / totalToShip) * 100 : 0}%` }} 
                />
              </div>
              <div className="progress-label">{shippedCount} of {totalToShip} shipped</div>
            </div>
            <div className="filter-bar">
              {[["all", "All"], ["unshipped", "Unshipped"], ["pickup", "Pickup"], ["flagged", "Flagged"]].map(([k, l]) => (
                <button 
                  key={k} 
                  className={cn("filter-btn", filter === k && "active")} 
                  onClick={() => setFilter(k)}
                >
                  {l}
                </button>
              ))}
            </div>

            {unshipped.length > 0 && (
              <>
                <div className="section-divider">To ship — {unshipped.length}</div>
                {unshipped.map(s => <SubRow key={s.id} sub={s} />)}
              </>
            )}
            {shippedList.length > 0 && (
              <>
                <div className="section-divider">Shipped — {shippedList.length}</div>
                {shippedList.map(s => <SubRow key={s.id} sub={s} />)}
              </>
            )}
          </>
        )}

        {/* ── SUBSCRIBERS ── */}
        {activeTab === "subscribers" && (
          <>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px", background: "var(--surface)" }}>
              <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "0.04em", flex: 1 }}>All Subscribers</div>
              
              <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 8, padding: 4, gap: 4 }}>
                {[
                  { id: 'all', label: 'All', icon: <Users size={12} /> },
                  { id: 'term', label: 'Fixed Term', icon: <Calendar size={12} /> },
                  { id: 'monthly', label: 'Monthly Watch', icon: <RefreshCw size={12} /> }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setSubTab(tab.id as SubTab)}
                    className={cn("filter-btn", subTab === tab.id && "active")}
                    style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 6, border: "none", background: subTab === tab.id ? "var(--surface)" : "transparent" }}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* TYPE BREAKDOWN */}
            <div style={{ display: "flex", background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "12px 24px", gap: 32 }}>
              {[
                { label: 'Monthly', key: 'monthly', color: subTab === 'monthly' ? 'var(--text3)' : 'var(--text2)' },
                { label: '3-Month', key: '3-month', color: 'var(--text3)' },
                { label: '6-Month', key: '6-month', color: 'var(--amber)' },
                { label: '12-Month', key: '12-month', color: 'var(--green)' }
              ].map(t => (
                <div key={t.key} style={{ display: 'flex', flexDirection: 'column', gap: 2, opacity: (subTab === 'all' || (subTab === 'monthly' && t.key === 'monthly') || (subTab === 'term' && t.key !== 'monthly')) ? 1 : 0.3 }}>
                  <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 10, textTransform: 'uppercase', color: 'var(--text3)', letterSpacing: '0.05em' }}>{t.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: t.color }}>{subTypeCounts[t.key] || 0}</div>
                </div>
              ))}
            </div>

            {displaySubscribers.map((s) => {
              const st = statusFor(s, m);
              const isMonthly = s.type === 'monthly';
              return (
                <div key={s.id} className={cn("sub-row", isMonthly && "monthly-row")} style={{ height: 60, borderLeft: isMonthly ? "4px solid var(--text3)" : "none" }} onClick={() => setDetailSub(s)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="sub-name">
                      {s.recipient}
                      {s.recipient !== s.billing && <span style={{ color: "var(--text3)", fontSize: 11, fontWeight: 400 }}> · Gift from {s.billing}</span>}
                    </div>
                    <div className="sub-gift">{s.billingEmail || "no email"}</div>
                  </div>
                  <div className="sub-meta">
                    {s.flag && <span className="badge flag">⚑</span>}
                    {isMonthly && <span className="badge" style={{ background: "#eef2ff", color: "var(--text3)", border: "1px solid var(--border)" }}>Watch</span>}
                    <span className={cn("badge", s.type.replace("-", ""))} style={{ background: "var(--surface2)", color: "var(--text2)" }}>{s.type}</span>
                    <span style={{ fontFamily: "DM Mono,monospace", fontSize: 10, color: "var(--text3)" }}>{fmt(s.start)} → {fmt(s.end)}</span>
                    <span className={cn("badge", st)} style={{
                      background: st === "active" ? "#dcfce7" : st === "lapsed" ? "#fee2e2" : "#e0e7ff",
                      color: st === "active" ? "var(--green)" : st === "lapsed" ? "var(--red)" : "var(--text3)"
                    }}>
                      {st}
                    </span>
                    <OrderLink order={s.order} />
                  </div>
                </div>
              );
            })}
            {displaySubscribers.length === 0 && (
              <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--text3)", fontFamily: "DM Mono,monospace", fontSize: 13 }}>
                No subscribers found in this category.
              </div>
            )}
          </>
        )}

        {/* ── CATALOG ── */}
        {activeTab === "catalog" && (
          <>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Monthly Catalog</div>
            </div>
            {ALL_MONTHS.map(mo => {
              const rec = catalogData[mo];
              const isCurrent = mo === "2026-02";
              const subCount = SUBSCRIBERS.filter(s => isActiveForMonth(s, mo)).length;
              
              const predicted = rec?.predictedNew || 0;
              const buffer = rec?.damageBuffer || 0;
              const extras = rec?.shopExtras || 0;
              const suggestedOrder = Math.ceil((subCount + predicted) * (1 + buffer / 100)) + extras;
              const totalCost = rec && rec.wholesaleCost ? rec.wholesaleCost * suggestedOrder : 0;
              
              return (
                <div key={mo} style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 16, background: isCurrent ? "var(--surface2)" : "transparent" }}>
                  <div style={{ fontFamily: "DM Mono,monospace", fontSize: 11, color: isCurrent ? "var(--text3)" : "var(--text3)", minWidth: 70, fontWeight: isCurrent ? "600" : "400" }}>
                    {fmt(mo)}
                    {isCurrent && <div style={{ fontSize: 9, marginTop: 2, letterSpacing: "0.08em", color: "var(--text3)" }}>CURRENT</div>}
                  </div>
                  {rec ? (
                    <>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{rec.album}</div>
                        <div style={{ fontFamily: "DM Mono,monospace", fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{rec.artist} · {rec.label}</div>
                        {rec.notes && <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 4, fontStyle: "italic" }}>"{rec.notes}"</div>}
                      </div>
                      <div style={{ textAlign: "right", minWidth: 180 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600 }}>Suggested: {suggestedOrder} units</span>
                          <span style={{ fontSize: 10, color: "var(--text2)" }}>(${rec.wholesaleCost?.toFixed(2)} × {suggestedOrder})</span>
                          <span style={{ fontWeight: 800, fontSize: 14, color: "var(--text3)", marginTop: 2 }}>
                            Est. Total: ${totalCost.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ fontFamily: "DM Mono,monospace", fontSize: 11, color: "var(--text3)", fontStyle: "italic", flex: 1 }}>No record assigned</div>
                  )}
                  <button 
                    style={{ background: "none", border: "1px solid var(--border2)", color: "var(--text2)", borderRadius: "4px", padding: "4px 10px", cursor: "pointer", fontSize: 10, fontFamily: "DM Mono,monospace" }}
                    onClick={() => setDetailCatalogMonth(mo)}
                  >
                    {rec ? "Edit" : "+ Add"}
                  </button>
                </div>
              );
            })}
          </>
        )}

        {/* ── HISTORY ── */}
        {activeTab === "history" && (
          <>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>Staff Edit History</div>
                <div style={{ fontFamily: "DM Mono,monospace", fontSize: 11, color: "var(--text3)", marginTop: 4 }}>All administrative changes are logged here</div>
              </div>
              <button 
                onClick={() => setHistory([])}
                style={{ background: "none", border: "1px solid var(--border2)", color: "var(--text2)", borderRadius: "4px", padding: "6px 12px", cursor: "pointer", fontSize: 11, fontFamily: "DM Mono,monospace", display: "flex", alignItems: "center", gap: 6 }}
              >
                <Trash2 size={12} /> Clear Log
              </button>
            </div>
            {history.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--text3)", fontFamily: "DM Mono,monospace", fontSize: 12 }}>
                No edit history yet.
              </div>
            ) : (
              <div style={{ padding: 0 }}>
                {history.map((entry) => (
                  <div key={entry.id} style={{ padding: "14px 24px", borderBottom: "1px solid var(--border)", display: "flex", gap: 16 }}>
                    <div style={{ minWidth: 100 }}>
                      <div style={{ fontFamily: "DM Mono,monospace", fontSize: 10, color: "var(--text3)" }}>
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontFamily: "DM Mono,monospace", fontSize: 10, color: "var(--text3)", marginTop: 2 }}>
                        {new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className={cn("badge", entry.category)} style={{ 
                          fontSize: 9, 
                          background: entry.category === 'catalog' ? '#e0e7ff' : entry.category === 'shipping' ? '#dcfce7' : '#f3f4f6',
                          color: entry.category === 'catalog' ? 'var(--text3)' : entry.category === 'shipping' ? 'var(--green)' : 'var(--text2)'
                        }}>
                          {entry.category}
                        </span>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{entry.action}</div>
                      </div>
                      <div style={{ fontSize: 12, marginTop: 4, color: "var(--text)" }}>{entry.details}</div>
                      <div style={{ fontFamily: "DM Mono,monospace", fontSize: 10, color: "var(--text3)", marginTop: 6 }}>Staff: {entry.staffMember}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── CONTACTS ── */}
        {activeTab === "contacts" && (
          <>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Generator & Tools</div>
              <div style={{ fontFamily: "DM Mono,monospace", fontSize: 11, color: "var(--text3)", marginTop: 4 }}>Export lists and generate printouts for the record store</div>
            </div>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontFamily: "DM Mono,monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text3)", marginBottom: 6 }}>Month</div>
                <select className="form-select" style={{ width: 160 }} value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                  {MONTHS.map(mo => <option key={mo} value={mo}>{fmt(mo)}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button 
                  className="submit-btn" 
                  style={{ padding: "8px 16px", fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}
                  onClick={() => {
                    const emails = activeSubs.map(s => s.billingEmail || s.recipientEmail).filter(Boolean);
                    copyEmails(emails, "Active Subscriber");
                  }}
                >
                  Copy All Active Emails
                </button>
                <button 
                  className="submit-btn" 
                  style={{ padding: "8px 16px", fontSize: 11, background: "var(--red)", display: "flex", alignItems: "center", gap: 6 }}
                  onClick={() => {
                    const lapsingEmails = activeSubs
                      .filter(s => isLapsingThisMonth(s, selectedMonth))
                      .map(s => s.billingEmail || s.recipientEmail)
                      .filter(Boolean);
                    copyEmails(lapsingEmails, "Lapsing Subscriber");
                  }}
                >
                  Copy Lapsing Emails
                </button>
                <button 
                  className="submit-btn" 
                  style={{ padding: "8px 16px", fontSize: 11, background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", gap: 6 }}
                  onClick={printPickupList}
                >
                  <Printer size={12} /> Print Pickup Checklist
                </button>
              </div>
            </div>
            <div style={{ padding: "0" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "10px 24px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
                {["Billing Name", "Billing Email", "Recipient", "Recipient Email"].map(h => (
                  <div key={h} style={{ fontFamily: "DM Mono,monospace", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text3)" }}>{h}</div>
                ))}
              </div>
              {activeSubs.map((s, i) => (
                <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "10px 24px", borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "transparent" : "var(--surface)" }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{s.billing}</div>
                  <div style={{ fontFamily: "DM Mono,monospace", fontSize: 11, color: "var(--text3)" }}>{s.billingEmail || "—"}</div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{s.recipient !== s.billing ? s.recipient : "—"}</div>
                  <div style={{ fontFamily: "DM Mono,monospace", fontSize: 11, color: "var(--text3)" }}>{s.recipientEmail || "—"}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── ADD SUB ── */}
        {activeTab === "add" && (
          <div className="add-form">
            <div className="add-form-header">
              <div className="add-form-title">Add New Subscriber</div>
              <div style={{ fontFamily: "DM Mono,monospace", fontSize: 11, color: "var(--text3)", marginTop: 4 }}>Required fields marked *</div>
            </div>
            <div className="form-body">
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Billing Name *</label>
                  <input className="form-input" id="new-billing" placeholder="e.g. Jennifer Davis" />
                </div>
                <div className="form-field">
                  <label className="form-label">Billing Email</label>
                  <input className="form-input" id="new-email" placeholder="email@example.com" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Order # (BigCommerce)</label>
                  <input className="form-input" id="new-order" placeholder="e.g. 15406" />
                </div>
                <div className="form-field">
                  <label className="form-label">Subscription Type *</label>
                  <select className="form-select" id="new-type">
                    <option>3-month</option>
                    <option>6-month</option>
                    <option>12-month</option>
                    <option>monthly</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Start Month *</label>
                  <input className="form-input" id="new-start" placeholder="YYYY-MM e.g. 2026-03" />
                </div>
                <div className="form-field">
                  <label className="form-label">Delivery Method *</label>
                  <select className="form-select" id="new-delivery">
                    <option>ship</option>
                    <option>pickup</option>
                  </select>
                </div>
              </div>

              <div style={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 8, padding: "14px 16px" }}>
                <div className="gift-toggle" onClick={() => setIsGift(!isGift)}>
                  <div className={cn("toggle-track", isGift && "on")}>
                    <div className="toggle-knob" />
                  </div>
                  <div className="gift-label">This is a gift subscription</div>
                </div>
                {isGift && (
                  <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div className="form-field">
                      <label className="form-label">Recipient Name</label>
                      <input className="form-input" id="new-recipient" placeholder="Who's receiving the records?" />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Recipient Email</label>
                      <input className="form-input" id="new-recipient-email" placeholder="recipient@example.com" />
                    </div>
                  </div>
                )}
              </div>

              <div className="form-field">
                <label className="form-label">Notes</label>
                <input className="form-input" id="new-notes" placeholder="Any special instructions…" />
              </div>

              <button 
                className="submit-btn"
                onClick={() => {
                  const billing = (document.getElementById('new-billing') as HTMLInputElement).value;
                  const order = (document.getElementById('new-order') as HTMLInputElement).value;
                  logAction("Added Subscriber", `New subscriber ${billing} added (Order #${order})`, 'subscriber');
                  alert("Subscriber added successfully! (Mock Action)");
                  setActiveTab("subscribers");
                }}
              >
                Add Subscriber + Notify Staff
              </button>
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {activeTab === "settings" && (
          <div className="add-form" style={{ maxWidth: 640 }}>
            <div className="add-form-header">
              <div className="add-form-title">Application Settings</div>
              <div style={{ fontFamily: "DM Mono,monospace", fontSize: 11, color: "var(--text3)", marginTop: 4 }}>Configure external integrations and preferences</div>
            </div>
            <div className="form-body">
              <div className="form-field">
                <label className="form-label">BigCommerce Admin URL</label>
                <input 
                  className="form-input" 
                  placeholder="e.g. https://store-xxxxxx.mybigcommerce.com" 
                  value={bcStoreUrl}
                  onChange={(e) => setBcStoreUrl(e.target.value)}
                />
                <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 6, lineHeight: 1.5 }}>
                  <strong>Important:</strong> Please use your permanent BigCommerce URL (the one that looks like <code>store-xxxxxx.mybigcommerce.com</code>). 
                  <br/><br/>
                  Clicking an order number will now perform a <strong>keyword search</strong> in your BigCommerce manager for that specific order number. 
                  This is the most reliable way to find an order even if internal IDs differ.
                </div>
              </div>
              
              <div style={{ marginTop: 24, padding: 16, background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>About this App</div>
                <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>
                  This tool is designed to bridge the gap between your BigCommerce sales and physical record store fulfillment. 
                  All data is stored locally in your browser's persistent storage.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL PANEL - SUBSCRIBER */}
      <div className={cn("detail-panel", detailSub && "open")}>
        {detailSub && (
          <>
            <div className="detail-header">
              <div>
                <div className="detail-name">{detailSub.recipient}</div>
                <div className="detail-order">
                  <OrderLink order={detailSub.order} /> · {detailSub.type}
                </div>
              </div>
              <button className="close-btn" onClick={() => setDetailSub(null)}><X size={14} /></button>
            </div>

            {detailSub.notes && (
              <div className="detail-section">
                <div className="detail-section-label">Notes</div>
                <div className="notes-box" style={detailSub.flag ? { borderColor: "var(--amber)" } : {}}>
                  {detailSub.notes}
                </div>
                <div className="flag-row">
                  <button 
                    className="flag-toggle"
                    onClick={() => {
                      logAction(detailSub.flag ? "Unflagged" : "Flagged", `${detailSub.recipient} was ${detailSub.flag ? 'unflagged' : 'flagged'}`, 'subscriber');
                      // In a real app we'd update the subscriber state here
                    }}
                  >
                    <Flag size={10} style={{ marginRight: 4, display: 'inline' }} />
                    {detailSub.flag ? "Flagged" : "Flag for Attention"}
                  </button>
                </div>
              </div>
            )}

            <div className="detail-section">
              <div className="detail-section-label">Subscription</div>
              {[
                ["Billing Name", detailSub.billing],
                ["Billing Email", detailSub.billingEmail || "—"],
                ["Recipient", detailSub.recipient],
                ["Type", detailSub.type],
                ["Delivery", detailSub.delivery],
                ["Start", fmt(detailSub.start)],
                ["End", fmt(detailSub.end)],
              ].map(([k, v]) => (
                <div key={k} className="field-row">
                  <span className="field-key">{k}</span>
                  <span className="field-val">{v}</span>
                </div>
              ))}
            </div>

            <div className="detail-section">
              <div className="detail-section-label">Timeline</div>
              <div className="timeline">
                {ALL_MONTHS.map(mo => {
                  const isActive = isActiveForMonth(detailSub, mo);
                  const isCurrent = mo === selectedMonth;
                  return (
                    <div key={mo} className={cn("tl-month", isActive && "active", !isActive && isCurrent && "current")}>
                      {fmt(mo)}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-label">Fulfillment History</div>
              {MONTHS.filter(mo => isActiveForMonth(detailSub, mo)).map(mo => (
                <div key={mo} className="field-row">
                  <span className="field-key">{fmt(mo)}</span>
                  <span className="field-val" style={{ color: shipped.has(detailSub.id) ? "var(--green)" : "var(--text3)" }}>
                    {shipped.has(detailSub.id) ? "✓ Shipped" : "Not yet shipped"}
                  </span>
                </div>
              ))}
            </div>

            <button 
              className="ship-btn"
              disabled={shipped.has(detailSub.id)}
              onClick={() => toggleShip(detailSub.id)}
            >
              {shipped.has(detailSub.id) ? (
                <>
                  <Check size={14} style={{ marginRight: 6, display: 'inline' }} />
                  Shipped for {fmt(selectedMonth)}
                </>
              ) : (
                <>
                  <Package size={14} style={{ marginRight: 6, display: 'inline' }} />
                  Mark Shipped for {fmt(selectedMonth)}
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* DETAIL PANEL - CATALOG */}
      <div className={cn("detail-panel", detailCatalogMonth && "open")}>
        {detailCatalogMonth && (
          <>
            <div className="detail-header">
              <div>
                <div className="detail-name">{fmt(detailCatalogMonth)}</div>
                <div className="detail-order">Monthly Catalog Entry</div>
              </div>
              <button className="close-btn" onClick={() => setDetailCatalogMonth(null)}><X size={14} /></button>
            </div>

            <div className="detail-section">
              <div className="detail-section-label">Album Details</div>
              <div className="form-body" style={{ padding: 0 }}>
                <div className="form-field">
                  <label className="form-label">Artist</label>
                  <input 
                    className="form-input" 
                    defaultValue={catalogData[detailCatalogMonth]?.artist || ""} 
                    id="edit-artist"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Album Title</label>
                  <input 
                    className="form-input" 
                    defaultValue={catalogData[detailCatalogMonth]?.album || ""} 
                    id="edit-album"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Label</label>
                  <input 
                    className="form-input" 
                    defaultValue={catalogData[detailCatalogMonth]?.label || ""} 
                    id="edit-label"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Label Contact</label>
                  <input 
                    className="form-input" 
                    defaultValue={catalogData[detailCatalogMonth]?.contact || ""} 
                    id="edit-contact"
                    placeholder="Email or phone number"
                  />
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Wholesale Cost (Unit)</label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 10, top: 8, fontSize: 12, color: "var(--text3)" }}>$</span>
                      <input 
                        type="number"
                        step="0.01"
                        className="form-input" 
                        style={{ paddingLeft: 24 }}
                        defaultValue={catalogData[detailCatalogMonth]?.wholesaleCost || ""} 
                        id="edit-cost"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Active Subs</label>
                    <div className="form-input" style={{ background: "var(--surface2)", border: "1px solid var(--border)", display: "flex", alignItems: "center" }}>
                      {SUBSCRIBERS.filter(s => isActiveForMonth(s, detailCatalogMonth)).length}
                    </div>
                  </div>
                </div>

                <div className="detail-section-label" style={{ marginTop: 20 }}>Forecasting & Ordering</div>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Predicted New Subs</label>
                    <input 
                      type="number"
                      className="form-input" 
                      defaultValue={catalogData[detailCatalogMonth]?.predictedNew || 0} 
                      id="edit-predicted"
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Damage Buffer %</label>
                    <input 
                      type="number"
                      className="form-input" 
                      defaultValue={catalogData[detailCatalogMonth]?.damageBuffer || 5} 
                      id="edit-buffer"
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Shop Extras (Retail copies)</label>
                  <input 
                    type="number"
                    className="form-input" 
                    defaultValue={catalogData[detailCatalogMonth]?.shopExtras || 0} 
                    id="edit-extras"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Notes</label>
                  <textarea 
                    className="form-input" 
                    style={{ minHeight: 80, resize: 'vertical' }}
                    defaultValue={catalogData[detailCatalogMonth]?.notes || ""} 
                    id="edit-catalog-notes"
                    placeholder="Ordering details, release dates, etc."
                  />
                </div>
              </div>
            </div>

            <button 
              className="ship-btn"
              onClick={() => {
                const artist = (document.getElementById('edit-artist') as HTMLInputElement).value;
                const album = (document.getElementById('edit-album') as HTMLInputElement).value;
                const label = (document.getElementById('edit-label') as HTMLInputElement).value;
                const contact = (document.getElementById('edit-contact') as HTMLInputElement).value;
                const notes = (document.getElementById('edit-catalog-notes') as HTMLTextAreaElement).value;
                const cost = parseFloat((document.getElementById('edit-cost') as HTMLInputElement).value) || 0;
                const predicted = parseInt((document.getElementById('edit-predicted') as HTMLInputElement).value) || 0;
                const buffer = parseInt((document.getElementById('edit-buffer') as HTMLInputElement).value) || 0;
                const extras = parseInt((document.getElementById('edit-extras') as HTMLInputElement).value) || 0;
                updateCatalog(detailCatalogMonth, artist, album, label, contact, notes, cost, predicted, buffer, extras);
              }}
            >
              <Save size={14} style={{ marginRight: 6, display: 'inline' }} />
              Save Catalog Entry
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
