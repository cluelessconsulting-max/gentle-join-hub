import { Link } from "react-router-dom";

const Privacy = () => (
  <div className="min-h-screen bg-background px-6 py-16">
    <div className="max-w-[800px] mx-auto">
      <Link to="/" className="text-[11px] text-accent tracking-wide-lg uppercase no-underline hover:text-foreground transition-colors">← Back to Home</Link>
      
      <h1 className="font-display text-[42px] font-light text-foreground mt-8 mb-2">Privacy Policy</h1>
      <p className="text-[12px] text-warm-grey tracking-wide mb-10">Last updated: March 2026</p>

      <div className="space-y-8 text-[14px] text-foreground/80 leading-relaxed font-light">
        <section>
          <h2 className="font-display text-[22px] font-light text-foreground mb-3">What Data We Collect</h2>
          <p>We collect information you provide when applying for membership, including your name, email address, phone number, city, social media handles, and preferences. We also collect usage data such as pages visited and interactions with the platform.</p>
        </section>

        <section>
          <h2 className="font-display text-[22px] font-light text-foreground mb-3">How We Use It</h2>
          <p>Your data is used to process your membership application, personalise event recommendations, communicate with you about events and updates, and improve our service. We may share anonymised, aggregated data with brand partners to improve event curation.</p>
        </section>

        <section>
          <h2 className="font-display text-[22px] font-light text-foreground mb-3">Your Rights (GDPR)</h2>
          <p>Under the General Data Protection Regulation (GDPR), you have the right to access, rectify, or delete your personal data. You can request data portability or object to processing at any time. To exercise these rights, contact us at the email below.</p>
        </section>

        <section>
          <h2 className="font-display text-[22px] font-light text-foreground mb-3">Cookies</h2>
          <p>We use essential cookies for authentication and session management. We may use analytics cookies to understand how the platform is used. You can manage your cookie preferences through the cookie banner displayed on first visit.</p>
        </section>

        <section>
          <h2 className="font-display text-[22px] font-light text-foreground mb-3">Contact Us</h2>
          <p>For any privacy-related enquiries, please contact us at <a href="mailto:clueless.consulting@gmail.com" className="text-accent underline">clueless.consulting@gmail.com</a>.</p>
        </section>
      </div>
    </div>
  </div>
);

export default Privacy;
