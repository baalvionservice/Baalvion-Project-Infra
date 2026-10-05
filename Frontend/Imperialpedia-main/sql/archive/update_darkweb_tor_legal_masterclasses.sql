-- Imperialpedia Surface Web, Dark Web, Tor Network & Legal Dossier SQL Migration
-- Target: Post 29 (update/expand) + Posts 5051 & 5052 (insert 1000+ word masterclasses)
-- Category: Internet (cat_id 15), Subcategory: Surface Web (sub_cat_id 83)

USE u945162271_imperial_pedia;

ALTER TABLE post CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1. Update Post 29: Surface Web vs Deep Web vs Dark Web Masterclass
UPDATE post SET 
  post_title = 'Surface Web vs. Deep Web vs. Dark Web: Architecture, Privacy & Security Guide (2026–2027)',
  uri = 'surface-web-vs-deep-web-vs-dark-web-guide',
  post_alt_title = 'Surface Web vs Deep Web vs Dark Web Guide 2026–2027',
  post_desc = '<div class="lead-intro" style="font-size:1.2rem; font-weight:500; color:#1e293b; margin-bottom:24px; border-left:4px solid #0891b2; padding-left:16px;">
The global Internet is structured into three distinct technical layers: the Surface Web, the Deep Web, and the Dark Web. While standard search engines index only 4% to 5% of online data, understanding how the underlying network infrastructure works is essential for cybersecurity professionals, digital media publishers, and privacy advocates. Below is our definitive 2026–2027 guide.
</div>

<h2>1. The 3-Tier Architecture of the Global Internet</h2>
<p>To understand digital privacy and network routing, analyze how data is structured across web layers:</p>

<ul>
  <li><strong>The Surface Web (Visible Web):</strong> Comprises indexed, publicly accessible web pages discoverable by standard search engine crawlers (Google, Bing, DuckDuckGo). Represents roughly 4% to 5% of total Internet content.</li>
  <li><strong>The Deep Web (Unindexed Private Web):</strong> Consists of password-protected databases, corporate intranets, academic portals, medical records, online banking dashboards, and private cloud storage. Represents 90% to 95% of all Internet data. Accessing the Deep Web is a routine daily activity.</li>
  <li><strong>The Dark Web (Encrypted Overlay Networks):</strong> A specialized subset of the Deep Web operating on encrypted overlay networks (Tor, I2P, Freenet) requiring specific routing browsers. Accounts for less than 1% of total web traffic.</li>
</ul>

<h2>2. Web Layers Comparison Matrix</h2>

<table class="table table-bordered my-4" style="background:#ffffff; border:1px solid #cbd5e1;">
  <thead style="background:#f1f5f9; font-family:Oswald, sans-serif;">
    <tr>
      <th>Web Layer</th>
      <th>Estimated Volume</th>
      <th>Access Requirements</th>
      <th>Search Engine Indexing</th>
      <th>Primary Use Cases</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Surface Web</strong></td>
      <td>4% – 5%</td>
      <td>Standard Web Browsers (Chrome, Safari, Firefox)</td>
      <td>Fully Indexed via Web Spiders</td>
      <td>News, e-commerce, public blogs, media sites</td>
    </tr>
    <tr>
      <td><strong>Deep Web</strong></td>
      <td>90% – 95%</td>
      <td>User Credentials & Authentication Tokens</td>
      <td>Unindexed (Protected behind paywalls/logins)</td>
      <td>Online banking, medical records, private SaaS, cloud files</td>
    </tr>
    <tr>
      <td><strong>Dark Web</strong></td>
      <td>&lt; 1%</td>
      <td>Specialized Browsers (Tor Browser, I2P Router)</td>
      <td>Unindexed (.onion / .i2p hidden services)</td>
      <td>Journalistic whistleblowing, anti-censorship, privacy</td>
    </tr>
  </tbody>
</table>

