import React, { useState, useEffect } from 'react';
import ICAL from 'ical.js';
import { FaCalendarAlt, FaClock, FaLink, FaTrash, FaCheckCircle, FaExclamationCircle, FaRocket } from 'react-icons/fa';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedUrl = localStorage.getItem('sltc_calendar_url');
    if (savedUrl) {
      setUrl(savedUrl);
      fetchAssignments(savedUrl);
    }
  }, []);

  const fetchAssignments = async (calendarUrl) => {
    setLoading(true);
    setError('');
    
    try {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(calendarUrl)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Link එකේ දෝෂයක්. කරුණාකර පරීක්ෂා කරන්න.");
      
      const textData = await response.text();
      const jcalData = ICAL.parse(textData);
      const comp = new ICAL.Component(jcalData);
      const vevents = comp.getAllSubcomponents('vevent');

      const formattedEvents = vevents.map(vevent => {
        const event = new ICAL.Event(vevent);
        const title = event.summary;
        const description = event.description;
        const startDate = event.startDate.toJSDate();
        
        const now = new Date();
        const diffTime = startDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          id: event.uid,
          title: title || "No Title",
          date: startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          description: description || "",
          rawDate: startDate,
          daysLeft: diffDays
        };
      });

      formattedEvents.sort((a, b) => a.rawDate - b.rawDate);
      setAssignments(formattedEvents);
      localStorage.setItem('sltc_calendar_url', calendarUrl);

    } catch (err) {
      console.error(err);
      setError("දත්ත ලබාගැනීමට නොහැක. Link එක නිවැරදි දැයි බලන්න.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (url) fetchAssignments(url);
  };

  const clearData = () => {
    localStorage.removeItem('sltc_calendar_url');
    setUrl('');
    setAssignments([]);
  };

  return (
    <div className="main-wrapper">
      {/* පසුබිමේ යන ලස්සන පාට බෝල (Animation සඳහා) */}
      <div className="background-gradient">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="glass-panel">
        <header className="header">
          <div className="logo-badge">
            <FaRocket className="rocket-icon" />
          </div>
          <h1>SLTC <span className="highlight">Tracker</span></h1>
          <p>Your ultimate deadline companion.</p>
        </header>

        <div className="input-section">
          <form onSubmit={handleSearch} className="search-form">
            <div className="input-group">
              <FaLink className="input-icon" />
              <input 
                type="text" 
                placeholder="Paste SLTC Calendar Link here..." 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Checking...' : 'Show Tasks'}
            </button>
          </form>
          
          {assignments.length > 0 && (
            <button onClick={clearData} className="btn-clear">
              <FaTrash /> Reset All
            </button>
          )}
        </div>

        {error && <div className="error-msg"><FaExclamationCircle /> {error}</div>}

        <div className="grid-container">
          {assignments.length > 0 ? (
            assignments.map((item, index) => (
              <div key={index} className={`task-card ${item.daysLeft < 3 ? 'urgent' : ''}`}>
                <div className="card-top">
                  <span className={`status-badge ${item.daysLeft < 0 ? 'overdue' : item.daysLeft < 3 ? 'danger' : 'safe'}`}>
                    {item.daysLeft < 0 ? 'Overdue' : item.daysLeft === 0 ? 'Today!' : `${item.daysLeft} Days Left`}
                  </span>
                  <span className="date-text"><FaCalendarAlt /> {item.date}</span>
                </div>
                
                <h3 className="task-title">{item.title}</h3>
                
                <div className="card-footer">
                  <span className="time-text"><FaClock /> {item.time}</span>
                </div>
              </div>
            ))
          ) : (
            !loading && (
              <div className="empty-state">
                <div className="empty-icon-circle">
                   <FaCheckCircle />
                </div>
                <h3>No Tasks Found</h3>
                <p>Paste your calendar link to get started.</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Footer එක දැන් Site එකේ පහළම තියෙන්නේ */}
      <footer className="site-footer">
        <p>Powered by <span className="brand-name">Oska Tech 🚀</span></p>
      </footer>
    </div>
  );
}

export default App;