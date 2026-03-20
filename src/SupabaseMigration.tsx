import { useState } from 'react';
import { supabase } from './supabase';
import { SUBSCRIBERS, CATALOG } from './constants';
import { Loader2, Database, Check, AlertTriangle } from 'lucide-react';

export default function SupabaseMigration() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const migrate = async () => {
    if (!confirm("This will upload all local data to Supabase. Continue?")) return;
    
    setLoading(true);
    setError(null);
    setStatus('Starting migration...');

    try {
      // 1. Subscribers
      setStatus(`Migrating ${SUBSCRIBERS.length} subscribers...`);
      const { error: subError } = await supabase.from('subscribers').insert(
        SUBSCRIBERS.map(s => ({
          // We let Supabase generate the ID to ensure UUID validity, 
          // or we can try to use the existing ID if it's a valid UUID.
          // Since existing IDs are "1", "2", etc., we should let Supabase generate new ones
          // OR map them to order_id if unique.
          order_id: s.order,
          billing_name: s.billing,
          billing_email: s.billingEmail,
          recipient_name: s.recipient,
          recipient_email: s.recipientEmail,
          subscription_type: s.type,
          delivery_method: s.delivery,
          start_month: s.start,
          end_month: s.end,
          notes: s.notes,
          is_flagged: s.flag
        }))
      );
      if (subError) throw subError;

      // 2. Catalog
      setStatus('Migrating catalog...');
      const catalogItems = Object.entries(CATALOG).map(([month, item]) => ({
        month,
        artist: item.artist,
        album: item.album,
        label: item.label,
        contact_info: item.contact,
        notes: item.notes,
        wholesale_cost: item.wholesaleCost,
        predicted_new: item.predictedNew,
        damage_buffer: item.damageBuffer,
        shop_extras: item.shopExtras,
        jxn_subs: item.jxnSubs || 0
      }));

      const { error: catError } = await supabase.from('catalog').upsert(catalogItems);
      if (catError) throw catError;

      setStatus('Migration complete!');
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Migration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, margin: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Database size={16} />
        <strong>Data Migration Tool</strong>
      </div>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
        Use this to populate your fresh Supabase database with the initial data from the local constants file.
      </p>
      
      {error && (
        <div style={{ color: '#ef4444', background: '#fee2e2', padding: 10, borderRadius: 6, marginBottom: 10, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {status && !error && (
         <div style={{ color: loading ? '#3b82f6' : '#22c55e', padding: 10, marginBottom: 10, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
           {loading ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />} {status}
         </div>
      )}

      <button 
        onClick={migrate} 
        disabled={loading}
        className="submit-btn"
        style={{ width: '100%' }}
      >
        {loading ? 'Migrating...' : 'Run Migration'}
      </button>
    </div>
  );
}
