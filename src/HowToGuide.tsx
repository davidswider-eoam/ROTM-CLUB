import React, { useState } from 'react';
import { 
  Package, 
  Truck, 
  Disc, 
  Sparkles, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Calendar, 
  Users, 
  Info,
  Mail
} from 'lucide-react';

export const HowToGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'all' | 'shipping' | 'attention' | 'pickups' | 'subscribers' | 'goldenticket'>('all');

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 24px 80px' }}>
      {/* Header */}
      <div style={{ 
        background: 'var(--surface)', 
        border: '1px solid var(--border)', 
        borderRadius: 12, 
        padding: '28px 32px',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ 
              background: '#0284c7', 
              color: '#fff', 
              padding: '4px 8px', 
              borderRadius: 6, 
              fontSize: 11, 
              fontWeight: 800,
              fontFamily: 'var(--font-mono)'
            }}>
              SOP & GUIDE
            </span>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>
              ROTM Club Operations Manual
            </h1>
          </div>
          <p style={{ margin: 0, color: 'var(--text2)', fontSize: 13, lineHeight: 1.5 }}>
            Standard operating procedures and step-by-step guides for fulfillment, shipping, subscriber management, and monthly routines.
          </p>
        </div>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'flex-end', 
          gap: 4, 
          fontFamily: 'var(--font-mono)', 
          fontSize: 11, 
          color: 'var(--text3)' 
        }}>
          <div>The End of All Music</div>
          <div style={{ color: 'var(--green)', fontWeight: 600 }}>● Club Management System</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: '📖 All Guides', icon: <FileText size={13} /> },
          { id: 'shipping', label: '📦 Shipping & Pirate Ship', icon: <Truck size={13} /> },
          { id: 'attention', label: '⭐ Action Center & Notes', icon: <Sparkles size={13} /> },
          { id: 'goldenticket', label: '🎟️ Golden Ticket Renewals', icon: <Printer size={13} /> },
          { id: 'pickups', label: '🏪 In-Store Pickups & Contacts', icon: <Users size={13} /> },
          { id: 'subscribers', label: '➕ Adding / Editing Subs', icon: <PlusIcon size={13} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            style={{
              background: activeSection === tab.id ? 'var(--text)' : 'var(--surface)',
              color: activeSection === tab.id ? '#fff' : 'var(--text2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ── 1. MONTHLY OVERVIEW & TIMELINE ── */}
        {(activeSection === 'all' || activeSection === 'shipping') && (
          <div className="guide-card" style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ ...iconBadgeStyle, background: '#e0f2fe', color: '#0284c7' }}>
                  <Calendar size={18} />
                </div>
                <div>
                  <h2 style={cardTitleStyle}>1. Monthly Schedule & Overview</h2>
                  <div style={cardSubtitleStyle}>What happens each month and how the cycle works</div>
                </div>
              </div>
            </div>
            
            <div style={cardBodyStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <div style={stepBoxStyle}>
                  <div style={stepNumStyle}>01</div>
                  <div style={stepTitleStyle}>Select the Active Month</div>
                  <p style={stepDescStyle}>
                    Use the month selector at the top-left of the app (e.g. <strong>[This Month]</strong> or the dropdown) to set your active fulfillment month. All stats and checklists sync to that month.
                  </p>
                </div>

                <div style={stepBoxStyle}>
                  <div style={stepNumStyle}>02</div>
                  <div style={stepTitleStyle}>Set Catalog Info</div>
                  <p style={stepDescStyle}>
                    In the <strong>Catalog</strong> tab, enter the Artist, Album Title, and Wholesale Cost for the month's selection. This automatically populates packing slips and export notes.
                  </p>
                </div>

                <div style={stepBoxStyle}>
                  <div style={stepNumStyle}>03</div>
                  <div style={stepTitleStyle}>Fulfill & Ship</div>
                  <p style={stepDescStyle}>
                    Run the Pirate Ship batches for mail subscribers, print Golden Tickets for lapsing subscribers, and fulfill in-store pickups as customers visit the shop.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 2. SHIPPING WORKFLOW (PIRATE SHIP) ── */}
        {(activeSection === 'all' || activeSection === 'shipping') && (
          <div className="guide-card" style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ ...iconBadgeStyle, background: '#dbeafe', color: '#1d4ed8' }}>
                  <Truck size={18} />
                </div>
                <div>
                  <h2 style={cardTitleStyle}>2. Monthly Shipping Workflow (Pirate Ship & Media Mail)</h2>
                  <div style={cardSubtitleStyle}>How to export clean batches and print labels at discounted USPS Media Mail rates</div>
                </div>
              </div>
            </div>

            <div style={cardBodyStyle}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 13, color: '#0f172a', marginBottom: 6 }}>
                  <Info size={16} color="#0284c7" />
                  Key Rule: Fixed-Term vs. Monthly Subscriptions
                </div>
                <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                  • <strong>3-Month, 6-Month, 12-Month Subscriptions</strong>: Fulfill via <strong>Pirate Ship</strong> using the <strong>`📦 Export Clean Batch`</strong> button.<br />
                  • <strong>Monthly Subscriptions</strong>: You can fulfill monthly subscribers <strong>manually</strong> in BigCommerce as recurring orders come in, OR <strong>in bulk</strong> using the <strong>`📦 Export Monthly Batch`</strong> button and section-level <strong>`✓ Ship All`</strong> controls on the Shipping Checklist.
                </div>
              </div>

              {/* Step by Step */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* Step A */}
                <div style={stepRowStyle}>
                  <div style={badgeNumberStyle}>A</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, color: 'var(--text)' }}>
                      Step 1: Export the Clean Batch (Fixed-Term or Monthly)
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                      On the Shipping Checklist, click the blue button <strong>`📦 Export Clean Batch (X)`</strong> for fixed-term subscribers, or the indigo button <strong>`📦 Export Monthly Batch (X)`</strong> for monthly subscribers.
                      This automatically pulls real recipient mailing addresses from BigCommerce for subscribers who have <strong>no notes and no flags</strong>.
                      <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: '#0284c7' }}>
                        📥 Downloads: PirateShip-ROTM-YYYY-MM-clean-batch-fixed-term.csv or PirateShip-ROTM-YYYY-MM-monthly-batch.csv
                      </div>
                      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text3)' }}>
                        💡 <em>Tip: Upon download, you will be prompted if you want to mark these subscribers as shipped in ROTM Club immediately. You can also filter by "Monthly" on the Shipping Checklist to review or bulk ship them anytime.</em>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step B */}
                <div style={stepRowStyle}>
                  <div style={badgeNumberStyle}>B</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, color: 'var(--text)' }}>
                      Step 2: Upload to Pirate Ship
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                      1. Open <strong>PirateShip.com</strong> and click <strong>Create Batch</strong> (or Import Spreadsheet).<br />
                      2. Upload the downloaded clean batch CSV.<br />
                      3. Confirm the settings:
                      <div style={{ 
                        margin: '8px 0', 
                        background: '#fff', 
                        border: '1px solid var(--border)', 
                        borderRadius: 6, 
                        padding: '10px 14px', 
                        fontFamily: 'var(--font-mono)', 
                        fontSize: 11, 
                        color: 'var(--text)' 
                      }}>
                        📦 <strong>Package Type</strong>: Box (or LP Mailer)<br />
                        📏 <strong>Dimensions</strong>: 13 x 13 x 1 inches<br />
                        ⚖️ <strong>Weight</strong>: 1 lb 4 oz (standard single LP + mailer)<br />
                        🏷️ <strong>Service</strong>: USPS Media Mail (~$4.87/package)
                      </div>
                      4. Click <strong>Buy Labels</strong> and print all shipping labels & packing slips with 1 click!
                    </div>
                  </div>
                </div>

                {/* Step C */}
                <div style={stepRowStyle}>
                  <div style={badgeNumberStyle}>C</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, color: 'var(--text)' }}>
                      Step 3: Review Flagged / Noted Subscribers (Action Center)
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                      Subscribers with special notes (e.g. temporary address updates, gift messages) are held back from the clean batch so you can inspect them.
                      See the <strong>Special Attention Guide</strong> below on how to review and export them.
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ── 3. SPECIAL ATTENTION & NOTES ── */}
        {(activeSection === 'all' || activeSection === 'attention') && (
          <div className="guide-card" style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ ...iconBadgeStyle, background: '#fef3c7', color: '#b45309' }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 style={cardTitleStyle}>3. Action Center & Handling Noted / Flagged Subscribers</h2>
                  <div style={cardSubtitleStyle}>How to review custom notes and export reviewed subscribers</div>
                </div>
              </div>
            </div>

            <div style={cardBodyStyle}>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginTop: 0, marginBottom: 18 }}>
                Whenever a subscriber has an active flag, a permanent note, or a month-specific note (e.g. <em>"NEW ADDRESS for Sept: 123 Main St"</em>), the app excludes them from the clean batch to prevent shipping to the wrong location.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
                <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#b45309', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={14} /> 1. Review the Note
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text2)', margin: 0, lineHeight: 1.5 }}>
                    Go to the <strong>Action Center</strong> tab or filter the checklist by <strong>Flagged</strong>. Read the highlighted yellow note or address change request.
                  </p>
                </div>

                <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#0284c7', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={14} /> 2. Mark `[✓ Ready for Export]`
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text2)', margin: 0, lineHeight: 1.5 }}>
                    Once you verify or update their information, click the <strong>`+ Add to Export`</strong> button on their row. It turns amber: <strong>`✓ Ready for Export`</strong>.
                  </p>
                </div>

                <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#059669', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Package size={14} /> 3. Export Attention Batch
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text2)', margin: 0, lineHeight: 1.5 }}>
                    Click <strong>`⭐ Export Attention Batch (X ready)`</strong> in the toolbar. Download the CSV and upload it directly into Pirate Ship!
                  </p>
                </div>
              </div>

              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', fontSize: 12, color: '#92400e', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={16} />
                <span>
                  <strong>Tip:</strong> If you've already reviewed all attention subscribers and want to export all of them at once, clicking <em>Export Attention Batch</em> with 0 boxes checked will give you a 1-click option to export all of them together.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── 4. GOLDEN TICKET RENEWALS ── */}
        {(activeSection === 'all' || activeSection === 'goldenticket') && (
          <div className="guide-card" style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ ...iconBadgeStyle, background: '#fef3c7', color: '#b45309' }}>
                  <Printer size={18} />
                </div>
                <div>
                  <h2 style={cardTitleStyle}>4. Golden Ticket Renewal Slips</h2>
                  <div style={cardSubtitleStyle}>How to identify and print renewal slips for members on their final month</div>
                </div>
              </div>
            </div>

            <div style={cardBodyStyle}>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginTop: 0, marginBottom: 16 }}>
                Subscribers whose subscription ends in the currently selected month are tagged with the bright yellow <strong>★ Golden Ticket</strong> / <strong>Last</strong> badge.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={stepRowStyle}>
                  <div style={badgeNumberStyle}>1</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)' }}>Open the Action Center Tab</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>Navigate to the <strong>Action Center</strong> tab at the top of the app.</div>
                  </div>
                </div>

                <div style={stepRowStyle}>
                  <div style={badgeNumberStyle}>2</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)' }}>Click "Print Golden Tickets"</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                      Click the amber <strong>Print Golden Tickets</strong> button. The browser print dialog will open automatically formatted in a clean <strong>2x3 grid (6 cards per page)</strong>.
                    </div>
                  </div>
                </div>

                <div style={stepRowStyle}>
                  <div style={badgeNumberStyle}>3</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)' }}>Cut & Insert into Packages</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                      Print on cardstock or standard paper, cut along the guidelines, and slip each personalized Golden Ticket inside the member's final LP mailer or in-store record bag!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 5. IN-STORE PICKUPS & CONTACTS ── */}
        {(activeSection === 'all' || activeSection === 'pickups') && (
          <div className="guide-card" style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ ...iconBadgeStyle, background: '#f3e8ff', color: '#7e22ce' }}>
                  <Users size={18} />
                </div>
                <div>
                  <h2 style={cardTitleStyle}>5. In-Store Pickups & Email Announcements</h2>
                  <div style={cardSubtitleStyle}>Managing local pickup members and email list blasts</div>
                </div>
              </div>
            </div>

            <div style={cardBodyStyle}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 18 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={16} color="var(--green)" /> In-Store Fulfillment
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>
                    • On the main Dashboard, the lower section lists all <strong>In-Store Pickups</strong>.<br />
                    • When a member visits the shop to pick up their monthly record, check the box next to their name to mark it fulfilled.<br />
                    • You can also click <strong>Print Pickup Checklist</strong> to keep a physical clipboard list behind the front counter.
                  </p>
                </div>

                <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 18 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mail size={16} color="#0284c7" /> Email Blasts in Contacts Tab
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>
                    • Go to the <strong>Contacts</strong> tab.<br />
                    • Click <strong>Copy Pickup Emails</strong> to copy all email addresses for members whose records are ready for pickup at the store.<br />
                    • Click <strong>Copy Shipped Emails</strong> for announcements to mail subscribers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 6. ADDING & MANAGING SUBSCRIBERS ── */}
        {(activeSection === 'all' || activeSection === 'subscribers') && (
          <div className="guide-card" style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ ...iconBadgeStyle, background: '#ecfdf5', color: '#059669' }}>
                  <Disc size={18} />
                </div>
                <div>
                  <h2 style={cardTitleStyle}>6. Adding & Managing Subscribers</h2>
                  <div style={cardSubtitleStyle}>Duration auto-calculation, notes, and database maintenance</div>
                </div>
              </div>
            </div>

            <div style={cardBodyStyle}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
                    Automatic End Date Calculation
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                    When adding or editing a subscriber, selecting <strong>3-Month</strong>, <strong>6-Month</strong>, or <strong>12-Month</strong> will automatically compute and set the exact end month for you (e.g., Starts `2026-09` on a 6-month sub $\rightarrow$ Ends `2027-02`).
                  </div>
                </div>

                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
                    General Notes vs. Monthly Notes
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                    • <strong>General Notes (`s.notes`)</strong>: Permanent instructions that stay on the member forever (e.g. <em>"Prefers instrumental", "Gate code 4040"</em>).<br />
                    • <strong>Monthly Notes (`s.monthly_notes`)</strong>: Temporary notes tied strictly to the current month (e.g. <em>"Hold until Sept 15", "Out of town for August"</em>). These clear automatically next month!
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
                    ⚡ Auto-Fill Missing End Dates Tool
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                    If any existing fixed-term subscriber in the database has an open/missing end date, a yellow banner will appear in the <strong>Directory (Subscribers)</strong> tab. 
                    Clicking <strong>⚡ Auto-fill Missing End Dates</strong> fixes all of them in 1 click using their original start month and subscription length.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// Helper sub-component for Plus icon
const PlusIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

// Inline Styles
const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  overflow: 'hidden',
  boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
};

const cardHeaderStyle: React.CSSProperties = {
  padding: '20px 24px',
  borderBottom: '1px solid var(--border)',
  background: 'var(--surface)'
};

const cardTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 800,
  color: 'var(--text)'
};

const cardSubtitleStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text3)',
  fontFamily: 'var(--font-mono)',
  marginTop: 3
};

const cardBodyStyle: React.CSSProperties = {
  padding: '24px'
};

const iconBadgeStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

const stepBoxStyle: React.CSSProperties = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: 16,
  position: 'relative'
};

const stepNumStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 18,
  fontWeight: 900,
  color: '#cbd5e1',
  marginBottom: 8
};

const stepTitleStyle: React.CSSProperties = {
  fontWeight: 800,
  fontSize: 13,
  color: '#0f172a',
  marginBottom: 6
};

const stepDescStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: '#475569',
  lineHeight: 1.5
};

const stepRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  alignItems: 'flex-start',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: 16
};

const badgeNumberStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: '50%',
  background: 'var(--text)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
  fontSize: 11,
  fontFamily: 'var(--font-mono)',
  flexShrink: 0
};

export default HowToGuide;
