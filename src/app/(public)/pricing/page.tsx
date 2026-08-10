export default function PricingPage() {
  return (
    <div>
      <h1>Pricing</h1>
      <p>Choose a plan that works for you.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginTop: '20px' }}>
        {[
          { name: "Professional", price: "699", features: ["Sales", "Inventory", "Customers", "Reports"] },
          { name: "Business", price: "999", features: ["Sales", "Inventory", "Customers", "Reports", "Advanced Reports", "API"] },
        ].map((plan) => (
          <div key={plan.name} style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3>{plan.name}</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>KES {plan.price}/month</p>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {plan.features.map((f) => (
                <li key={f} style={{ padding: '4px 0' }}>✓ {f}</li>
              ))}
            </ul>
            <a href="/login" style={{ display: 'inline-block', background: '#2563eb', color: 'white', padding: '10px 24px', borderRadius: '6px', textDecoration: 'none', marginTop: '16px' }}>
              Get Started
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}