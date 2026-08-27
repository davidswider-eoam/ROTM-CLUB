import React, { useMemo } from 'react';
import { getCurrentMonth, getNextMonth, getMonthOptions, fmt } from './utils';
import { Calendar, ChevronRight } from 'lucide-react';

interface MonthSelectorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showQuickPills?: boolean;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  id,
  value,
  onChange,
  disabled = false,
  showQuickPills = true,
}) => {
  const currentMonth = useMemo(() => getCurrentMonth(), []);
  const nextMonth = useMemo(() => getNextMonth(currentMonth), [currentMonth]);
  const monthOptions = useMemo(() => getMonthOptions(-1, 3), []);

  // Ensure current value is included in the options list if custom/outside range
  const hasValueInOptions = useMemo(() => {
    return !value || monthOptions.some(opt => opt.value === value);
  }, [value, monthOptions]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <select
          id={id}
          className="form-select"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          style={{ flex: 1 }}
        >
          <option value="" disabled>-- Select Month --</option>
          {!hasValueInOptions && value && (
            <option value={value}>{fmt(value)} ({value})</option>
          )}
          {monthOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label} {opt.value === currentMonth ? '★ (Current)' : ''}
            </option>
          ))}
        </select>

        <input
          type="month"
          className="form-input"
          value={value || ''}
          onChange={(e) => {
            if (e.target.value) {
              onChange(e.target.value);
            }
          }}
          disabled={disabled}
          title="Pick from calendar"
          style={{ width: '42px', padding: '6px 8px', cursor: 'pointer' }}
        />
      </div>

      {showQuickPills && !disabled && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="filter-btn"
            style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 4,
              border: value === currentMonth ? '1px solid var(--text3)' : '1px solid var(--border2)',
              background: value === currentMonth ? 'var(--surface2)' : 'transparent',
              color: value === currentMonth ? 'var(--text)' : 'var(--text3)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
            onClick={() => onChange(currentMonth)}
          >
            <Calendar size={10} /> This Month ({fmt(currentMonth)})
          </button>

          <button
            type="button"
            className="filter-btn"
            style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 4,
              border: value === nextMonth ? '1px solid var(--text3)' : '1px solid var(--border2)',
              background: value === nextMonth ? 'var(--surface2)' : 'transparent',
              color: value === nextMonth ? 'var(--text)' : 'var(--text3)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
            onClick={() => onChange(nextMonth)}
          >
            <ChevronRight size={10} /> Next Month ({fmt(nextMonth)})
          </button>
        </div>
      )}
    </div>
  );
};

export default MonthSelector;
