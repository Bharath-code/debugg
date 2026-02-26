import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Playground } from './pages/Playground';
import './debugg'; // Initialize Debugg

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav style={styles.nav}>
          <div style={styles.navContent}>
            <Link to="/" style={styles.logo}>🛍️ DebugShop</Link>
            <div style={styles.links}>
              <Link to="/products">Products</Link>
              <Link to="/cart">Cart</Link>
              <Link to="/checkout">Checkout</Link>
              <Link to="/playground" style={styles.playgroundLink}>🎮 Playground</Link>
            </div>
          </div>
        </nav>

        <main style={styles.main}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/playground" element={<Playground />} />
          </Routes>
        </main>

        <footer style={styles.footer}>
          <p>DebugShop Demo - Built with Debugg Error Monitoring</p>
          <p style={styles.footerNote}>
            Trigger errors to see them in your Debugg dashboard!
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

const styles = {
  nav: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '16px 0',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  navContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    color: 'white',
    fontSize: '24px',
    fontWeight: 'bold',
    textDecoration: 'none'
  },
  links: {
    display: 'flex',
    gap: '24px',
    alignItems: 'center'
  },
  playgroundLink: {
    background: 'rgba(255,255,255,0.2)',
    padding: '8px 16px',
    borderRadius: '6px',
    color: 'white',
    textDecoration: 'none',
    fontWeight: '600'
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    minHeight: 'calc(100vh - 200px)'
  },
  footer: {
    background: '#1a202c',
    color: '#a0aec0',
    padding: '24px',
    textAlign: 'center',
    marginTop: '48px'
  },
  footerNote: {
    fontSize: '14px',
    marginTop: '8px',
    color: '#718096'
  }
};

export default App;
