import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="mt-20 py-12 border-t border-(--brand-border) bg-(--brand-card)/65 backdrop-blur-sm overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-5 text-sm font-medium text-(--brand-muted)">
        <div className="flex items-center gap-3 text-(--brand-ink)">
          <Image
            src="/brand/logo-without-slogan.png"
            alt="VoltHive"
            width={142}
            height={40}
            className="h-8 w-auto"
          />
          <span className="hidden sm:block text-xs uppercase tracking-[0.18em] text-(--brand-muted)">EV Infrastructure Platform</span>
        </div>
        <p>© {new Date().getFullYear()} VoltHive Technologies. All rights reserved.</p>
      </div>
    </footer>
  );
}