import { Link } from "react-router-dom";

const Terms = () => (
  <div className="min-h-screen bg-background px-6 py-16">
    <div className="max-w-[800px] mx-auto">
      <Link to="/" className="text-[11px] text-accent tracking-wide-lg uppercase no-underline hover:text-foreground transition-colors">← Back to Home</Link>
      
      <h1 className="font-display text-[42px] font-light text-foreground mt-8 mb-2">Terms of Service</h1>
      <p className="text-[12px] text-warm-grey tracking-wide mb-10">Last updated: March 2026</p>

      <div className="space-y-8 text-[14px] text-foreground/80 leading-relaxed font-light">
        <section>
          <h2 className="font-display text-[22px] font-light text-foreground mb-3">Acceptance</h2>
          <p>By accessing or using OFFLIST, you agree to be bound by these Terms of Service. If you do not agree, you may not use the service.</p>
        </section>

        <section>
          <h2 className="font-display text-[22px] font-light text-foreground mb-3">Use of Service</h2>
          <p>OFFLIST is a membership-based platform providing access to curated private events. You agree to use the service only for lawful purposes and in accordance with these terms. You must not misuse the platform, attempt to gain unauthorised access, or interfere with other users' enjoyment of the service.</p>
        </section>

        <section>
          <h2 className="font-display text-[22px] font-light text-foreground mb-3">Membership</h2>
          <p>Membership is granted at the sole discretion of OFFLIST. We reserve the right to accept or reject any application without providing a reason. Membership may be revoked at any time for violation of these terms or community guidelines.</p>
        </section>

        <section>
          <h2 className="font-display text-[22px] font-light text-foreground mb-3">Cancellation</h2>
          <p>You may cancel your membership at any time by contacting us. Upon cancellation, your access to member-only events and features will be revoked.</p>
        </section>

        <section>
          <h2 className="font-display text-[22px] font-light text-foreground mb-3">Limitation of Liability</h2>
          <p>OFFLIST is provided "as is" without warranties of any kind. We shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.</p>
        </section>

        <section>
          <h2 className="font-display text-[22px] font-light text-foreground mb-3">Governing Law</h2>
          <p>These terms are governed by and construed in accordance with the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
        </section>
      </div>
    </div>
  </div>
);

export default Terms;
