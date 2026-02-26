export function Home() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>🛍️ Welcome to DebugShop</h1>
      <p style={{ fontSize: '20px', color: '#718096', marginBottom: '32px' }}>
        A demo e-commerce app showcasing Debugg error monitoring
      </p>
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <a href="/products" style={styles.button}>Browse Products</a>
        <a href="/playground" style={{...styles.button, ...styles.secondaryButton}}>🎮 Error Playground</a>
      </div>
    </div>
  );
}

export function Products() {
  const products = [
    { id: 1, name: 'Debugg T-Shirt', price: 29.99 },
    { id: 2, name: 'Debugg Hoodie', price: 59.99 },
    { id: 3, name: 'Debugg Stickers', price: 9.99 },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>Products</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '24px' }}>
        {products.map(product => (
          <div key={product.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
            <h3>{product.name}</h3>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#667eea' }}>${product.price}</p>
            <button style={{ background: '#667eea', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Cart() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <h1>🛒 Your Cart</h1>
      <p style={{ color: '#718096', marginTop: '16px' }}>Your cart is empty</p>
      <a href="/products" style={{ display: 'inline-block', marginTop: '24px', color: '#667eea' }}>Continue Shopping →</a>
    </div>
  );
}

export function Checkout() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <h1>💳 Checkout</h1>
      <p style={{ color: '#718096', marginTop: '16px' }}>Checkout functionality coming soon</p>
    </div>
  );
}

const styles = {
  button: {
    background: '#667eea',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    display: 'inline-block'
  },
  secondaryButton: {
    background: '#edf2f7',
    color: '#2d3748'
  }
};
