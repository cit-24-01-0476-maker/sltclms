import React, { useState, useEffect, useRef } from 'react';
import ICAL from 'ical.js';
import confetti from 'canvas-confetti';
import { 
  FaCalendarAlt, FaClock, FaLink, FaTrash, FaCheckCircle, 
  FaExclamationCircle, FaRocket, FaHome, FaBook, FaChartPie, 
  FaCog, FaSignOutAlt, FaBars, FaSearch, FaFilter, FaUndo, FaExclamationTriangle 
} from 'react-icons/fa';
import { BsCheck2Square, BsHourglassSplit } from 'react-icons/bs';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); 
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const glowRef = useRef(null);

  useEffect(() => {
    const savedUrl = localStorage.getItem('sltc_calendar_url');
    const savedCompleted = JSON.parse(localStorage.getItem('sltc_completed_tasks')) || [];
    
    if (savedCompleted) setCompletedTasks(savedCompleted);
    if (savedUrl) {
      setUrl(savedUrl);
      fetchAssignments(savedUrl);
    }

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    const handleMouseMove = (e) => {
      if (glowRef.current) {
        glowRef.current.style.left = `${e.clientX}px`;
        glowRef.current.style.top = `${e.clientY}px`;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearInterval(timer);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const fetchAssignments = async (calendarUrl) => {
    setLoading(true);
    setError('');
    
    try {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(calendarUrl)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Link failed");
      
      const textData = await response.text();
      const jcalData = ICAL.parse(textData);
      const comp = new ICAL.Component(jcalData);
      const vevents = comp.getAllSubcomponents('vevent');

      const formattedEvents = vevents.map(vevent => {
        const event = new ICAL.Event(vevent);
        const startDate = event.startDate.toJSDate();
        const now = new Date();
        const diffTime = startDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          id: event.uid,
          title: event.summary || "No Title",
          date: startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rawDate: startDate,
          daysLeft: diffDays
        };
      });

      formattedEvents.sort((a, b) => a.rawDate - b.rawDate);
      setAssignments(formattedEvents);
      localStorage.setItem('sltc_calendar_url', calendarUrl);

    } catch (err) {
      console.error(err);
      setError("Link Error. Check URL.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (url) fetchAssignments(url);
  };

  const clearData = () => {
    localStorage.clear();
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
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#00f260', '#0575E6', '#e100ff'] });
    }
    setCompletedTasks(updatedCompleted);
    localStorage.setItem('sltc_completed_tasks', JSON.stringify(updatedCompleted));
  };

  const getCountdown = (targetDate) => {
    const diff = targetDate - currentTime;
    if (diff <= 0) return "Overdue";
    if (diff > 86400000) return null; 
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const filteredAssignments = assignments.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'completed') return completedTasks.includes(item.id);
    if (filter === 'pending') return !completedTasks.includes(item.id);
    return true;
  });

  const total = assignments.length;
  const done = completedTasks.filter(id => assignments.find(a => a.id === id)).length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="full-screen-app">
      
      {/* Cursor Glow */}
      <div className="cursor-glow" ref={glowRef}></div>

      {/* Live Background */}
      <div className="background-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <aside className={`fs-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="fs-brand">
          <FaRocket className="fs-logo" />
          <h2>LMS Pro</h2>
        </div>
        
        <nav className="fs-nav">
          <a href="#" className="fs-link active"><FaHome /> Dashboard</a>
          <a href="#" className="fs-link"><FaBook /> Courses</a>
          <a href="#" className="fs-link"><FaCalendarAlt /> Calendar</a>
          <a href="#" className="fs-link"><FaChartPie /> Analytics</a>
          <a href="#" className="fs-link"><FaCog /> Settings</a>
        </nav>

        <div className="fs-footer">
          <button onClick={clearData} className="fs-logout">
            <FaSignOutAlt /> Reset Data
          </button>
        </div>
      </aside>

      <main className={`fs-main ${isSidebarOpen ? 'expanded' : 'full'}`}>
        
        <header className="fs-header glass-effect">
          <div className="fs-header-left">
            <button className="fs-menu-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <FaBars />
            </button>
            <div>
              <h1>Dashboard</h1>
              <p>Live Overview</p>
            </div>
          </div>
          <div className="fs-profile">
            <span>ST</span>
          </div>
        </header>

        <div className="fs-widgets">
           <div className="fs-card fs-widget-card glass-effect hover-float">
              <div className="fs-icon-box blue pulse-anim"><FaClock /></div>
              <div>
                <h3>Next Due</h3>
                <p className="fs-highlight">
                  {assignments.find(t => !completedTasks.includes(t.id)) ? 
                    getCountdown(assignments.find(t => !completedTasks.includes(t.id)).rawDate) || "Upcoming" : 
                    "No Tasks"}
                </p>
              </div>
           </div>

           <div className="fs-card fs-widget-card glass-effect hover-float">
              <div className="fs-icon-box green"><FaChartPie /></div>
              <div className="fs-progress-info">
                <h3>Progress</h3>
                <p>{progress}% Done</p>
                <div className="fs-progress-bg">
                  <div className="fs-progress-fill" style={{width: `${progress}%`}}></div>
                </div>
              </div>
           </div>

           <div className="fs-card fs-sync-card glass-effect hover-float">
              <form onSubmit={handleSearch} className="fs-sync-form">
                <input 
                  type="text" 
                  placeholder="Paste LMS Calendar Link..." 
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)} 
                />
                <button disabled={loading}>{loading ? '...' : 'Sync'}</button>
              </form>
           </div>
        </div>

        {error && <div className="fs-error glass-effect"><FaExclamationCircle /> {error}</div>}

        <div className="fs-content-area">
          <div className="fs-toolbar">
             <h3>Assignments Queue ({filteredAssignments.length})</h3>
             <div className="fs-filters">
               <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
               <button className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>Pending</button>
               <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>Done</button>
             </div>
          </div>

          <div className="fs-grid">
            {filteredAssignments.length > 0 ? (
              filteredAssignments.map((item, index) => {
                const isCompleted = completedTasks.includes(item.id);
                const countdown = getCountdown(item.rawDate);
                const isOverdue = item.daysLeft < 0 && !isCompleted;
                const isUrgent = item.daysLeft < 3 && item.daysLeft >= 0 && !isCompleted;
                
                return (
                  <div key={index} className={`fs-task-card glass-effect hover-float ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue-card' : ''}`}>
                    <div className="fs-card-top">
                       {/* BADGE LOGIC UPDATED: Green for safe days */}
                       <span className={`fs-badge ${isOverdue ? 'red-pulse' : isUrgent ? 'orange-pulse' : 'green-pulse'}`}>
                         {isOverdue && <FaExclamationTriangle style={{marginRight:5}} />}
                         {isOverdue ? 'OVERDUE' : item.daysLeft === 0 ? 'TODAY!' : `${item.daysLeft} DAYS LEFT`}
                       </span>
                       {!isCompleted && countdown && <span className="fs-timer"><BsHourglassSplit className="spin" /> {countdown}</span>}
                    </div>

                    <h4>{item.title}</h4>
                    
                    <div className="fs-meta">
                      <span><FaCalendarAlt /> {item.date}</span>
                      <span><FaClock /> {item.time}</span>
                    </div>

                    <button 
                      className={`fs-action-btn ${isCompleted ? 'undo' : 'done'}`} 
                      onClick={() => toggleComplete(item.id)}
                    >
                      {isCompleted ? <><FaUndo /> Undo</> : <><BsCheck2Square /> Mark Done</>}
                    </button>
                  </div>
                );
              })
            ) : (
               <div className="fs-empty glass-effect">
                 <FaRocket className="fs-empty-icon float-anim" />
                 <h3>No Assignments Found</h3>
                 <p>Sync your calendar to get started.</p>
               </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;