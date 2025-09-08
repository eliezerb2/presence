import React, { useState, useEffect } from 'react';
import { claimsApi, managerApi } from '../services/api';

const ClaimsManagement = () => {
  const [claims, setClaims] = useState([]);
  const [claimsSummary, setClaimsSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [filter, setFilter] = useState('open');

  useEffect(() => {
    loadClaims();
    loadClaimsSummary();
  }, [filter]);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const response = await claimsApi.getAll({ status_filter: filter });
      setClaims(response.data);
    } catch (error) {
      console.error('Error loading claims:', error);
      setMessage({ text: 'שגיאה בטעינת תביעות', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadClaimsSummary = async () => {
    try {
      const response = await managerApi.getClaimsSummary();
      setClaimsSummary(response.data);
    } catch (error) {
      console.error('Error loading claims summary:', error);
    }
  };

  const handleUpdateClaimStatus = async (claimId, newStatus) => {
    try {
      await claimsApi.update(claimId, { status: newStatus });
      setMessage({ text: 'סטטוס התביעה עודכן בהצלחה', type: 'success' });
      loadClaims();
      loadClaimsSummary();
    } catch (error) {
      console.error('Error updating claim status:', error);
      setMessage({ text: 'שגיאה בעדכון סטטוס התביעה', type: 'error' });
    }
  };

  const getReasonText = (reason) => {
    const reasonMap = {
      'late_threshold': 'חריגה מסף איחורים',
      'third_yom_lo_ba_li': 'שלושה ימי "לא בא לי"'
    };
    return reasonMap[reason] || reason;
  };

  const getStatusText = (status) => {
    const statusMap = {
      'open': 'פתוח',
      'closed': 'סגור',
      'resolved': 'נפתר'
    };
    return statusMap[status] || status;
  };

  const getStatusBadgeClass = (status) => {
    const classMap = {
      'open': 'status-absent',
      'closed': 'status-present',
      'resolved': 'status-permanent-absence'
    };
    return `status-badge ${classMap[status] || ''}`;
  };

  return (
    <div>
      <div className="card">
        <h2>ניהול תביעות</h2>

        {message.text && (
          <div className={`alert alert-${message.type === 'error' ? 'danger' : 'success'}`}>
            {message.text}
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{claimsSummary.length}</div>
            <div className="stat-label">תביעות פתוחות</div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">סינון לפי סטטוס:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="form-select"
            style={{ width: 'auto' }}
          >
            <option value="">הכל</option>
            <option value="open">פתוח</option>
            <option value="closed">סגור</option>
            <option value="resolved">נפתר</option>
          </select>
        </div>

        {loading ? (
          <div className="loading">טוען תביעות...</div>
        ) : (
          <>
            {claimsSummary.length > 0 && (
              <div className="card" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>
                <h3>תביעות פתוחות דורשות טיפול</h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>מספר תלמיד</th>
                      <th>שם תלמיד</th>
                      <th>תאריך פתיחה</th>
                      <th>סיבה</th>
                      <th>הודע ל</th>
                      <th>פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claimsSummary.map((claim) => (
                      <tr key={claim.claim_id}>
                        <td>{claim.student_number}</td>
                        <td>{claim.student_name}</td>
                        <td>{new Date(claim.date_opened).toLocaleDateString('he-IL')}</td>
                        <td>{getReasonText(claim.reason)}</td>
                        <td>{claim.notified_to.join(', ')}</td>
                        <td>
                          <button
                            onClick={() => handleUpdateClaimStatus(claim.claim_id, 'resolved')}
                            className="btn btn-success btn-sm"
                            style={{ marginLeft: '5px' }}
                          >
                            סמן כנפתר
                          </button>
                          <button
                            onClick={() => handleUpdateClaimStatus(claim.claim_id, 'closed')}
                            className="btn btn-danger btn-sm"
                          >
                            סגור תביעה
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <table className="table">
              <thead>
                <tr>
                  <th>מזהה תביעה</th>
                  <th>מזהה תלמיד</th>
                  <th>תאריך פתיחה</th>
                  <th>סיבה</th>
                  <th>סטטוס</th>
                  <th>הודע ל</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr key={claim.id}>
                    <td>{claim.id}</td>
                    <td>{claim.student_id}</td>
                    <td>{new Date(claim.date_opened).toLocaleDateString('he-IL')}</td>
                    <td>{getReasonText(claim.reason)}</td>
                    <td>
                      <span className={getStatusBadgeClass(claim.status)}>
                        {getStatusText(claim.status)}
                      </span>
                    </td>
                    <td>{claim.notified_to.join(', ')}</td>
                    <td>
                      {claim.status === 'open' && (
                        <>
                          <button
                            onClick={() => handleUpdateClaimStatus(claim.id, 'resolved')}
                            className="btn btn-success btn-sm"
                            style={{ marginLeft: '5px' }}
                          >
                            סמן כנפתר
                          </button>
                          <button
                            onClick={() => handleUpdateClaimStatus(claim.id, 'closed')}
                            className="btn btn-danger btn-sm"
                          >
                            סגור
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
};

export default ClaimsManagement;