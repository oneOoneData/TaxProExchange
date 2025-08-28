export default function Terms() {
  return (
    <main className="prose mx-auto p-6">
      <h1>Terms of Service</h1>
      <p>Last updated: {new Date().toISOString().slice(0,10)}</p>
      <h2>Acceptance of Terms</h2>
      <p>By using Tax Pro Exchange, you agree to these Terms.</p>
      <h2>Use of Service</h2>
      <ul>
        <li>You are responsible for your account and compliance with laws.</li>
        <li>No unauthorized access, abuse, or infringement.</li>
      </ul>
      <h2>Disclaimers</h2>
      <p>Service is provided "as is" without warranties. Liability is limited to the extent permitted by law.</p>
      <h2>Contact</h2>
      <p>Questions? Email: support@taxproexchange.com</p>
    </main>
  );
}
