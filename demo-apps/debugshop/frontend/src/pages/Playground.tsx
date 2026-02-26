import React, { useState } from 'react';
import debuggInstance from '../debugg';

/**
 * Error Playground
 * 
 * This page allows you to trigger different types of errors
 * to see how Debugg captures and displays them.
 */

export function Playground() {
  const [lastError, setLastError] = useState<string>('');
  const [errorCount, setErrorCount] = useState(0);

  // Trigger different types of errors
  const triggerReferenceError = () => {
    try {
      setLastError('Triggering ReferenceError...');
      // @ts-ignore
      console.log(undefinedVariable);
    } catch (error) {
      debuggInstance.handle(error, {
        source: 'playground',
        action: 'trigger_reference_error',
        userTriggered: true
      });
      setLastError('ReferenceError triggered! Check Debugg dashboard.');
      setErrorCount(c => c + 1);
    }
  };

  const triggerTypeError = () => {
    try {
      setLastError('Triggering TypeError...');
      const obj: any = null;
      obj.property = 'value';
    } catch (error) {
      debuggInstance.handle(error, {
        source: 'playground',
        action: 'trigger_type_error',
        userTriggered: true
      });
      setLastError('TypeError triggered! Check Debugg dashboard.');
      setErrorCount(c => c + 1);
    }
  };

  const triggerRangeError = () => {
    try {
      setLastError('Triggering RangeError...');
      new Array(-1);
    } catch (error) {
      debuggInstance.handle(error, {
        source: 'playground',
        action: 'trigger_range_error',
        userTriggered: true
      });
      setLastError('RangeError triggered! Check Debugg dashboard.');
      setErrorCount(c => c + 1);
    }
  };

  const triggerNetworkError = async () => {
    try {
      setLastError('Triggering Network Error...');
      await fetch('http://invalid-url-that-does-not-exist.com/api');
    } catch (error) {
      debuggInstance.handle(error, {
        source: 'playground',
        action: 'trigger_network_error',
        userTriggered: true,
        url: 'http://invalid-url-that-does-not-exist.com'
      });
      setLastError('Network Error triggered! Check Debugg dashboard.');
      setErrorCount(c => c + 1);
    }
  };

  const triggerCustomError = () => {
    const customError = new Error('This is a custom error from DebugShop!');
    (customError as any).code = 'CUSTOM_ERROR_001';
    
    debuggInstance.handle(customError, {
      source: 'playground',
      action: 'trigger_custom_error',
      userTriggered: true,
      customData: {
        shop: 'DebugShop',
        scenario: 'custom_error',
        timestamp: new Date().toISOString()
      }
    });
    
    setLastError('Custom Error triggered! Check Debugg dashboard.');
    setErrorCount(c => c + 1);
  };

  const triggerPaymentError = async () => {
    try {
      setLastError('Simulating payment failure...');
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card: '4000000000000002', // Test card that fails
          amount: 99.99,
          currency: 'USD'
        })
      });
      
      if (!response.ok) {
        throw new Error('Payment failed: Card declined');
      }
    } catch (error) {
      debuggInstance.handle(error, {
        source: 'playground',
        action: 'trigger_payment_error',
        userTriggered: true,
        payment: {
          amount: 99.99,
          currency: 'USD',
          cardType: 'test_failure'
        }
      });
      setLastError('Payment Error triggered! Check Debugg dashboard.');
      setErrorCount(c => c + 1);
    }
  };

  const triggerDatabaseError = async () => {
    try {
      setLastError('Simulating database error...');
      
      const response = await fetch('/api/errors/trigger?type=database');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Database error');
      }
    } catch (error) {
      debuggInstance.handle(error, {
        source: 'playground',
        action: 'trigger_database_error',
        userTriggered: true,
        database: {
          type: 'postgresql',
          operation: 'query'
        }
      });
      setLastError('Database Error triggered! Check Debugg dashboard.');
      setErrorCount(c => c + 1);
    }
  };

  const clearErrors = () => {
    setLastError('');
    setErrorCount(0);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🎮 Error Playground</h1>
        <p style={styles.subtitle}>
          Trigger different types of errors to see how Debugg captures them
        </p>
      </div>

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{errorCount}</div>
          <div style={styles.statLabel}>Errors Triggered</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{lastError ? '✓' : '-'}</div>
          <div style={styles.statLabel}>Last Status</div>
        </div>
      </div>

      {lastError && (
        <div style={styles.statusBar}>
          <span style={styles.statusIcon}>ℹ️</span>
          {lastError}
          <button onClick={clearErrors} style={styles.clearButton}>Clear</button>
        </div>
      )}

      <div style={styles.grid}>
        <ErrorCard
          icon="❌"
          title="Reference Error"
          description="Access undefined variable"
          onClick={triggerReferenceError}
          color="#ef4444"
        />

        <ErrorCard
          icon="🔧"
          title="Type Error"
          description="Access property of null"
          onClick={triggerTypeError}
          color="#f97316"
        />

        <ErrorCard
          icon="📏"
          title="Range Error"
          description="Invalid array length"
          onClick={triggerRangeError}
          color="#eab308"
        />

        <ErrorCard
          icon="🌐"
          title="Network Error"
          description="Failed fetch request"
          onClick={triggerNetworkError}
          color="#3b82f6"
        />

        <ErrorCard
          icon="💳"
          title="Payment Error"
          description="Simulated payment failure"
          onClick={triggerPaymentError}
          color="#8b5cf6"
        />

        <ErrorCard
          icon="🗄️"
          title="Database Error"
          description="Database query failure"
          onClick={triggerDatabaseError}
          color="#22c55e"
        />

        <ErrorCard
          icon="⚙️"
          title="Custom Error"
          description="Custom application error"
          onClick={triggerCustomError}
          color="#ec4899"
        />
      </div>

      <div style={styles.instructions}>
        <h2 style={styles.instructionsTitle}>📖 How to Use</h2>
        <ol style={styles.instructionsList}>
          <li>Open your Debugg dashboard at <code>http://localhost:3001</code></li>
          <li>Click any error card above to trigger that type of error</li>
          <li>Watch the error appear in real-time in your Debugg dashboard</li>
          <li>Click on the error to see full details, stack trace, and context</li>
          <li>Try different error types to see how Debugg classifies them</li>
        </ol>

        <div style={styles.tips}>
          <h3 style={styles.tipsTitle}>💡 Tips</h3>
          <ul style={styles.tipsList}>
            <li>Each error includes custom context to help with debugging</li>
            <li>Errors are automatically classified by severity</li>
            <li>Similar errors are grouped together</li>
            <li>You can add custom reporters for different destinations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Error Card Component
function ErrorCard({ icon, title, description, onClick, color }: any) {
  return (
    <div 
      style={{...styles.card, borderLeftColor: color}} 
      onClick={onClick}
    >
      <div style={styles.cardIcon}>{icon}</div>
      <h3 style={styles.cardTitle}>{title}</h3>
      <p style={styles.cardDescription}>{description}</p>
      <button style={{...styles.cardButton, background: color}}>
        Trigger Error
      </button>
    </div>
  );
}

const styles: any = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '18px',
    color: '#718096'
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  statValue: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: '8px'
  },
  statLabel: {
    fontSize: '14px',
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  statusBar: {
    background: '#ebf8ff',
    border: '1px solid #bee3f8',
    borderRadius: '8px',
    padding: '16px 24px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#2c5282'
  },
  statusIcon: {
    fontSize: '20px'
  },
  clearButton: {
    marginLeft: 'auto',
    background: '#fed7d7',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    color: '#c53030',
    cursor: 'pointer',
    fontWeight: '600'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    marginBottom: '48px'
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    borderLeft: '4px solid',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  cardIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: '8px'
  },
  cardDescription: {
    fontSize: '14px',
    color: '#718096',
    marginBottom: '16px'
  },
  cardButton: {
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%'
  },
  instructions: {
    background: 'white',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  instructionsTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: '16px'
  },
  instructionsList: {
    fontSize: '16px',
    color: '#2d3748',
    lineHeight: '1.8',
    paddingLeft: '24px'
  },
  tips: {
    background: '#f7fafc',
    borderRadius: '8px',
    padding: '24px',
    marginTop: '24px'
  },
  tipsTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: '12px'
  },
  tipsList: {
    fontSize: '14px',
    color: '#4a5568',
    lineHeight: '1.8',
    paddingLeft: '24px'
  }
};