<h2>3. Why 95% of Internet Data is Unindexed</h2>
<p>Search engine spiders rely on hyperlinked web pages. Deep Web databases remain unindexed due to <code>robots.txt</code> exclusions, dynamic database queries (SQL results generated on demand), authentication paywalls, and non-standard network protocols.</p>',
  post_updated = NOW(),
  status = 'published'
WHERE post_id = 29;

-- 2. Insert Post 5051: Tor Network & Onion Routing Masterclass
INSERT INTO `post` (`post_id`, `cat_id`, `sub_cat_id`, `post_title`, `uri`, `post_img`, `post_alt_title`, `post_desc`, `posted_date`, `post_updated`, `status`) VALUES
(5051, 15, 83, 
'Tor Network & Onion Routing Masterclass: How Tor Works, Encryption & Technical Setup (2026–2027)', 
'tor-network-onion-routing-encryption-technical-setup-guide', 
'internet.jpg',
'Tor Network & Onion Routing Masterclass',
'<h2>1. How Onion Routing Works (Triple-Layer Encryption)</h2>
<p>The Tor Network (The Onion Router) is a free, open-source privacy network that enables anonymous communication. When a user connects to the Internet via Tor, their network traffic is routed through three volunteer-operated servers (relays) worldwide, wrapping data in three layers of AES cryptographic encryption like the layers of an onion.</p>

<table class="table table-bordered my-4" style="background:#ffffff; border:1px solid #cbd5e1;">
  <thead style="background:#f1f5f9; font-family:Oswald, sans-serif;">
    <tr>
      <th>Relay Node</th>
      <th>Role in Tor Network</th>
      <th>Encryption Visibility</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Entry / Guard Node</strong></td>
      <td>First relay connecting to the user</td>
      <td>Sees user IP address, but cannot read destination web data</td>
    </tr>
    <tr>
      <td><strong>Middle Relay</strong></td>
      <td>Passes encrypted data between Guard & Exit nodes</td>
      <td>Sees previous & next relay IPs; sees ZERO user IP or destination data</td>
    </tr>
    <tr>
      <td><strong>Exit Node</strong></td>
      <td>Final relay delivering traffic to destination website</td>
      <td>Sees destination website data, but cannot see original user IP</td>
    </tr>
  </tbody>
</table>

<h2>2. Tor Browser Security Levels & Configuration</h2>
<p>Tor Browser features three customizable security slider settings in <code>Settings &gt; Privacy & Security</code>:</p>

<ul>
  <li><strong>Standard Mode:</strong> All Tor Browser and website features are enabled. Best for casual anonymous browsing.</li>
  <li><strong>Safer Mode:</strong> Disables JavaScript on unencrypted (HTTP) sites, disables HTML5 audio/video codecs, and renders SVG images as static graphics.</li>
  <li><strong>Safest Mode:</strong> Disables JavaScript universally across all sites, disables web fonts, math symbols, and dynamic media scripts to protect against zero-day exploits.</li>
</ul>

<h2>3. Pluggable Transports & Bridges (Bypassing ISP Blocks)</h2>
<p>In countries where Internet Service Providers (ISPs) block standard Tor connections, Tor uses <strong>Pluggable Transports</strong> to disguise Tor traffic as regular HTTPS web traffic:</p>

<ol>
  <li><strong>obfs4 (Obfuscated 4):</strong> Transforms Tor traffic into randomized data patterns that Deep Packet Inspection (DPI) firewalls cannot recognize.</li>
  <li><strong>meek-azure:</strong> Routes Tor traffic through Microsoft Azure domain-fronting servers, making traffic appear as connections to trusted cloud services.</li>
  <li><strong>Snowflake:</strong> Routes traffic through volunteer web browser extensions to bypass strict state censorship.</li>
</ol>

<h2>4. Critical Security Rules for Tor Users</h2>
<ul>
  <li>Never download executable files (.exe, .dmg) via Tor while browser is active.</li>
  <li>Never use torrent clients over Tor (torrenting leaks true IP address and overloads network relays).</li>
  <li>Always use HTTPS links when exiting Tor nodes to prevent exit node sniffing.</li>
</ul>', 
NOW(), NOW(), 'published'),

