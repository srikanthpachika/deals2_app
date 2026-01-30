import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <div className="brand__mark">D2P</div>
          <div>
            <p className="eyebrow">Deal2Pro</p>
            <p className="site-footer__tagline">
              Clean, Amazon-only price drops with clear savings.
            </p>
          </div>
        </div>
        <div className="site-footer__cols">
          <div className="site-footer__col">
            <p className="site-footer__title">Marketing</p>
            <Link href="/blog">Growth playbook</Link>
          </div>
          <div className="site-footer__col">
            <p className="site-footer__title">Company</p>
            <Link href="/about">About Us</Link>
            <Link href="/contact">Contact Us</Link>
            <Link href="/affiliate-disclosure">Affiliate Disclosure</Link>
          </div>
          <div className="site-footer__col">
            <p className="site-footer__title">Legal</p>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
      <div className="site-footer__bottom">
        <p>(c) {new Date().getFullYear()} Deal2Pro. All rights reserved.</p>
      </div>
    </footer>
  );
}
