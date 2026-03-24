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
  Printer,
  Settings,
  ExternalLink,
  Calendar,
  RefreshCw,
  Sparkles,
  Loader2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import './App.css';
import { MONTHS } from './constants';
import { MUSIC_QUOTES } from './quotes';
import type { Subscriber, Catalog, HistoryEntry } from './types';
import { isActiveForMonth, isNewThisMonth, isLapsingThisMonth, statusFor, fmt, getCurrentMonth } from './utils';
import logo from './assets/logo.png';
import { supabase } from './supabase';
import SupabaseMigration from './SupabaseMigration';

// Helper for tailwind-like class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'dashboard' | 'subscribers' | 'catalog' | 'contacts' | 'add' | 'history' | 'settings';
type SubTab = 'all' | 'term' | 'monthly' | 'flagged';


function App() {
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [catalogData, setCatalogData] = useState<Catalog>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [dbMonths, setDbMonths] = useState<string[]>(MONTHS);

  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [subTab, setSubTab] = useState<SubTab>("all");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [filter, setFilter] = useState("all");
  const [searchQ, setSearchQ] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [detailSub, setDetailSub] = useState<Subscriber | null>(null);
  const [detailCatalogMonth, setDetailCatalogMonth] = useState<string | null>(null);
  const [isGift, setIsGift] = useState(false);
  const [bcStoreUrl, setBcStoreUrl] = useState(() => localStorage.getItem('bcStoreUrl') || "");
  const searchRef = useRef<HTMLInputElement>(null);

  const zenQuote = useMemo(() => {
    return MUSIC_QUOTES[Math.floor(Math.random() * MUSIC_QUOTES.length)];
  }, []);

  useEffect(() => {
    localStorage.setItem('bcStoreUrl', bcStoreUrl);
  }, [bcStoreUrl]);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    
    // 1. Subscribers
    const { data: subData } = await supabase
      .from('subscribers')
      .select('*')
      .order('created_at', { ascending: false });

    if (subData) {
      setSubscribers(subData.map(s => ({
        id: s.id,
        order: s.order_id,
        billing: s.billing_name,
        billingEmail: s.billing_email,
        recipient: s.recipient_name,
        recipientEmail: s.recipient_email,
        type: s.subscription_type as any,
        delivery: s.delivery_method as any,
        start: s.start_month,
        end: s.end_month,
        notes: s.notes,
        flag: s.is_flagged,
        signupDate: s.signup_date,
        shipped_months: s.shipped_months || []
      })));
    }

    // 2. Catalog
    const { data: catData } = await supabase.from('catalog').select('*');
    if (catData) {
      const newCatalog: Catalog = {};
      const fetchedMonths: string[] = [];
      catData.forEach(c => {
        fetchedMonths.push(c.month);
        newCatalog[c.month] = {
          artist: c.artist,
          album: c.album,
          label: c.label,
          contact: c.contact_info,
          notes: c.notes,
          wholesaleCost: c.wholesale_cost,
          predictedNew: c.predicted_new,
          damageBuffer: c.damage_buffer,
          shopExtras: c.shop_extras,
          jxnSubs: c.jxn_subs
        };
      });
      
      // Merge with default months and sort
      const allUniqueMonths = Array.from(new Set([...MONTHS, ...fetchedMonths])).sort();
      setDbMonths(allUniqueMonths);
      setCatalogData(newCatalog);
    }

    // 3. History
    const { data: histData } = await supabase
      .from('history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (histData) {
      setHistory(histData.map(h => ({
        id: h.id,
        timestamp: h.created_at,
        action: h.action,
        details: h.details,
        staffMember: h.staff_member,
        category: h.category as any
      })));
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const m = selectedMonth;

  // New month helper
  function getNextMonthString(lastMonth: string) {
    const [y, m] = lastMonth.split('-').map(Number);
    let nextY = y;
    let nextM = m + 1;
    if (nextM > 12) {
      nextM = 1;
      nextY++;
    }
    return `${nextY}-${nextM.toString().padStart(2, '0')}`;
  }

  async function addMonth() {
    const lastMonth = dbMonths[dbMonths.length - 1];
    const newMonth = getNextMonthString(lastMonth);
    
    if (!confirm(`Add ${fmt(newMonth)} to the catalog?`)) return;

    // Optimistic update
    setDbMonths(prev => [...prev, newMonth].sort());
    setCatalogData(prev => ({
      ...prev,
      [newMonth]: { artist: "TBD", album: "TBD", label: "TBD", wholesaleCost: 0 }
    }));

    const { error } = await supabase.from('catalog').insert({
      month: newMonth,
      artist: 'TBD',
      album: 'TBD',
      label: 'TBD',
      wholesale_cost: 0
    });

    if (error) {
      alert("Error adding month: " + error.message);
      fetchData(); // Rollback
    } else {
      logAction("Added Month", `New month ${fmt(newMonth)} added to catalog.`, 'catalog');
      setSelectedMonth(newMonth);
    }
  }
  
  // Derived State
  const activeSubs = useMemo(() => subscribers.filter(s => isActiveForMonth(s, m)), [subscribers, m]);
  const shipSubs = useMemo(() => activeSubs.filter(s => s.delivery === "ship"), [activeSubs]);
  const pickupSubs = useMemo(() => activeSubs.filter(s => s.delivery === "pickup"), [activeSubs]);
  const newSubs = useMemo(() => activeSubs.filter(s => isNewThisMonth(s, m)), [activeSubs, m]);
  const lapsingSubs = useMemo(() => activeSubs.filter(s => isLapsingThisMonth(s, m)), [activeSubs, m]);
  const lapsedCount = useMemo(() => subscribers.filter(s => s.end && s.end < m).length, [subscribers, m]);

  // "Shipped" logic is now derived from the subscriber's data
  const shipped = useMemo(() => {
    const set = new Set<string>();
    activeSubs.forEach(s => {
      if (s.shipped_months?.includes(m)) {
        set.add(s.id);
      }
    });
    return set;
  }, [activeSubs, m]);

  const shippedThisMonth = useMemo(() => activeSubs.filter(s => shipped.has(s.id)), [activeSubs, shipped]);
  const totalToShip = activeSubs.length;
  const shippedCount = shippedThisMonth.length;

  const filteredSubs = useMemo(() => activeSubs.filter(s => {
    if (filter === "unshipped") return !shipped.has(s.id);
    if (filter === "pickup") return s.delivery === "pickup";
    if (filter === "flagged") return s.flag || s.notes?.includes("ASK") || s.notes?.includes("!!");
    return true;
  }), [activeSubs, filter, shipped]);

  const toShip = useMemo(() => filteredSubs.filter(s => !shipped.has(s.id) && s.delivery === 'ship'), [filteredSubs, shipped]);
  const toPickUp = useMemo(() => filteredSubs.filter(s => !shipped.has(s.id) && s.delivery === 'pickup'), [filteredSubs, shipped]);
  const shippedList = useMemo(() => filteredSubs.filter(s => shipped.has(s.id) && s.delivery === 'ship'), [filteredSubs, shipped]);
  const pickedUpList = useMemo(() => filteredSubs.filter(s => shipped.has(s.id) && s.delivery === 'pickup'), [filteredSubs, shipped]);

  const searchResults = useMemo(() => searchQ.length > 1
    ? subscribers.filter(s =>
        s.order?.toLowerCase().includes(searchQ.toLowerCase()) ||
        s.billing.toLowerCase().includes(searchQ.toLowerCase()) ||
        s.recipient.toLowerCase().includes(searchQ.toLowerCase()) ||
        s.billingEmail?.toLowerCase().includes(searchQ.toLowerCase())
      ).slice(0, 6)
    : [], [searchQ, subscribers]);

  const subTypeCounts = useMemo(() => {
    return subscribers.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [subscribers]);

  const displaySubscribers = useMemo(() => {
    return subscribers.filter(s => {
      if (subTab === 'flagged') return s.flag;
      if (subTab === 'monthly') return s.type === 'monthly';
      if (subTab === 'term') return s.type !== 'monthly';
      return true;
    });
  }, [subscribers, subTab]);

  // Actions
  async function logAction(action: string, details: string, category: HistoryEntry['category']) {
    // Optimistic update
    const newEntry: HistoryEntry = {
      id: Math.random().toString(),
      timestamp: new Date().toISOString(),
      action,
      details,
      staffMember: "You",
      category
    };
    setHistory(prev => [newEntry, ...prev]);

    await supabase.from('history').insert({
      action,
      details,
      staff_member: 'Staff', // ideally get from auth user
      category
    });
  }

  async function deleteSubscriber(id: string) {
    if (!confirm("Are you sure you want to permanently remove this subscriber? This cannot be undone.")) return;
    
    const { error } = await supabase.from('subscribers').delete().eq('id', id);
    if (error) {
      alert("Error deleting: " + error.message);
    } else {
      setSubscribers(prev => prev.filter(s => s.id !== id));
      setDetailSub(null);
      logAction("Deleted Subscriber", `Subscriber removed from database.`, 'subscriber');
    }
  }

  async function toggleShip(id: string, monthOverride?: string) {
    const targetMonth = monthOverride || m;
    const sub = subscribers.find(s => s.id === id);
    if (!sub) return;

    const currentMonths = sub.shipped_months || [];
    const isShipped = currentMonths.includes(targetMonth);
    
    let newMonths;
    if (isShipped) {
      newMonths = currentMonths.filter(mo => mo !== targetMonth);
    } else {
      newMonths = [...currentMonths, targetMonth];
    }

    // Optimistic update
    setSubscribers(prev => prev.map(s => s.id === id ? { ...s, shipped_months: newMonths } : s));
    if (detailSub && detailSub.id === id) {
      setDetailSub({ ...detailSub, shipped_months: newMonths });
    }

    // DB Update
    const { error } = await supabase
      .from('subscribers')
      .update({ shipped_months: newMonths })
      .eq('id', id);
    
    if (error) {
      console.error("Error updating shipping:", error);
      fetchData(); // Rollback
    } else {
      logAction(
        isShipped ? "Unmarked Shipping" : "Marked Shipped",
        `${sub?.recipient} marked as ${!isShipped ? 'shipped' : 'unshipped'} for ${fmt(targetMonth)}`,
        'shipping'
      );
    }
  }

  async function updateSubscriber(
    id: string, 
    billing: string, 
    billingEmail: string, 
    recipient: string, 
    recipientEmail: string, 
    order: string, 
    type: string, 
    delivery: string, 
    start: string, 
    end: string | null, 
    signupDate: string | null
  ) {
    // Optimistic
    setSubscribers(prev => prev.map(s => s.id === id ? { 
      ...s, 
      billing, 
      billingEmail, 
      recipient, 
      recipientEmail, 
      order, 
      type: type as any, 
      delivery: delivery as any, 
      start, 
      end, 
      signupDate: signupDate || undefined 
    } : s));

    const { error } = await supabase.from('subscribers').update({
      billing_name: billing,
      billing_email: billingEmail,
      recipient_name: recipient,
      recipient_email: recipientEmail,
      order_id: order,
      subscription_type: type,
      delivery_method: delivery,
      start_month: start,
      end_month: end,
      signup_date: signupDate
    }).eq('id', id);

    if (error) {
      alert("Error saving: " + error.message);
      fetchData();
    } else {
      logAction("Updated Subscriber", `Details updated for ${recipient}`, 'subscriber');
      alert("Subscriber updated successfully!");
    }
  }

  async function updateCatalog(
    month: string, 
    artist: string, 
    album: string, 
    label: string, 
    contact: string, 
    notes: string, 
    wholesaleCost: number,
    predictedNew: number,
    damageBuffer: number,
    shopExtras: number,
    jxnSubs: number
  ) {
    // Optimistic
    setCatalogData(prev => ({
      ...prev,
      [month]: { artist, album, label, contact, notes, wholesaleCost, predictedNew, damageBuffer, shopExtras, jxnSubs }
    }));
    setDetailCatalogMonth(null);

    // DB Update
    const { error } = await supabase.from('catalog').upsert({
      month,
      artist,
      album,
      label,
      contact_info: contact,
      notes,
      wholesale_cost: wholesaleCost,
      predicted_new: predictedNew,
      damage_buffer: damageBuffer,
      shop_extras: shopExtras,
      jxn_subs: jxnSubs
    }, { onConflict: 'month' });

    if (error) {
      console.error("Error updating catalog:", error);
      alert("Error saving catalog: " + error.message);
      fetchData(); // rollback
    } else {
      logAction(
        "Updated Catalog",
        `Changed ${fmt(month)} to ${artist} — ${album}.`,
        'catalog'
      );
      alert("Catalog updated successfully!");
    }
  }

  const getBCOrderLink = (orderNum: string) => {
    if (!bcStoreUrl || !orderNum || orderNum === "INSTORE") return null;
    
    // Clean up order number (remove # if present)
    const cleanOrder = orderNum.toString().replace("#", "").trim();
    if (!cleanOrder) return null;

    let cleanUrl = bcStoreUrl.trim().replace(/\/+$/, "");
    
    // If it's a full URL like store-xyz.mybigcommerce.com/manage/dashboard
    // Extract the base domain + /manage
    if (cleanUrl.includes(".mybigcommerce.com")) {
      const match = cleanUrl.match(/^(https?:\/\/[^\/]+)/);
      if (match) {
        cleanUrl = `${match[1]}/manage`;
      }
    }

    if (!cleanUrl.includes("/manage")) {
      cleanUrl = `${cleanUrl}/manage`;
    }
    
    return `${cleanUrl}/orders?keywords=${cleanOrder}`;
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

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
        <Loader2 className="animate-spin" size={24} color="var(--text3)" />
      </div>
    );
  }

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
              {dbMonths.map(mo => (
                <button 
                  key={mo} 
                  className={cn("month-btn", selectedMonth === mo && "active")} 
                  onClick={() => setSelectedMonth(mo)}
                >
                  {fmt(mo)}
                </button>
              ))}
              <button className="month-btn" onClick={addMonth} title="Add New Month">
                <Plus size={14} />
              </button>
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
                <div className="stat-label">TOTAL SUBS</div>
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

            {toShip.length > 0 && (
              <>
                <div className="section-divider">To Ship — {toShip.length}</div>
                {toShip.map(s => <SubRow key={s.id} sub={s} />)}
              </>
            )}
            {toPickUp.length > 0 && (
              <>
                <div className="section-divider">To Pick Up — {toPickUp.length}</div>
                {toPickUp.map(s => <SubRow key={s.id} sub={s} />)}
              </>
            )}
            {shippedList.length > 0 && (
              <>
                <div className="section-divider">Shipped — {shippedList.length}</div>
                {shippedList.map(s => <SubRow key={s.id} sub={s} />)}
              </>
            )}
            {pickedUpList.length > 0 && (
              <>
                <div className="section-divider">Picked Up — {pickedUpList.length}</div>
                {pickedUpList.map(s => <SubRow key={s.id} sub={s} />)}
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
                  { id: 'monthly', label: 'Monthly Watch', icon: <RefreshCw size={12} /> },
                  { id: 'flagged', label: 'Flagged', icon: <Flag size={12} /> }
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
                    {isMonthly && s.signupDate && (
                      <span className="badge" style={{ background: "#f0fdf4", color: "var(--green)", border: "1px solid #dcfce7" }}>
                        Day {new Date(s.signupDate).getDate()}
                      </span>
                    )}
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
            {dbMonths.map(mo => {
              const rec = catalogData[mo];
              const isCurrent = mo === getCurrentMonth();
              const subCount = subscribers.filter(s => isActiveForMonth(s, mo)).length;
              
              const predicted = rec?.predictedNew || 0;
              const buffer = rec?.damageBuffer || 0;
              const extras = rec?.shopExtras || 0;
              const jxn = rec?.jxnSubs || 0;
              const suggestedOrder = Math.ceil((subCount + predicted) * (1 + buffer / 100)) + extras + jxn;
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
                onClick={fetchData}
                style={{ background: "none", border: "1px solid var(--border2)", color: "var(--text2)", borderRadius: "4px", padding: "6px 12px", cursor: "pointer", fontSize: 11, fontFamily: "DM Mono,monospace", display: "flex", alignItems: "center", gap: 6 }}
              >
                <RefreshCw size={12} /> Refresh
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
                  {dbMonths.map(mo => 
                  <option key={mo} value={mo}>{fmt(mo)}</option>
                )}
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

              <div className="form-field">
                <label className="form-label">Signup/Charge Date (Especially for Monthly)</label>
                <input className="form-input" type="date" id="new-signup-date" />
              </div>

              <button 
                className="submit-btn"
                onClick={async () => {
                  const billing = (document.getElementById('new-billing') as HTMLInputElement).value;
                  const order = (document.getElementById('new-order') as HTMLInputElement).value;
                  const email = (document.getElementById('new-email') as HTMLInputElement).value;
                  const type = (document.getElementById('new-type') as HTMLInputElement).value;
                  const delivery = (document.getElementById('new-delivery') as HTMLInputElement).value;
                  const start = (document.getElementById('new-start') as HTMLInputElement).value;
                  const notes = (document.getElementById('new-notes') as HTMLInputElement).value;
                  const signupDate = (document.getElementById('new-signup-date') as HTMLInputElement).value;
                  
                  // Calculate End (simple approximation)
                  // In a real app we'd use date-fns to add months
                  // For now, let's leave end null or ask user? 
                  // Let's just assume we need logic.
                  // Or let the user input end date if needed.
                  // For now, let's just insert what we have.

                  const { error } = await supabase.from('subscribers').insert({
                    billing_name: billing,
                    billing_email: email,
                    order_id: order,
                    recipient_name: isGift ? (document.getElementById('new-recipient') as HTMLInputElement).value : billing,
                    recipient_email: isGift ? (document.getElementById('new-recipient-email') as HTMLInputElement).value : email,
                    subscription_type: type,
                    delivery_method: delivery,
                    start_month: start,
                    notes: notes,
                    signup_date: signupDate || null
                  });

                  if (error) {
                    alert('Error: ' + error.message);
                  } else {
                    logAction("Added Subscriber", `New subscriber ${billing} added (Order #${order})`, 'subscriber');
                    alert("Subscriber added successfully!");
                    fetchData();
                    setActiveTab("subscribers");
                  }
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
                  <strong>Important:</strong> Enter your BigCommerce store URL. 
                  Order numbers will link to your manager search.
                </div>
              </div>
              
              <SupabaseMigration />

              <div style={{ marginTop: 24, padding: 16, background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>About this App</div>
                <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>
                  This tool is designed to bridge the gap between your BigCommerce sales and physical record store fulfillment. 
                </div>
              </div>

              <button 
                className="submit-btn" 
                style={{ marginTop: 20, background: 'var(--red)' }}
                onClick={() => supabase.auth.signOut()}
              >
                Sign Out
              </button>
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

            <div className="detail-section">
              <div className="detail-section-label">Notes & Attention</div>
              <textarea 
                className="form-input" 
                style={{ minHeight: 80, resize: 'vertical', fontSize: 11, fontFamily: 'var(--font-mono)', marginBottom: 12, width: '100%', boxSizing: 'border-box' }}
                defaultValue={detailSub.notes || ""} 
                id={`edit-sub-notes-${detailSub.id}`}
                placeholder="Add special instructions, flag reasons, etc."
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  className="submit-btn"
                  style={{ flex: 1, padding: '6px 12px', fontSize: 11 }}
                  onClick={async () => {
                    const newNotes = (document.getElementById(`edit-sub-notes-${detailSub.id}`) as HTMLTextAreaElement).value;
                    // Optimistic
                    setSubscribers(prev => prev.map(s => s.id === detailSub.id ? { ...s, notes: newNotes } : s));
                    setDetailSub(prev => prev ? { ...prev, notes: newNotes } : null);
                    
                    await supabase.from('subscribers').update({ notes: newNotes }).eq('id', detailSub.id);
                    logAction("Updated Notes", `Notes updated for ${detailSub.recipient}`, 'subscriber');
                    alert("Notes saved.");
                  }}
                >
                  Save Notes
                </button>
                <button 
                  className={cn("flag-toggle", detailSub.flag && "active")}
                  style={{ 
                    flex: 1, 
                    justifyContent: 'center', 
                    background: detailSub.flag ? 'var(--amber)' : 'none',
                    color: detailSub.flag ? '#fff' : 'var(--amber)',
                    borderColor: 'var(--amber)',
                    borderStyle: 'solid',
                    borderWidth: 1,
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={async () => {
                    const newFlag = !detailSub.flag;
                    // Optimistic
                    setSubscribers(prev => prev.map(s => s.id === detailSub.id ? { ...s, flag: newFlag } : s));
                    setDetailSub(prev => prev ? { ...prev, flag: newFlag } : null);
                    
                    await supabase.from('subscribers').update({ is_flagged: newFlag }).eq('id', detailSub.id);
                    logAction(newFlag ? "Flagged" : "Unflagged", `${detailSub.recipient} was ${newFlag ? 'flagged' : 'unflagged'}`, 'subscriber');
                  }}
                >
                  <Flag size={11} style={{ marginRight: 6 }} fill={detailSub.flag ? "#fff" : "none"} />
                  {detailSub.flag ? "Flagged" : "Flag for Attention"}
                </button>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-label">Subscription Details</div>
              <div className="form-body" style={{ padding: 0 }}>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Billing Name</label>
                    <input className="form-input" id="edit-sub-billing" defaultValue={detailSub.billing} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Billing Email</label>
                    <input className="form-input" id="edit-sub-billingEmail" defaultValue={detailSub.billingEmail || ""} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Recipient Name</label>
                    <input className="form-input" id="edit-sub-recipient" defaultValue={detailSub.recipient} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Recipient Email</label>
                    <input className="form-input" id="edit-sub-recipientEmail" defaultValue={detailSub.recipientEmail || ""} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Order #</label>
                    <input className="form-input" id="edit-sub-order" defaultValue={detailSub.order} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Type</label>
                    <select className="form-select" id="edit-sub-type" defaultValue={detailSub.type}>
                      <option>3-month</option>
                      <option>6-month</option>
                      <option>12-month</option>
                      <option>monthly</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Delivery</label>
                    <select className="form-select" id="edit-sub-delivery" defaultValue={detailSub.delivery}>
                      <option>ship</option>
                      <option>pickup</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Signup Date</label>
                    <input className="form-input" type="date" id="edit-sub-signupDate" defaultValue={detailSub.signupDate || ""} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Start Month (YYYY-MM)</label>
                    <input className="form-input" id="edit-sub-start" defaultValue={detailSub.start} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">End Month (YYYY-MM)</label>
                    <input className="form-input" id="edit-sub-end" defaultValue={detailSub.end || ""} />
                  </div>
                </div>
              </div>

              <button 
                className="ship-btn"
                style={{ marginTop: 16, background: 'var(--text3)' }}
                onClick={() => {
                  const billing = (document.getElementById('edit-sub-billing') as HTMLInputElement).value;
                  const billingEmail = (document.getElementById('edit-sub-billingEmail') as HTMLInputElement).value;
                  const recipient = (document.getElementById('edit-sub-recipient') as HTMLInputElement).value;
                  const recipientEmail = (document.getElementById('edit-sub-recipientEmail') as HTMLInputElement).value;
                  const order = (document.getElementById('edit-sub-order') as HTMLInputElement).value;
                  const type = (document.getElementById('edit-sub-type') as HTMLSelectElement).value;
                  const delivery = (document.getElementById('edit-sub-delivery') as HTMLSelectElement).value;
                  const start = (document.getElementById('edit-sub-start') as HTMLInputElement).value;
                  const end = (document.getElementById('edit-sub-end') as HTMLInputElement).value || null;
                  const signupDate = (document.getElementById('edit-sub-signupDate') as HTMLInputElement).value || null;
                  
                  updateSubscriber(detailSub.id, billing, billingEmail, recipient, recipientEmail, order, type, delivery, start, end, signupDate);
                }}
              >
                <Save size={14} style={{ marginRight: 6, display: 'inline' }} />
                Save Subscriber Changes
              </button>
            </div>

            <div className="detail-section">
              <div className="detail-section-label">Timeline</div>
              <div className="timeline">
                {dbMonths.map(mo => {
                  const isActive = isActiveForMonth(detailSub, mo);
                  const isCurrent = mo === selectedMonth;
                  const isMoShipped = detailSub.shipped_months?.includes(mo);
                  return (
                    <div 
                      key={mo} 
                      className={cn("tl-month", isActive && "active", !isActive && isCurrent && "current", isMoShipped && "shipped")}
                      onClick={() => toggleShip(detailSub.id, mo)}
                      style={{ cursor: 'pointer' }}
                      title={isMoShipped ? "Mark as Unshipped" : "Mark as Shipped"}
                    >
                      {fmt(mo)}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-section-label">Fulfillment History</div>
              {dbMonths.filter(mo => isActiveForMonth(detailSub, mo)).map(mo => {
                const isMoShipped = detailSub.shipped_months?.includes(mo);
                return (
                  <div key={mo} className="field-row">
                    <span className="field-key">{fmt(mo)}</span>
                    <button 
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        padding: 0, 
                        cursor: 'pointer',
                        color: isMoShipped ? "var(--green)" : "var(--text3)",
                        fontWeight: 600,
                        fontSize: 12,
                        textAlign: 'right'
                      }}
                      onClick={() => toggleShip(detailSub.id, mo)}
                    >
                      {isMoShipped ? "✓ Shipped" : "Not yet shipped"}
                    </button>
                  </div>
                );
              })}
            </div>

            <button 
              className="ship-btn"
              onClick={() => toggleShip(detailSub.id)}
            >
              {detailSub.shipped_months?.includes(selectedMonth) ? (
                <>
                  <Check size={14} style={{ marginRight: 6, display: 'inline' }} />
                  {detailSub.delivery === 'pickup' ? 'Picked Up' : 'Shipped'} for {fmt(selectedMonth)}
                </>
              ) : (
                <>
                  <Package size={14} style={{ marginRight: 6, display: 'inline' }} />
                  Mark {detailSub.delivery === 'pickup' ? 'Picked Up' : 'Shipped'} for {fmt(selectedMonth)}
                </>
              )}
            </button>

            <button 
              className="submit-btn"
              style={{ marginTop: 12, background: "none", border: "1px solid #fee2e2", color: "var(--red)", width: "100%" }}
              onClick={() => deleteSubscriber(detailSub.id)}
            >
              <Trash2 size={14} style={{ marginRight: 6, display: 'inline' }} />
              Delete Subscriber
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
                      {subscribers.filter(s => isActiveForMonth(s, detailCatalogMonth)).length}
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
                  <label className="form-label">JXN Subs</label>
                  <input 
                    type="number"
                    className="form-input" 
                    defaultValue={catalogData[detailCatalogMonth]?.jxnSubs || 0} 
                    id="edit-jxn"
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
                const jxn = parseInt((document.getElementById('edit-jxn') as HTMLInputElement).value) || 0;
                updateCatalog(detailCatalogMonth, artist, album, label, contact, notes, cost, predicted, buffer, extras, jxn);
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
