import Link from "next/link";
import Image from "next/image";
import { getCommunities } from "@/lib/api/community";
import { CommunityCard } from "@/components/forums/community-card";
import { XenCategoryTable } from "@/components/forums/xen-category-table";
import { FORUM_CATEGORIES } from "@/lib/forum-data";

export default async function ForumHubPage() {
  const allCommunities = await getCommunities();
  const communities = allCommunities.filter((c) => c.isForum);

  return (
    <div className="baal-page">

      {/* ── EPIC HERO ── */}
      <section className="baal-hero">
        <div className="baal-hero-bg">
          <Image
            src="/baal_hero_bg.jpg"
            alt="Baal — god of storms"
            fill
            priority
            style={{ objectFit: "cover", objectPosition: "center 20%" }}
          />
        </div>

        {/* Animated lightning vignette overlay */}
        <div className="baal-hero-vignette" />
        <div className="baal-hero-scanlines" />

        {/* Particle sparks */}
        <div className="baal-sparks" aria-hidden="true">
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} className="baal-spark" style={{ "--i": i } as React.CSSProperties} />
          ))}
        </div>

        <div className="baal-hero-content">
          <div className="baal-eyebrow">
            <span className="baal-eyebrow-icon">⚡</span>
            MarketUnderworld Communities
          </div>
          <h1 className="baal-title">
            <span className="baal-title-glow">BAAL</span>
            <span className="baal-title-sub">בַּעַל</span>
          </h1>
          <p className="baal-subtitle">
            Lord &bull; Master &bull; Storm-bringer
          </p>
          <div className="baal-hero-divider">
            <span />
            <span className="baal-divider-rune">𓂀</span>
            <span />
          </div>
          <p className="baal-hero-desc">
            Canaanite god of fertility, storms, lightning, thunder, and rain.
            Worshiped across ancient Canaan — his name means <em>"lord"</em> or <em>"master."</em>
          </p>
          <a href="#communities" className="baal-cta">
            Enter the Communities
            <span className="baal-cta-arrow">↓</span>
          </a>
        </div>

        {/* Scroll indicator */}
        <div className="baal-scroll-hint" aria-hidden="true">
          <div className="baal-scroll-line" />
        </div>
      </section>

      {/* ── ATTRIBUTES STRIP ── */}
      <section className="baal-attrs">
        {[
          { icon: "⚡", label: "Lightning", sub: "Storm-wielder" },
          { icon: "🌩️", label: "Thunder",   sub: "Sky sovereign" },
          { icon: "🌧️", label: "Rain",       sub: "Fertility god" },
          { icon: "👑", label: "Lord",       sub: "Master & King" },
          { icon: "🔥", label: "Sacrifice",  sub: "Worshiped in fire" },
        ].map((a) => (
          <div key={a.label} className="baal-attr-item">
            <div className="baal-attr-icon">{a.icon}</div>
            <div className="baal-attr-label">{a.label}</div>
            <div className="baal-attr-sub">{a.sub}</div>
          </div>
        ))}
      </section>

      {/* ── LORE + IDOL SECTION ── */}
      <section className="baal-lore">
        <div className="baal-lore-inner">
          <div className="baal-lore-text">
            <div className="baal-section-eyebrow">Ancient Lore</div>
            <h2 className="baal-section-title">The Definition of Baal</h2>
            <div className="baal-lore-body">
              <p>
                <span className="baal-dropcap">B</span>aal was the supreme deity in the Canaanite pantheon —
                the rider of clouds, hurler of lightning, master of storms. His name, meaning{" "}
                <strong>"lord"</strong> or <strong>"master,"</strong> was not merely a title but a proclamation
                of absolute dominion over sky, earth, and sea.
              </p>
              <p>
                As god of fertility, storms, lightning, thunder, and rain, Baal was seen as the force
                that brought life-giving rains to parched fields — and the terrifying power that could
                destroy with a single bolt from the heavens. He was worshiped across ancient Canaan in ways
                described as <em>horrible</em> by biblical accounts.
              </p>
              <p>
                Israel itself was seduced into his worship — the tension between the monotheistic covenant
                and the allure of Baal's storms forms one of the Bible's defining conflicts.
              </p>
            </div>
            <div className="baal-tags">
              {["Canaanite", "Storm God", "Fertility", "Ancient Near East", "Hebrew Mind", "Biblical History"].map(tag => (
                <span key={tag} className="baal-tag">#{tag}</span>
              ))}
            </div>
          </div>

          <div className="baal-idol-wrap">
            <div className="baal-idol-glow" />
            <Image
              src="/baal_stone_idol.jpg"
              alt="Ancient Baal stone idol"
              width={380}
              height={507}
              className="baal-idol-img"
            />
            <div className="baal-idol-caption">
              <span>Baal • c. 1400–1200 BCE</span>
              <span>Storm & Fertility Deity · Canaan</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMUNITIES ── */}
      <section className="baal-communities" id="communities">
        <div className="baal-communities-inner">
          <div className="baal-section-eyebrow">Explore</div>
          <h2 className="baal-section-title">Join a Community</h2>
          <p className="baal-communities-lead">
            Real, moderated spaces for those who think differently — security researchers, educators,
            investors, traders, and builders.
          </p>

          {/* ── XENFORO CATEGORIES TABLE (Matching altenens.is) ── */}
          <div className="mb-14 space-y-6">
            {FORUM_CATEGORIES.map((category) => (
              <XenCategoryTable key={category.slug} category={category} />
            ))}
          </div>

          {communities.length > 0 && (
            <div className="mt-12">
              <h3 className="text-xl font-bold text-gray-300 mb-6">Additional Communities</h3>
              <div className="baal-grid">
                {communities.map((community) => (
                  <CommunityCard key={community.slug} community={community} />
                ))}
              </div>
            </div>
          )}

          {/* Access tiers notice */}
          <Link href="/access" className="baal-access-notice">
            <div className="baal-access-notice-icon">🔑</div>
            <div className="baal-access-notice-text">
              <strong>Looking for Marketplace, Global Elite, or VIP access?</strong>
              <p>Those are platform-wide tiers — unlock them on the Access page.</p>
            </div>
            <div className="baal-access-arrow">→</div>
          </Link>
        </div>
      </section>

      {/* ── CINEMATIC DIVIDER ── */}
      <div className="baal-cinematic-divider">
        <div className="baal-cinematic-line" />
        <span className="baal-cinematic-glyph">⚡ BAALVION ⚡</span>
        <div className="baal-cinematic-line" />
      </div>

    </div>
  );
}
