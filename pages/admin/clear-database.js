import { useState } from 'react';
import styles from '../../styles/Admin.module.css';

export default function ClearDatabase() {
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleClear = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/clear-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret
        },
        body: JSON.stringify({ secret })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        setError(`Server returned HTML instead of JSON. This usually means the API route doesn't exist. Response: ${text.substring(0, 200)}...`);
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || 'Failed to clear database');
        setLoading(false);
        return;
      }

      setResult(data);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to clear database');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>🗑️ Clear Database</h1>
        <p className={styles.warning}>
          ⚠️ <strong>WARNING:</strong> This will permanently delete ALL data from your database!
        </p>
        <p className={styles.info}>
          <strong>What gets deleted:</strong> Users, bids, transactions, subscriptions, favorites, and marketplace NFT data.
        </p>
        <p className={styles.safe}>
          ✅ <strong>OpenSea NFTs are SAFE!</strong> They are fetched live from OpenSea API and not stored in the database, so they will remain visible.
        </p>

        <form onSubmit={handleClear} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="secret">Admin Secret:</label>
            <input
              type="password"
              id="secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter ADMIN_SECRET from .env.local"
              required
              className={styles.input}
            />
            <small>Set ADMIN_SECRET in your .env.local file</small>
          </div>

          <button
            type="submit"
            disabled={loading || !secret}
            className={styles.button}
          >
            {loading ? 'Clearing...' : 'Clear All Data'}
          </button>
        </form>

        {error && (
          <div className={styles.error}>
            <strong>Error:</strong> {error}
            {error.includes("API route doesn't exist") && (
              <div className={styles.help}>
                <strong>💡 Solution:</strong> Restart your development server:
                <ol>
                  <li>Stop the server (Ctrl+C in terminal)</li>
                  <li>Run: <code>npm run dev</code></li>
                  <li>Try again</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {result && (
          <div className={styles.result}>
            <h2>✅ Database Cleared Successfully!</h2>
            
            {result.results.cleared.length > 0 && (
              <div className={styles.section}>
                <h3>🗑️ Cleared Collections:</h3>
                <ul>
                  {result.results.cleared.map((item, idx) => (
                    <li key={idx}>
                      <strong>{item.collection}:</strong> {item.deletedCount} documents deleted
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.results.notFound.length > 0 && (
              <div className={styles.section}>
                <h3>📭 Empty Collections:</h3>
                <ul>
                  {result.results.notFound.map((item, idx) => (
                    <li key={idx}>
                      <strong>{item.collection}:</strong> {item.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.results.errors.length > 0 && (
              <div className={styles.section}>
                <h3>⚠️ Errors:</h3>
                <ul>
                  {result.results.errors.map((item, idx) => (
                    <li key={idx}>
                      <strong>{item.collection}:</strong> {item.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className={styles.section}>
              <h3>📊 Final Counts:</h3>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Collection</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.finalCounts).map(([collection, count]) => (
                    <tr key={collection}>
                      <td>{collection}</td>
                      <td>
                        {count === 0 ? (
                          <span className={styles.success}>✓ 0</span>
                        ) : count === 'error' ? (
                          <span className={styles.error}>✗ Error</span>
                        ) : (
                          <span className={styles.warningText}>⚠ {count}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className={styles.timestamp}>
              🕐 Cleared at: {new Date(result.timestamp).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

