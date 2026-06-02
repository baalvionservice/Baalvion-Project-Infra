import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <div className="container row">
        <Link href="/" className="brand">BAALVION<span className="dot"> INSIDERS</span></Link>
        <nav className="nav" aria-label="Main navigation" style={{ display: "flex", alignItems: "center" }}>
          <Link href="/investors">Investors</Link>
          <Link href="/founders">Founders</Link>
          <a className="btn" href="https://insiders.baalvion.com/auth" style={{ marginLeft: 22 }}>Get funded</a>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container row" style={{ height: "auto", padding: "22px 20px", flexWrap: "wrap", gap: 8 }}>
        <span>© {new Date().getFullYear()} Baalvion. All rights reserved.</span>
        <span><Link href="/investors">Investors</Link> · <Link href="/founders">Founders</Link></span>
      </div>
    </footer>
  );
}

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function Avatar({ src, alt, eager }: { src?: string | null; alt: string; eager?: boolean }) {
  // Plain <img> (not next/image) so it renders without remote-loader config and stays crawlable.
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      className="avatar"
      src={src || "/avatar.svg"}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding={eager ? "sync" : "async"}
      width={48}
      height={48}
    />
  );
}

export function Badge({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return <span className={`badge${accent ? " accent" : ""}`}>{children}</span>;
}
