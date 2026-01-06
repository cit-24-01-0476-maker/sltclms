import React, { useState, useEffect } from 'react';
import ICAL from 'ical.js';
import { 
  FaCalendarAlt, FaClock, FaLink, FaTrash, FaCheckCircle, 
  FaExclamationCircle, FaRocket, FaQuestionCircle, FaTimes, FaUndo 
} from 'react-icons/fa';
import { BsCheck2Square } from 'react-icons/bs';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const savedUrl = localStorage.getItem('sltc_calendar_url');
    const savedCompleted = JSON.parse(localStorage.getItem('sltc_completed_tasks')) || [];
    
    if (savedCompleted) setCompletedTasks(savedCompleted);
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
      if (!response.ok) throw new Error("Link එක වැඩ කරන්නේ නැත. URL එක පරීක්ෂා කරන්න.");
      
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
      setShowHelp(false);

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
    localStorage.removeItem('sltc_completed_tasks');
    setUrl('');
    setAssignments([]);
    setCompletedTasks([]);
  };

  const toggleComplete = (id) => {
    let updatedCompleted;
    if (completedTasks.includes(id)) {
      updatedCompleted = completedTasks.filter(taskId => taskId !== id);
    } else {
      updatedCompleted = [...completedTasks, id];
    }
    setCompletedTasks(updatedCompleted);
    localStorage.setItem('sltc_completed_tasks', JSON.stringify(updatedCompleted));
  };

  return (
    <div className="main-wrapper">
      
      {/* Background Shapes */}
      <div className="background-gradient">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="glass-panel">
        
        {/* Header Section */}
        <header className="header">
          <div className="logo-badge">
            <FaRocket className="rocket-icon" />
          </div>
          <h1>LMS <span className="highlight">Tracker</span></h1>
          <p>Track your assignments & deadlines.</p>
        </header>

        {/* Help Button */}
        <div className="help-section-trigger">
          <button type="button" className="btn-help" onClick={() => setShowHelp(!showHelp)}>
            {showHelp ? <FaTimes /> : <FaQuestionCircle />} {showHelp ? 'Close' : 'Link එක ගන්නෙ කොහොමද?'}
          </button>
        </div>

        {/* Help Box */}
        {showHelp && (
          <div className="help-box">
            <h3>📌 Link එක ගන්න පියවර:</h3>
            <ol>
              <li>LMS එකේ <strong>Calendar</strong> එකට යන්න.</li>
              <li>පහළම තියෙන <strong>"Export Calendar"</strong> බට්න් එක ඔබන්න.</li>
              <li><strong>"Calendar URL"</strong> එක Copy කරගෙන මෙතන Paste කරන්න.</li>
            </ol>
          </div>
        )}

        {/* Input Section */}
        <div className="input-section">
          <form onSubmit={handleSearch} className="search-form">
            <div className="input-group">
              <FaLink className="input-icon" />
              <input 
                type="text" 
                placeholder="Paste LMS Calendar Link..." 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Searching...' : 'Show Tasks'}
            </button>
          </form>
          
          {assignments.length > 0 && (
            <button onClick={clearData} className="btn-clear">
              <FaTrash /> Clear Data
            </button>
          )}
        </div>

        {error && <div className="error-msg"><FaExclamationCircle /> {error}</div>}

        {/* Task Grid */}
        <div className="grid-container">
          {assignments.length > 0 ? (
            assignments.map((item, index) => {
              const isCompleted = completedTasks.includes(item.id);
              
              return (
                <div key={index} className={`task-card ${isCompleted ? 'completed' : item.daysLeft < 3 ? 'urgent' : ''}`}>
                  <div className="card-top">
                    {isCompleted ? (
                      <span className="status-badge success">Submitted ✅</span>
                    ) : (
                      <span className={`status-badge ${item.daysLeft < 0 ? 'overdue' : item.daysLeft < 3 ? 'danger' : 'safe'}`}>
                        {item.daysLeft < 0 ? 'OVERDUE' : item.daysLeft === 0 ? 'TODAY!' : `${item.daysLeft} DAYS LEFT`}
                      </span>
                    )}
                    <span className="date-text"><FaCalendarAlt /> {item.date}</span>
                  </div>
                  
                  <h3 className="task-title">{item.title}</h3>
                  
                  <div className="card-footer">
                    <span className="time-text"><FaClock /> {item.time}</span>
                    
                    <button 
                      className={`btn-check ${isCompleted ? 'checked' : ''}`} 
                      onClick={() => toggleComplete(item.id)}
                    >
                      {isCompleted ? <FaUndo /> : <BsCheck2Square />}
                      {isCompleted ? ' Undo' : ' Mark Done'}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            !loading && (
              <div className="empty-state">
                <div className="empty-icon-circle"><FaCheckCircle /></div>
                <h3>No Tasks Found</h3>
                <p>Paste your LMS calendar link to get started.</p>
              </div>
            )
          )}
        </div>
      </div>

      <footer className="site-footer">
        <p>Powered by <span className="brand-name">Oska Tech 🚀</span></p>
      </footer>
    </div>
  );
}

export default App;