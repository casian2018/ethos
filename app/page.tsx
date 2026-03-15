"use client";

import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';

export default function Home() {
  const [isLightMode, setIsLightMode] = useState(false);
  const [statsAnimated, setStatsAnimated] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  // Theme Toggle
  const toggleTheme = () => {
    setIsLightMode(!isLightMode);
  };

  useEffect(() => {
    // Scroll Reveal Logic
    const revealElements = document.querySelectorAll('.reveal');
    const revealOnScroll = () => {
      const windowHeight = window.innerHeight;
      revealElements.forEach((el) => {
        const elementTop = el.getBoundingClientRect().top;
        if (elementTop < windowHeight - 100) {
          el.classList.add('active');
        }
      });
    };

    // Stats Animation Logic
    const animateStats = () => {
      if (statsAnimated || !statsRef.current) return;
      const rect = statsRef.current.getBoundingClientRect();
      if (rect.top < window.innerHeight - 100) {
        setStatsAnimated(true);
        const numbers = document.querySelectorAll('.stat-number');
        numbers.forEach((stat) => {
          const target = parseInt(stat.getAttribute('data-target') || "0");
          const suffix = stat.getAttribute('data-suffix') || "";
          let current = 0;
          const increment = target / 120; // roughly 2 seconds at 60fps
          
          const updateCounter = () => {
            current += increment;
            if (current < target) {
              stat.textContent = Math.floor(current).toString();
              requestAnimationFrame(updateCounter);
            } else {
              stat.textContent = target + suffix;
            }
          };
          updateCounter();
        });
      }
    };

    window.addEventListener('scroll', revealOnScroll);
    window.addEventListener('scroll', animateStats);
    
    // Initial check
    revealOnScroll();
    animateStats();

    return () => {
      window.removeEventListener('scroll', revealOnScroll);
      window.removeEventListener('scroll', animateStats);
    };
  }, [statsAnimated]);

  return (
    <div className={isLightMode ? 'light-theme' : 'dark-theme'}>
      <style jsx global>{`
        :root {
          --navy-dark: #0F172A;
          --navy-light: #1E293B;
          --green-electric: #22C55E;
          --orange-energy: #F97316;
          --sky-blue: #38BDF8;
          --white: #FFFFFF;
          --gray-light: #F1F5F9;
          --gray-dark: #94A3B8;
          --glass-bg: rgba(255, 255, 255, 0.08);
          --glass-border: rgba(255, 255, 255, 0.12);
          --glow-green: 0 0 40px rgba(34, 197, 94, 0.3);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        
        body { 
          font-family: 'Inter', sans-serif;
          overflow-x: hidden;
        }

        .dark-theme { background: var(--navy-dark); color: var(--white); min-height: 100vh; transition: 0.4s; }
        .light-theme { background: var(--gray-light); color: var(--navy-dark); min-height: 100vh; transition: 0.4s; }

        /* NAVBAR */
        .navbar {
          position: fixed; top: 0; left: 0; right: 0;
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 8%; z-index: 1000;
          background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .light-theme .navbar { background: rgba(255, 255, 255, 0.9); border-bottom: 1px solid rgba(0,0,0,0.05); }

        .logo { font-size: 28px; font-weight: 900; letter-spacing: 3px; background: linear-gradient(135deg, var(--white), var(--green-electric)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .light-theme .logo { background: linear-gradient(135deg, var(--navy-dark), var(--green-electric)); -webkit-background-clip: text; }

        .nav-links { display: flex; gap: 40px; }
        .nav-links a { font-weight: 500; font-size: 15px; opacity: 0.8; transition: 0.3s; }
        .nav-links a:hover { opacity: 1; color: var(--green-electric); }

        .theme-toggle { width: 44px; height: 44px; border-radius: 50%; background: var(--glass-bg); border: 1px solid var(--glass-border); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; color: inherit; }

        /* HERO */
        .hero {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          text-align: center; padding: 120px 8% 80px; position: relative;
          background: url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80') center/cover no-repeat;
        }
        .hero::before { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.6) 50%, rgba(15,23,42,0.4) 100%); }

        .hero-content { position: relative; z-index: 2; max-width: 900px; }
        .hero h1 { font-size: clamp(42px, 7vw, 80px); font-weight: 800; margin-bottom: 24px; }
        .hero h1 span { background: linear-gradient(135deg, var(--green-electric), var(--sky-blue)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        
        .btn { padding: 18px 40px; border-radius: 50px; border: none; font-size: 16px; font-weight: 700; cursor: pointer; transition: 0.3s; display: inline-flex; align-items: center; gap: 10px; }
        .btn-primary { background: var(--green-electric); color: white; box-shadow: var(--glow-green); }
        .btn-secondary { background: transparent; border: 2px solid rgba(255,255,255,0.4); color: white; }

        /* STATS */
        .stats-section { margin-top: -80px; position: relative; z-index: 10; padding: 0 8%; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; max-width: 1100px; margin: 0 auto; }
        .stat-card { background: rgba(255,255,255,0.06); backdrop-filter: blur(20px); border: 1px solid var(--glass-border); border-radius: 24px; padding: 40px 30px; text-align: center; }
        .light-theme .stat-card { background: white; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .stat-number { font-size: 56px; font-weight: 900; color: var(--green-electric); }

        /* REVEAL ANIMATION */
        .reveal { opacity: 0; transform: translateY(30px); transition: 0.8s ease-out; }
        .reveal.active { opacity: 1; transform: translateY(0); }

        /* GRID SYSTEM */
        .section-header { text-align: center; margin-bottom: 60px; padding: 0 8%; }
        .section-tag { color: var(--orange-energy); font-weight: 700; text-transform: uppercase; font-size: 14px; }
        .steps-grid, .features-grid, .testimonials-grid { 
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; padding: 0 8% 100px; max-width: 1200px; margin: 0 auto;
        }

        .step-card, .feature-card, .testimonial-card {
          background: rgba(255,255,255,0.04); border: 1px solid var(--glass-border); padding: 40px; border-radius: 24px;
        }
        .light-theme .step-card, .light-theme .feature-card { background: white; }

        .phone-mockup { width: 250px; border-radius: 30px; margin: 10px; transition: 0.5s; }
        .phones-container { display: flex; justify-content: center; flex-wrap: wrap; padding: 40px 0; }

        @media (max-width: 768px) {
          .stats-grid, .steps-grid, .features-grid, .testimonials-grid { grid-template-columns: 1fr; }
          .nav-links { display: none; }
        }
      `}</style>

      {/* NAVBAR */}
      <nav className="navbar">
        <a href="#" className="logo">ETHOS</a>
        <ul className="nav-links">
        </ul>
        <div className="nav-actions">
          <button className="theme-toggle" onClick={toggleTheme}>
            <i className={`fas ${isLightMode ? 'fa-moon' : 'fa-sun'}`}></i>
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge" style={{ color: '#22C55E', marginBottom: '20px' }}>
            <i className="fas fa-bolt"></i> #1 Fitness Community App
          </div>
          <h1>Train Together.<br /><span>Stay Motivated.</span></h1>
          <p style={{ margin: '20px 0 40px', fontSize: '1.2rem' }}>Find workout partners, build real gym friendships, and stay consistent with Ethos.</p>
          <div className="hero-buttons">
            <a className="btn btn-primary" href='/auth'>
              <i className="fab fa-apple"></i> Get Started
            </a>
            <button className="btn btn-secondary" style={{ marginLeft: '15px' }}>
              <i className="fas fa-users"></i> See More
            </button>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="stats-section" ref={statsRef}>
        <div className="stats-grid">
          <div className="stat-card reveal">
            <div className="stat-number" data-target="120" data-suffix="K+">0</div>
            <div className="stat-label">Active Athletes</div>
          </div>
          <div className="stat-card reveal">
            <div className="stat-number" data-target="3" data-suffix="M">0</div>
            <div className="stat-label">Workouts Completed</div>
          </div>
          <div className="stat-card reveal">
            <div className="stat-number" data-target="92" data-suffix="%">0</div>
            <div className="stat-label">Stay Consistent</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding: '100px 0' }}>
        <div className="section-header reveal">
          <span className="section-tag">How It Works</span>
          <h2 style={{ fontSize: '2.5rem', marginTop: '10px' }}>Your Fitness Journey Starts Here</h2>
        </div>
        <div className="steps-grid">
          <div className="step-card reveal">
            <h3>1. Find People</h3>
            <p>Discover athletes training at your local gym.</p>
          </div>
          <div className="step-card reveal">
            <h3>2. Connect</h3>
            <p>Message potential workout partners and share goals.</p>
          </div>
          <div className="step-card reveal">
            <h3>3. Train</h3>
            <p>Schedule workouts and track progress together.</p>
          </div>
        </div>
      </section>

      {/* APP PREVIEW */}
      <section className="app-preview" style={{ textAlign: 'center', paddingBottom: '100px' }}>
        <div className="section-header reveal">
          <span className="section-tag">The App</span>
          <h2>Your Pocket Training Partner</h2>
        </div>
        <div className="phones-container">
          <img className="phone-mockup reveal" src="https://i.pinimg.com/736x/8c/22/73/8c22730f0c195068c79636b5f349445a.jpg" alt="App 1" />
          <img className="phone-mockup reveal" src="https://i.pinimg.com/736x/da/3c/13/da3c13c73fd8dd49c44ba9a9742abaa4.jpg" alt="App 2" />
          <img className="phone-mockup reveal" src="https://i.pinimg.com/736x/d2/01/6d/d2016d9b2796ee4b97d34f0f23132c00.jpg" alt="App 3" />
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '60px 8%', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
        <div className="logo" style={{ marginBottom: '20px' }}>ETHOS</div>
        <p>© 2026 Ethos. All rights reserved. Made with 💪 for athletes.</p>
      </footer>
    </div>
  );
}