-- 3. Insert Post 5052: Is the Dark Web Legal? Country-by-Country Breakdown
(5052, 15, 83, 
'Is the Dark Web Legal? Country-by-Country Legal Breakdown, Censorship & Security Warnings (2026–2027)', 
'is-dark-web-legal-country-legal-breakdown-censorship-security-guide', 
'internet.jpg',
'Is the Dark Web Legal Country Breakdown',
'<h2>1. Is Using Tor or the Dark Web Legal?</h2>
<p>The short answer is <strong>YES, using Tor or accessing dark web networks is 100% legal in the vast majority of democratic nations</strong>. Tor itself is privacy software originally developed by the U.S. Naval Research Laboratory. However, while using privacy technology is legal, committing illegal acts (purchasing contraband, fraud, copyright theft) remains strictly illegal regardless of which browser you use.</p>

<h2>2. Country-by-Country Legal & Censorship Status Matrix</h2>

<table class="table table-bordered my-4" style="background:#ffffff; border:1px solid #cbd5e1;">
  <thead style="background:#f1f5f9; font-family:Oswald, sans-serif;">
    <tr>
      <th>Jurisdiction / Country</th>
      <th>Legal Status of Tor & Dark Web</th>
      <th>State Censorship & DPI Blocking</th>
      <th>Legitimate Permitted Uses</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>United States & Canada</strong></td>
      <td><strong>100% Legal & Protected</strong></td>
      <td>Zero ISP blocking (1st Amendment protected)</td>
      <td>Whistleblowing, research, privacy, journalism</td>
    </tr>
    <tr>
      <td><strong>United Kingdom & EU Nations</strong></td>
      <td><strong>100% Legal & Protected</strong></td>
      <td>Zero blocking (GDPR privacy compliant)</td>
      <td>Secure Drop journalism, anti-surveillance</td>
    </tr>
    <tr>
      <td><strong>Australia & Japan</strong></td>
      <td><strong>100% Legal</strong></td>
      <td>Zero blocking (Monitored exit nodes)</td>
      <td>Academic research, digital privacy</td>
    </tr>
    <tr>
      <td><strong>Russia, Turkey & UAE</strong></td>
      <td><strong>Heavily Restricted / Monitored</strong></td>
      <td>Active ISP blocking & DPI filtering</td>
      <td>Requires obfs4 bridges for access</td>
    </tr>
    <tr>
      <td><strong>China, Iran & Belarus</strong></td>
      <td><strong>Banned / Blocked by State</strong></td>
      <td>Great Firewall active blocking & penalties</td>
      <td>Requires Snowflake & domain fronting</td>
    </tr>
  </tbody>
</table>

<h2>3. Legitimate & Ethical Use Cases for Dark Web Tech</h2>
<p>Millions of law-abiding citizens, human rights activists, and news organizations rely on Tor hidden services (.onion links) daily:</p>

<ul>
  <li><strong>Investigative Journalism (SecureDrop):</strong> Outlets like ProPublica, The New York Times, and The Guardian operate .onion dropboxes allowing whistleblowers to leak documents anonymously without endangering their safety.</li>
  <li><strong>Escaping Authoritarian Censorship:</strong> Citizens living under restrictive regimes use Tor to access blocked global news outlets (BBC, Deutsche Welle).</li>
  <li><strong>Secure Privacy Search:</strong> Search engines like DuckDuckGo operate official .onion addresses to process private searches without tracking user IP addresses.</li>
</ul>

<h2>4. Law Enforcement Monitoring & Safety Warnings</h2>
<p>Global law enforcement agencies (FBI, Europol, Interpol) actively monitor public dark web marketplaces and operate honeypot nodes to dismantle criminal operations. Always adhere to local laws and prioritize personal cybersecurity.</p>', 
NOW(), NOW(), 'published');
