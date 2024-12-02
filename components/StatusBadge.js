import React from 'react';
import styles from './StatusBadge.module.css';

const StatusBadge = ({ 
  status, 
  type, 
  icon, 
  color, 
  withBorder = false,
  actionButton = null
}) => {
  const getStatusStyles = (status) => {
    const baseStyles = {
      logged: {
        backgroundColor: '#FFF3E0',
        color: '#FF5722',
        borderColor: '#FF5722',
      },
      'in progress': {
        backgroundColor: '#eff6ff',
        color: '#1d4ed8',
        borderColor: '#1d4ed8',
      },
      closed: {
        backgroundColor: '#f0fdf4',
        color: '#15803d',
        borderColor: '#15803d',
      },
      cancelled: {
        backgroundColor: '#fef2f2',
        color: '#dc2626',
        borderColor: '#dc2626',
      },
      repair: {
        backgroundColor: '#fef2f2',
        color: '#dc2626',
        borderColor: '#dc2626',
      },
      default: {
        backgroundColor: '#f3f4f6',
        color: '#6b7280',
        borderColor: '#6b7280',
      },
    };

    return baseStyles[status?.toLowerCase()] || baseStyles.default;
  };

  const styles = color ? {
    backgroundColor: `${color}15`,
    color: color,
    borderColor: color,
  } : getStatusStyles(status);

  return (
    <div className="d-flex align-items-center gap-2">
      <span
        className={`status-badge ${withBorder ? 'with-border' : ''}`}
        style={{
          ...styles,
          border: withBorder ? `1px solid ${styles.borderColor}` : 'none',
        }}
      >
        {icon && <i className={`fe ${icon} me-1`}></i>}
        {type || status}
      </span>
      {actionButton && (
        <button
          className="action-button"
          onClick={actionButton.onClick}
          style={{
            backgroundColor: '#fff',
            border: '1px solid #FF9800',
            color: '#FF9800',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {actionButton.label}
        </button>
      )}
    </div>
  );
};

export default StatusBadge; 