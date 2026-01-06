import React, { useState, useEffect } from 'react';
import ICAL from 'ical.js';
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
      // Proxy URL එක හරහා දත්ත ලබාගැනීම
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(calendarUrl)}`;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Link එක වැඩ නැහැ. කරුණාකර නිවැරදි Link එක දාන්න.");
      
      const textData = await response.text();
      
      // iCal Data parse කිරීම (අලුත් ක්‍රමය)
      const jcalData = ICAL.parse(textData);
      const comp = new ICAL.Component(jcalData);
      const vevents = comp.getAllSubcomponents('vevent');

      const formattedEvents = vevents.map(vevent => {
        // අපි ICAL.Event wrapper එක පාවිච්චි කරනවා, මේකෙන් නම ගන්න ලේසියි
        const event = new ICAL.Event(vevent);
        
        const title = event.summary;
        const description = event.description;
        const startDate = event.startDate.toJSDate();

        // Debugging සඳහා Console එකට විස්තර යවමු
        console.log("Found Event:", title, startDate);

        return {
          id: event.uid,
          title: title || "නමක් සොයාගත නොහැක (No Title)", // නම නැත්නම් මේක පෙන්වයි
          date: startDate.toDateString(),
          time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          description: description || "විස්තරයක් නැත",
          rawDate: startDate
        };
      });

      // ළඟම එන Assignments උඩින්ම පෙන්වන්න
      formattedEvents.sort((a, b) => a.rawDate - b.rawDate);

      setAssignments(formattedEvents);
      localStorage.setItem('sltc_calendar_url', calendarUrl);

    } catch (err) {
      console.error("Error fetching assignments:", err);
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
    <div className="container">
      <header className="header">
        <h1>📚 SLTC Assignment Tracker</h1>
        <p>LMS Calendar Link එක පහතින් දාන්න.</p>
      </header>

      <div className="search-box">
        <form onSubmit={handleSearch}>
          <input 
            type="text" 
            placeholder="Paste SLTC Calendar URL..." 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'සොයමින්...' : 'Assignments පෙන්වන්න'}
          </button>
        </form>
        {assignments.length > 0 && (
            <button onClick={clearData} className="clear-btn">Clear & Reset</button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      <div className="grid">
        {assignments.length > 0 ? (
          assignments.map((item, index) => (
            <div key={index} className="card">
              <div className="date-badge">
                <span>{item.date}</span>
              </div>
              {/* නම නැත්නම් රතු පාටින් පෙන්වන්න */}
              <h3 style={{ color: item.title.includes("No Title") ? 'red' : '#2c3e50' }}>
                {item.title}
              </h3>
              <p className="time">⏰ Due: {item.time}</p>
              <div className="desc-box">
                <p>{item.description.replace(/<[^>]*>?/gm, '').substring(0, 100)}...</p>
              </div>
            </div>
          ))
        ) : (
          !loading && <div className="empty-state">Assignments කිසිවක් නැත.</div>
        )}
      </div>
    </div>
  );
}

export default App;