export default function Privacy() {
  return (
    <main className="prose mx-auto p-6">
      <h1>Privacy Policy</h1>
      <p>Last updated: {new Date().toISOString().slice(0,10)}</p>
      <p>Tax Pro Exchange ("we") respects your privacy. We collect and process personal data to provide our services and improve your experience.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Account info (name, email) from your sign-in provider (Clerk/Google)</li>
        <li>Profile details you submit</li>
        <li>Usage and device data (for security and analytics)</li>
      </ul>
      <h2>How we use data</h2>
      <ul>
        <li>Authenticate and secure access</li>
        <li>Provide and improve features</li>
        <li>Comply with legal obligations</li>
      </ul>
      <h2>Contact</h2>
      <p>Questions? Email: support@taxproexchange.com</p>
    </main>
  );
}
