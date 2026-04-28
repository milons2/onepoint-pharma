import { useEffect, useState } from 'react';
import '../styles/splash.css';

function SplashScreen({ onFinished }) {
  const [fadeOut, setFadeOut] = useState(false);
  const [statusText, setStatusText] = useState("Initializing System...");

  useEffect(() => {
    const stages = [
      { time: 500, text: "Connecting to PostgreSQL Database..." },
      { time: 1200, text: "Verifying System Integrity..." },
      { time: 1800, text: "Checking Security Protocols..." },
      { time: 2300, text: "System Health: Optimal." }
    ];

    stages.forEach(stage => {
      setTimeout(() => setStatusText(stage.text), stage.time);
    });

    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onFinished, 500); 
    }, 3000);

    return () => clearTimeout(timer);
  }, [onFinished]);

  return (
    <div className={`splash-overlay ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        {/* Main Brand Logo with Shining Effect */}
        <div className="logo-container">
           <img src="./onepoint.png" alt="OnePoint Logo" className="splash-logo-main" />
        </div>

        <div className="splash-text">
          <div className="loading-bar-container">
            <div className="loading-bar-progress"></div>
          </div>
          <p className="status-msg">{statusText}</p>
          <p className="version-tag">OnePoint Secure v1.0.2-stable</p>
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;