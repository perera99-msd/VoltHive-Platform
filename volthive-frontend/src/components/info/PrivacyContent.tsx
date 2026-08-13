'use client';

export default function PrivacyContent() {
  return (
    <div className="space-y-6 text-[15px] leading-relaxed text-(--brand-ink)/90">
      <section>
        <h2 className="text-lg font-bold mb-1.5 text-(--brand-ink)">1. What we collect</h2>
        <p>We collect the information you provide — your name, email address, phone number, and the vehicles you register (make, model, connector type). When you use the map, we use your device location only to find stations within 10 km of you.</p>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-1.5 text-(--brand-ink)">2. How we use it</h2>
        <p>Your details are used to create your account, match you with the best nearby stations, coordinate charging bookings with station owners, and let you chat with stations about availability. We never sell your personal data.</p>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-1.5 text-(--brand-ink)">3. Location</h2>
        <p>Your location is used only while the app is open and only to power Smart Match and the live map. It is not stored or shared with third parties.</p>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-1.5 text-(--brand-ink)">4. Biometrics</h2>
        <p>Face ID / fingerprint login stays entirely on your device. The credential is managed by your operating system and never uploaded to our servers.</p>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-1.5 text-(--brand-ink)">5. Data sharing</h2>
        <p>Station owners can see your name and the messages you send them through the in-app chat, so they can confirm bookings and answer questions. Payment details, where collected at a station, are handled by that station directly.</p>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-1.5 text-(--brand-ink)">6. Your choices</h2>
        <p>You can update your profile, change your password, and disable biometric login at any time in Account. To delete your account, contact us and we will remove your data.</p>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-1.5 text-(--brand-ink)">7. Contact</h2>
        <p>Questions about this policy? Reach out through the in-app Help section or the contact details on the VoltHive site.</p>
      </section>
    </div>
  );
}
