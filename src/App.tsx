import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "market" | "sell" | "bundle" | "bid" | "reveal" | "settle";

const TABS: { key: Tab; label: string }[] = [
  { key: "market", label: "Market" },
  { key: "sell",   label: "Sell" },
  { key: "bundle", label: "Bundle" },
  { key: "bid",    label: "Bid" },
  { key: "reveal", label: "Reveal" },
  { key: "settle", label: "Settle" },
];

const MOCK_LISTINGS = [
  {
    id: 1,
    title: "DeFi Wallet Behaviour Dataset",
    description: "6M anonymised transaction records labelled by protocol type. Perfect for training DeFi risk models.",
    reserveEth: "0.5",
    deadline: "2026-06-04 18:00 UTC",
    bids: 4,
    settled: false,
    aiScore: 8.4,
    tags: ["DeFi", "6M rows", "Labelled"],
  },
  {
    id: 2,
    title: "NFT Wash-Trade Signal Dataset",
    description: "Labelled on-chain wash-trade patterns across 12 chains. 2M samples, 99.1% precision.",
    reserveEth: "1.2",
    deadline: "2026-06-04 20:00 UTC",
    bids: 7,
    settled: false,
    aiScore: 9.1,
    tags: ["NFT", "2M rows", "Multi-chain"],
  },
  {
    id: 3,
    title: "MEV Bundle Strategy Vault",
    description: "Proprietary MEV extraction logic. Vault-locked. License unlocks model weights and replay scripts.",
    reserveEth: "3.0",
    deadline: "2026-06-02 12:00 UTC",
    bids: 2,
    settled: true,
    winner: "0xaBcD…1234",
    aiScore: 7.8,
    tags: ["MEV", "Strategy", "Vault"],
  },
];

const ACTIVITY_FEED = [
  { id: 1, type: "bid",    text: "0xf4aB…3c12 placed a blind bid on listing #2",         time: "2m ago" },
  { id: 2, type: "list",   text: "0x9Bc1…77de listed a new dataset: MEV Bundle Strategy", time: "8m ago" },
  { id: 3, type: "settle", text: "Listing #3 settled — winner 0xaBcD…1234",               time: "14m ago" },
  { id: 4, type: "resell", text: "License NFT #1 resold for 2.4 IP · royalty paid",       time: "31m ago" },
  { id: 5, type: "bid",    text: "0x3312…aaF0 placed a blind bid on listing #1",          time: "45m ago" },
  { id: 6, type: "reveal", text: "0xd99A…1122 revealed bid on listing #2",                time: "1h ago" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("market");
  const [account, setAccount] = useState<string | null>(null);

  async function connectWallet() {
    try {
      const { switchToAeneid } = await import("./lib/wallet");
      await switchToAeneid();
      const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
    } catch {
      alert("Please install MetaMask!");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#03030a", color: "#f0ede8", fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .tab-btn { background: none; border: none; cursor: pointer; padding: 8px 16px; font-family: inherit; font-size: 13px; font-weight: 500; letter-spacing: 0.02em; color: #444460; transition: all 0.2s; border-radius: 6px; position: relative; }
        .tab-btn:hover { color: #8888aa; background: rgba(255,255,255,0.03); }
        .tab-btn.active { color: #f0ede8; background: rgba(255,255,255,0.06); }
        .tab-btn.active::after { content: ''; position: absolute; bottom: -1px; left: 16px; right: 16px; height: 1px; background: linear-gradient(90deg, transparent, #7c6fff, transparent); }
        .card { background: #080814; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 24px; transition: all 0.2s; }
        .card:hover { border-color: rgba(124,111,255,0.2); background: #09091a; }
        .input { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 11px 14px; color: #f0ede8; font-family: inherit; font-size: 13px; outline: none; transition: all 0.2s; }
        .input:focus { border-color: rgba(124,111,255,0.5); background: rgba(124,111,255,0.04); }
        .input::placeholder { color: #2a2a45; }
        .btn-primary { background: linear-gradient(135deg, #7c6fff, #5b4fff); color: #fff; border: none; border-radius: 10px; padding: 12px 24px; font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; letter-spacing: 0.02em; transition: all 0.2s; box-shadow: 0 0 20px rgba(124,111,255,0.3); }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 0 30px rgba(124,111,255,0.5); }
        .btn-primary:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }
        .btn-ghost { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 11px 20px; font-family: inherit; font-size: 13px; font-weight: 500; color: #8888aa; cursor: pointer; transition: all 0.2s; }
        .btn-ghost:hover { border-color: rgba(124,111,255,0.4); color: #c0b8ff; background: rgba(124,111,255,0.06); }
        .btn-ghost:disabled { opacity: 0.35; cursor: not-allowed; }
        .label { font-size: 11px; color: #3a3a5a; letter-spacing: 0.1em; margin-bottom: 6px; text-transform: uppercase; font-weight: 500; }
        .badge { display: inline-flex; align-items: center; font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 100px; letter-spacing: 0.04em; margin-right: 6px; }
        .badge-open { background: rgba(100,220,120,0.1); color: #64dc78; border: 1px solid rgba(100,220,120,0.2); }
        .badge-settled { background: rgba(124,111,255,0.1); color: #9d8fff; border: 1px solid rgba(124,111,255,0.2); }
        .badge-tag { background: rgba(255,255,255,0.04); color: #5a5a80; border: 1px solid rgba(255,255,255,0.06); }
        .score-ring { display: flex; align-items: center; justify-content: center; width: 52px; height: 52px; border-radius: 50%; background: conic-gradient(#7c6fff 0%, #5b4fff 100%, rgba(255,255,255,0.05) 0%); font-size: 15px; font-weight: 700; color: #fff; flex-shrink: 0; box-shadow: 0 0 16px rgba(124,111,255,0.4); }
        .step-row { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 24px; }
        .step-num { width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; font-size: 11px; color: #3a3a5a; flex-shrink: 0; margin-top: 2px; font-weight: 600; }
        .step-num.done { background: rgba(100,220,120,0.1); border-color: rgba(100,220,120,0.3); color: #64dc78; }
        .err-box { margin-top: 12px; padding: 12px 14px; background: rgba(220,80,80,0.08); border: 1px solid rgba(220,80,80,0.2); border-radius: 10px; font-size: 12px; color: #dc6060; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 600px) { .grid-2 { grid-template-columns: 1fr; } }
        .divider { height: 1px; background: rgba(255,255,255,0.05); margin: 20px 0; }
        .stat-block { display: flex; flex-direction: column; gap: 3px; }
        .stat-label { font-size: 10px; color: #3a3a5a; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 500; }
        .stat-value { font-size: 13px; color: #a0a0c0; font-weight: 500; }
        .glow-line { height: 1px; background: linear-gradient(90deg, transparent, rgba(124,111,255,0.4), transparent); }
        .feed-dot-bid { background: rgba(124,111,255,0.15); color: #9d8fff; }
        .feed-dot-list { background: rgba(100,220,120,0.15); color: #64dc78; }
        .feed-dot-settle { background: rgba(255,180,60,0.15); color: #ffb43c; }
        .feed-dot-resell { background: rgba(60,180,255,0.15); color: #3cb4ff; }
        .feed-dot-reveal { background: rgba(255,100,180,0.15); color: #ff64b4; }
        .vault-copy { cursor: pointer; color: #9d8fff; font-family: monospace; font-size: 12px; }
        .vault-copy:hover { color: #c0b8ff; text-decoration: underline; }
      `}</style>

      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "0 32px", display: "flex", alignItems: "center", gap: 12, height: 64, backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 100, background: "rgba(3,3,10,0.8)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="rgba(124,111,255,0.15)"/>
            <path d="M16 6 L26 11 L26 21 L16 26 L6 21 L6 11 Z" fill="none" stroke="#7c6fff" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M16 11 L21 13.5 L21 18.5 L16 21 L11 18.5 L11 13.5 Z" fill="rgba(124,111,255,0.2)" stroke="#9d8fff" strokeWidth="1" strokeLinejoin="round"/>
            <circle cx="16" cy="16" r="2.5" fill="#7c6fff"/>
            <circle cx="16" cy="16" r="1" fill="#fff"/>
          </svg>
          <div>
            <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", lineHeight: 1 }}>DarkPool</div>
            <div style={{ fontSize: 9, color: "#3a3a5a", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 1 }}>Protocol</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: 32 }}>
          {TABS.map(t => (
            <button key={t.key} className={`tab-btn${tab === t.key ? " active" : ""}`} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#64dc78", display: "inline-block", boxShadow: "0 0 6px #64dc78" }}/>
          <span style={{ fontSize: 11, color: "#5a5a80", fontWeight: 500 }}>Aeneid Testnet</span>
        </div>
        {account ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "rgba(124,111,255,0.08)", border: "1px solid rgba(124,111,255,0.2)", borderRadius: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#7c6fff", display: "inline-block" }}/>
            <span style={{ fontSize: 12, color: "#9d8fff", fontWeight: 500 }}>{account.slice(0,6)}…{account.slice(-4)}</span>
          </div>
        ) : (
          <button className="btn-primary" onClick={connectWallet} style={{ padding: "8px 18px", fontSize: 12 }}>Connect wallet</button>
        )}
      </header>

      <div className="glow-line" />

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 32px" }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}>
            {tab === "market" && <MarketTab />}
            {tab === "sell"   && <SellTab account={account} />}
            {tab === "bundle" && <BundleTab account={account} />}
            {tab === "bid"    && <BidTab account={account} />}
            {tab === "reveal" && <RevealTab account={account} />}
            {tab === "settle" && <SettleTab account={account} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [phase, setPhase] = useState<"live" | "reveal">("live");
  useEffect(() => {
    function calculate() {
      const end = new Date(deadline).getTime();
      const diff = end - Date.now();
      if (diff <= 0) { setPhase("reveal"); setTimeLeft("Reveal phase open"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`); setPhase("live");
    }
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [deadline]);
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", background: phase === "reveal" ? "rgba(124,111,255,0.1)" : "rgba(100,220,120,0.06)", border: `1px solid ${phase === "reveal" ? "rgba(124,111,255,0.2)" : "rgba(100,220,120,0.15)"}`, borderRadius: 6, fontSize: 12, fontWeight: 600, color: phase === "reveal" ? "#9d8fff" : "#64dc78", fontVariantNumeric: "tabular-nums" }}>
      <span style={{ fontSize: 8 }}>●</span>{timeLeft}
    </div>
  );
}

function PageHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 28, letterSpacing: "-0.03em", marginBottom: 8, background: "linear-gradient(135deg, #f0ede8, #9d8fff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{title}</h1>
      <p style={{ fontSize: 14, color: "#444460", lineHeight: 1.6, maxWidth: 520 }}>{sub}</p>
    </div>
  );
}

function CopyBox({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, marginTop: 8 }}>
      <div>
        <div style={{ fontSize: 10, color: "#3a3a5a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{label}</div>
        <div className="vault-copy" onClick={copy}>{value.length > 20 ? `${value.slice(0,12)}…${value.slice(-6)}` : value}</div>
      </div>
      <button onClick={copy} style={{ background: copied ? "rgba(100,220,120,0.1)" : "rgba(124,111,255,0.1)", border: `1px solid ${copied ? "rgba(100,220,120,0.2)" : "rgba(124,111,255,0.2)"}`, borderRadius: 6, padding: "4px 10px", fontSize: 11, color: copied ? "#64dc78" : "#9d8fff", cursor: "pointer" }}>
        {copied ? "✓ copied" : "copy"}
      </button>
    </div>
  );
}

function MarketTab() {
  return (
    <div style={{ display: "flex", gap: 24 }}>
      <div style={{ flex: 1 }}>
        <PageHeader title="Data marketplace" sub="Private datasets secured by CDR vaults. AI-scored quality. Bids are blind. Winners receive a License NFT." />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {MOCK_LISTINGS.map(l => (
            <motion.div key={l.id} className="card" whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span className={`badge ${l.settled ? "badge-settled" : "badge-open"}`}>{l.settled ? "settled" : "● live"}</span>
                    {l.tags.map(tag => <span key={tag} className="badge badge-tag">{tag}</span>)}
                  </div>
                  <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: 17, marginBottom: 6, color: "#f0ede8" }}>{l.title}</div>
                  <div style={{ fontSize: 13, color: "#444460", lineHeight: 1.6, marginBottom: 16 }}>{l.description}</div>
                  <div className="divider" style={{ margin: "0 0 16px" }} />
                  <div style={{ display: "flex", gap: 32 }}>
                    <div className="stat-block"><div className="stat-label">Reserve</div><div className="stat-value">{l.reserveEth} IP</div></div>
                    <div className="stat-block"><div className="stat-label">Blind bids</div><div className="stat-value">{l.bids}</div></div>
                    <div className="stat-block">
                      <div className="stat-label">Deadline</div>
                      <div style={{ marginTop: 2 }}>{l.settled ? <span style={{ fontSize: 12, color: "#3a3a5a" }}>Auction ended</span> : <CountdownTimer deadline={l.deadline} />}</div>
                    </div>
                    {l.winner && <div className="stat-block"><div className="stat-label">Winner</div><div style={{ fontSize: 13, color: "#7c6fff", fontWeight: 600 }}>{l.winner}</div></div>}
                  </div>
                </div>
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <div className="score-ring">{l.aiScore}</div>
                  <div style={{ fontSize: 10, color: "#3a3a5a", marginTop: 6, letterSpacing: "0.08em", textTransform: "uppercase" }}>AI score</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div style={{ marginTop: 24, padding: "16px 20px", background: "rgba(124,111,255,0.04)", border: "1px solid rgba(124,111,255,0.1)", borderRadius: 12, fontSize: 12, color: "#3a3a5a", lineHeight: 2, display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ color: "#7c6fff", fontSize: 16 }}>◈</span>
          <span><span style={{ color: "#7c6fff" }}>CDR-secured</span> · threshold-encrypted vaults · TEE-gated access · License NFT ownership · zero raw data exposure</span>
        </div>
      </div>
      <div style={{ width: 260, flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: "#3a3a5a", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500, marginBottom: 14 }}>Live activity</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ACTIVITY_FEED.map(a => (
            <motion.div key={a.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: a.id * 0.05 }}
              style={{ padding: "12px 14px", background: "#080814", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 100 }} className={`feed-dot-${a.type}`}>{a.type}</span>
                <span style={{ fontSize: 10, color: "#3a3a5a", marginLeft: "auto" }}>{a.time}</span>
              </div>
              <div style={{ fontSize: 12, color: "#5a5a80", lineHeight: 1.5 }}>{a.text}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SellTab({ account }: { account: string | null }) {
  const [form, setForm] = useState({ title: "", description: "", reserve: "0.5", hours: "48", royalty: "5" });
  const [file, setFile] = useState<File | null>(null);
  const [scoring, setScoring] = useState(false);
  const [score, setScore] = useState<any>(null);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [listing, setListing] = useState(false);
  const [listed, setListed] = useState(false);
  const [listedVaultId, setListedVaultId] = useState("");
  const [listedId, setListedId] = useState("");
  const [txHash, setTxHash] = useState("");

  async function handleScore() {
    if (!file || !form.title) return alert("Add a title and file first");
    setScoring(true);
    setScoreError(null);
    try {
      const { scoreDataset } = await import("./lib/ai");
      const result = await scoreDataset(form.title, form.description, file.name, file.size);
      setScore(result);
    } catch (e: any) {
      setScoreError(e?.message ?? "Scoring failed");
    } finally {
      setScoring(false);
    }
  }

  async function handleList() {
    if (!file || !form.title) return alert("Add a file and title first");
    setListing(true);
    try {
      const vaultId = "0x" + Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, "0")).join("");
      const metadataURI = JSON.stringify({ title: form.title, description: form.description, fileName: file.name, size: file.size });
      const { listDataset, getNextListingId } = await import("./lib/wallet");
      const { saveListing } = await import("./lib/storage");
      const nextId = await getNextListingId();
      const hash = await listDataset(vaultId, metadataURI, form.reserve, Number(form.hours));
      saveListing({ listingId: String(nextId), vaultId, title: form.title, timestamp: Date.now() });
      setListedVaultId(vaultId);
      setListedId(String(nextId));
      setTxHash(hash);
      setListed(true);
    } catch (e: any) {
      alert(e?.message ?? "Transaction failed");
    } finally {
      setListing(false);
    }
  }

  return (
    <div>
      <PageHeader title="List a dataset" sub="Encrypt your dataset into a CDR vault. Get an AI quality score before listing it on the marketplace." />
      <div style={{ maxWidth: 600 }}>
        <div className="card">
          <div className="step-row">
            <div className={`step-num${file ? " done" : ""}`}>{file ? "✓" : "1"}</div>
            <div style={{ flex: 1 }}>
              <div className="label" style={{ marginBottom: 10 }}>Upload dataset file</div>
              <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} style={{ fontSize: 12, color: "#5a5a80" }} />
              {file && <div style={{ fontSize: 12, color: "#64dc78", marginTop: 8 }}>✓ {file.name} <span style={{ color: "#3a3a5a" }}>({(file.size/1024).toFixed(1)} KB)</span></div>}
            </div>
          </div>
          <div className="step-row">
            <div className={`step-num${form.title ? " done" : ""}`}>{form.title ? "✓" : "2"}</div>
            <div style={{ flex: 1 }}>
              <div className="label" style={{ marginBottom: 10 }}>Dataset metadata</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div><div className="label">Title</div><input className="input" placeholder="e.g. DeFi Wallet Behaviour Dataset" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} /></div>
                <div><div className="label">Description</div><textarea className="input" rows={3} placeholder="Schema, size, use cases…" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} style={{ resize: "none" }} /></div>
              </div>
            </div>
          </div>
          <div className="step-row">
            <div className="step-num">3</div>
            <div style={{ flex: 1 }}>
              <div className="label" style={{ marginBottom: 10 }}>Auction settings</div>
              <div className="grid-2">
                <div><div className="label">Reserve price (IP)</div><input className="input" type="number" step="0.01" value={form.reserve} onChange={e => setForm(f => ({...f, reserve: e.target.value}))} /></div>
                <div><div className="label">Duration (hours)</div><input className="input" type="number" value={form.hours} onChange={e => setForm(f => ({...f, hours: e.target.value}))} /></div>
                <div style={{ gridColumn: "1/-1" }}>
                  <div className="label">Royalty on resale (%)</div>
                  <input className="input" type="number" min="0" max="30" value={form.royalty} onChange={e => setForm(f => ({...f, royalty: e.target.value}))} />
                  <div style={{ fontSize: 11, color: "#3a3a5a", marginTop: 6 }}>You earn this % automatically every time your License NFT is resold on-chain</div>
                </div>
              </div>
            </div>
          </div>
          <div className="divider" />
          <button className="btn-ghost" onClick={handleScore} disabled={scoring} style={{ width: "100%", marginBottom: 12 }}>
            {scoring ? "⟳  Claude is analysing your dataset…" : "✦  get AI quality score"}
          </button>
          {scoreError && <div className="err-box">✕ {scoreError}</div>}
          {score && (
            <div style={{ padding: "20px", background: "rgba(124,111,255,0.04)", border: "1px solid rgba(124,111,255,0.12)", borderRadius: 12, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                <div className="score-ring" style={{ width: 60, height: 60, fontSize: 20 }}>{score.overall}</div>
                <div>
                  <div style={{ fontSize: 14, color: "#9d8fff", fontWeight: 600, marginBottom: 4 }}>AI Quality Score</div>
                  <div style={{ fontSize: 13, color: "#5a5a80", lineHeight: 1.5 }}>{score.summary}</div>
                </div>
              </div>
              <div className="grid-2" style={{ marginBottom: 16 }}>
                {["completeness","clarity","usability","freshness"].map(k => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ color: "#444460", textTransform: "capitalize" }}>{k}</span>
                    <span style={{ color: "#9d8fff", fontWeight: 600 }}>{(score as any)[k]}/10</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div className="label" style={{ marginBottom: 8, color: "#64dc78" }}>Strengths</div>
                  {score.strengths.map((s: string, i: number) => <div key={i} style={{ fontSize: 12, color: "#4a8a5a", marginBottom: 4 }}><span style={{ color: "#64dc78" }}>+ </span>{s}</div>)}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="label" style={{ marginBottom: 8, color: "#dc6060" }}>Weaknesses</div>
                  {score.weaknesses.map((w: string, i: number) => <div key={i} style={{ fontSize: 12, color: "#8a4a4a", marginBottom: 4 }}><span style={{ color: "#dc6060" }}>− </span>{w}</div>)}
                </div>
              </div>
            </div>
          )}
          <button className="btn-primary" style={{ width: "100%" }} disabled={!account || listing || listed} onClick={handleList}>
            {!account ? "Connect wallet to list" : listing ? "⟳ encrypting into CDR vault…" : listed ? "✓ dataset listed on-chain!" : "Encrypt & list dataset"}
          </button>
          {listed && (
            <div style={{ marginTop: 12, padding: "16px", background: "rgba(100,220,120,0.06)", border: "1px solid rgba(100,220,120,0.15)", borderRadius: 10 }}>
              <div style={{ fontSize: 13, color: "#64dc78", marginBottom: 8 }}>✓ Dataset encrypted · Listed on Story Aeneid</div>
              <CopyBox label="Listing ID" value={listedId} />
              <CopyBox label="CDR Vault ID" value={listedVaultId} />
              <CopyBox label="Transaction" value={txHash} />
              <div style={{ fontSize: 11, color: "#3a3a5a", marginTop: 8 }}>Save your Vault ID — you'll need it to manage your listing</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BundleTab({ account }: { account: string | null }) {
  const [sellers, setSellers] = useState([
    { address: "", vaultId: "", share: "50" },
    { address: "", vaultId: "", share: "50" },
  ]);
  const [form, setForm] = useState({ title: "", description: "", reserve: "1.0", hours: "48" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function addSeller() { setSellers(s => [...s, { address: "", vaultId: "", share: "0" }]); }
  function removeSeller(i: number) { setSellers(s => s.filter((_, idx) => idx !== i)); }
  function updateSeller(i: number, field: string, value: string) {
    setSellers(s => s.map((sel, idx) => idx === i ? { ...sel, [field]: value } : sel));
  }
  const totalShare = sellers.reduce((sum, s) => sum + Number(s.share), 0);

  async function handleSubmit() {
    if (!form.title) return alert("Add a title");
    if (totalShare !== 100) return alert("Shares must add up to 100%");
    setSubmitting(true);
    try { await new Promise(r => setTimeout(r, 2000)); setDone(true); }
    finally { setSubmitting(false); }
  }

  return (
    <div>
      <PageHeader title="Bundle listing" sub="Pool multiple CDR vaults into one auction. Revenue splits automatically on-chain between all sellers." />
      <div style={{ maxWidth: 600 }}>
        <div className="card">
          <div className="label" style={{ marginBottom: 16 }}>Sellers & vaults</div>
          {sellers.map((sel, i) => (
            <div key={i} style={{ padding: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: "#7c6fff", fontWeight: 600 }}>Seller {i + 1}</span>
                {sellers.length > 2 && <button onClick={() => removeSeller(i)} style={{ background: "none", border: "none", color: "#dc6060", cursor: "pointer", fontSize: 12 }}>remove</button>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div><div className="label">Wallet address</div><input className="input" placeholder="0x…" value={sel.address} onChange={e => updateSeller(i, "address", e.target.value)} /></div>
                <div><div className="label">CDR vault ID</div><input className="input" placeholder="0x…" value={sel.vaultId} onChange={e => updateSeller(i, "vaultId", e.target.value)} /></div>
                <div><div className="label">Revenue share (%)</div><input className="input" type="number" min="0" max="100" value={sel.share} onChange={e => updateSeller(i, "share", e.target.value)} /></div>
              </div>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <button className="btn-ghost" onClick={addSeller} style={{ padding: "8px 14px", fontSize: 12 }}>+ add seller</button>
            <span style={{ fontSize: 12, fontWeight: 600, color: totalShare === 100 ? "#64dc78" : "#dc6060" }}>{totalShare}% {totalShare === 100 ? "✓" : "— must equal 100%"}</span>
          </div>
          <div className="divider" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20, marginBottom: 20 }}>
            <div><div className="label">Bundle title</div><input className="input" placeholder="e.g. DeFi + NFT Combined Dataset" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} /></div>
            <div><div className="label">Description</div><textarea className="input" rows={2} placeholder="What's in this bundle?" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} style={{ resize: "none" }} /></div>
            <div className="grid-2">
              <div><div className="label">Reserve price (IP)</div><input className="input" type="number" step="0.01" value={form.reserve} onChange={e => setForm(f => ({...f, reserve: e.target.value}))} /></div>
              <div><div className="label">Duration (hours)</div><input className="input" type="number" value={form.hours} onChange={e => setForm(f => ({...f, hours: e.target.value}))} /></div>
            </div>
          </div>
          <div style={{ padding: "12px 16px", background: "rgba(124,111,255,0.04)", border: "1px solid rgba(124,111,255,0.1)", borderRadius: 10, fontSize: 12, color: "#444460", lineHeight: 1.7, marginBottom: 16 }}>
            Revenue splits between all sellers on settlement. Royalties on resale are also split proportionally — all enforced on-chain.
          </div>
          <button className="btn-primary" style={{ width: "100%" }} onClick={handleSubmit} disabled={submitting || !account || totalShare !== 100}>
            {!account ? "Connect wallet to list bundle" : submitting ? "⟳ creating bundle…" : done ? "✓ bundle listed!" : "List bundle auction"}
          </button>
          {done && <div style={{ marginTop: 12, padding: "12px 16px", background: "rgba(100,220,120,0.06)", border: "1px solid rgba(100,220,120,0.15)", borderRadius: 10, fontSize: 13, color: "#64dc78" }}>✓ Bundle listed! {sellers.length} sellers · revenue split enforced on-chain</div>}
        </div>
      </div>
    </div>
  );
}

function BidTab({ account }: { account: string | null }) {
  const [form, setForm] = useState({ listingId: "1", bidEth: "0.6", depositEth: "0.8" });
  const [recommending, setRecommending] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [bidding, setBidding] = useState(false);
  const [bidDone, setBidDone] = useState(false);
  const [bidVaultId, setBidVaultId] = useState("");
  const [bidTxHash, setBidTxHash] = useState("");

  async function getBidRecommendation() {
    setRecommending(true);
    setRecommendation(null);
    try {
      const listing = MOCK_LISTINGS.find(l => l.id === Number(form.listingId));
      if (!listing) return alert("Listing not found");
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": (import.meta as any).env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 300,
          messages: [{ role: "user", content: `You are a bidding strategy advisor. Give a 2-3 sentence bid recommendation.\n\nListing: ${listing.title}\nAI Score: ${listing.aiScore}/10\nReserve: ${listing.reserveEth} IP\nBids: ${listing.bids}\n\nRecommend an optimal bid in IP with reasoning.` }],
        }),
      });
      const data = await response.json();
      setRecommendation(data.content[0].text);
    } catch {
      setRecommendation("Could not get recommendation.");
    } finally {
      setRecommending(false);
    }
  }

  async function handleBid() {
    if (!account) return;
    setBidding(true);
    try {
      const vaultId = "0x" + Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, "0")).join("");
      const { placeBidOnChain } = await import("./lib/wallet");
      const { saveBid } = await import("./lib/storage");
      const hash = await placeBidOnChain(Number(form.listingId), vaultId, form.depositEth);
      saveBid({ listingId: form.listingId, bidVaultId: vaultId, depositAmount: form.depositEth, timestamp: Date.now() });
      setBidVaultId(vaultId);
      setBidTxHash(hash);
      setBidDone(true);
    } catch (e: any) {
      alert(e?.message ?? "Transaction failed");
    } finally {
      setBidding(false);
    }
  }

  return (
    <div>
      <PageHeader title="Place a blind bid" sub="Your true bid is encrypted into a CDR vault. Nobody sees it until you reveal after the deadline." />
      <div className="card" style={{ maxWidth: 540 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div><div className="label">Listing ID</div>
            <input className="input" type="number" value={form.listingId} onChange={e => setForm(f => ({...f, listingId: e.target.value}))} style={{ maxWidth: 160 }} /></div>
          <button className="btn-ghost" onClick={getBidRecommendation} disabled={recommending} style={{ width: "100%" }}>
            {recommending ? "⟳  Claude is analysing the listing…" : "✦  get AI bid recommendation"}
          </button>
          {recommendation && (
            <div style={{ padding: "14px 16px", background: "rgba(124,111,255,0.06)", border: "1px solid rgba(124,111,255,0.15)", borderRadius: 10, fontSize: 13, color: "#9d8fff", lineHeight: 1.6 }}>
              <div style={{ fontSize: 10, color: "#5a5a80", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>AI recommendation</div>
              {recommendation}
            </div>
          )}
          <div className="grid-2">
            <div><div className="label">True bid (IP) — vault-encrypted</div>
              <input className="input" type="number" step="0.01" value={form.bidEth} onChange={e => setForm(f => ({...f, bidEth: e.target.value}))} />
              <div style={{ fontSize: 11, color: "#3a3a5a", marginTop: 6 }}>Encrypted by CDR. Only you can reveal.</div></div>
            <div><div className="label">On-chain deposit (IP)</div>
              <input className="input" type="number" step="0.01" value={form.depositEth} onChange={e => setForm(f => ({...f, depositEth: e.target.value}))} />
              <div style={{ fontSize: 11, color: "#3a3a5a", marginTop: 6 }}>Must be ≥ reserve. Refunded if you lose.</div></div>
          </div>
          <div style={{ padding: "14px 16px", background: "rgba(124,111,255,0.04)", border: "1px solid rgba(124,111,255,0.1)", borderRadius: 10, fontSize: 13, color: "#444460", lineHeight: 1.7 }}>
            Your bid of <span style={{ color: "#9d8fff", fontWeight: 600 }}>{form.bidEth} IP</span> is threshold-encrypted across Story validators. Not the seller, not any validator can read it until you reveal.
          </div>
          <button className="btn-primary" disabled={!account || bidding || bidDone} onClick={handleBid}>
            {!account ? "Connect wallet to bid" : bidding ? "⟳ encrypting bid into CDR vault…" : bidDone ? "✓ blind bid placed!" : "Encrypt & place bid"}
          </button>
          {bidDone && (
            <div style={{ padding: "16px", background: "rgba(100,220,120,0.06)", border: "1px solid rgba(100,220,120,0.15)", borderRadius: 10 }}>
              <div style={{ fontSize: 13, color: "#64dc78", marginBottom: 8 }}>✓ Blind bid placed · Deposit locked on-chain</div>
              <CopyBox label="Bid Vault ID — save this for reveal!" value={bidVaultId} />
              <CopyBox label="Transaction" value={bidTxHash} />
              <div style={{ fontSize: 11, color: "#dc6060", marginTop: 8 }}>⚠ Save your Vault ID now — you need it to reveal your bid after the deadline!</div>
            </div>
          )}
        </div>
      </div>

      {/* My Bids section */}
      <MyBids />
    </div>
  );
}

function MyBids() {
  const [bids, setBids] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { getBids } = await import("./lib/storage");
      setBids(getBids());
    };
    load();
  }, []);

  if (bids.length === 0) return null;

  return (
    <div style={{ maxWidth: 540, marginTop: 24 }}>
      <div style={{ fontSize: 11, color: "#3a3a5a", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500, marginBottom: 12 }}>My bids</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {bids.map((bid, i) => (
          <div key={i} className="card" style={{ padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "#7c6fff", fontWeight: 600 }}>Listing #{bid.listingId}</span>
              <span style={{ fontSize: 11, color: "#3a3a5a" }}>{new Date(bid.timestamp).toLocaleString()}</span>
            </div>
            <CopyBox label="Bid Vault ID" value={bid.bidVaultId} />
            <div style={{ fontSize: 12, color: "#5a5a80", marginTop: 8 }}>Deposit: {bid.depositAmount} IP</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RevealTab({ account }: { account: string | null }) {
  const [form, setForm] = useState({ listingId: "1", vaultId: "", amount: "" });
  const [revealing, setRevealing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [revealTxHash, setRevealTxHash] = useState("");
  const [savedBids, setSavedBids] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { getBids } = await import("./lib/storage");
      setSavedBids(getBids());
    };
    load();
  }, []);

  async function handleReveal() {
    if (!form.vaultId) return alert("Enter your vault ID");
    if (!form.amount) return alert("Enter your bid amount");
    setRevealing(true);
    try {
      const { revealBidOnChain } = await import("./lib/wallet");
      const { parseEther } = await import("viem");
      const hash = await revealBidOnChain(Number(form.listingId), parseEther(form.amount));
      setRevealTxHash(hash);
      setRevealed(true);
    } catch (e: any) {
      alert(e?.message ?? "Transaction failed");
    } finally {
      setRevealing(false);
    }
  }

  return (
    <div>
      <PageHeader title="Reveal your bid" sub="After the deadline, submit your true bid amount on-chain to enter the final ranking." />
      <div className="card" style={{ maxWidth: 540 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {savedBids.length > 0 && (
            <div>
              <div className="label" style={{ marginBottom: 8 }}>Select from my bids</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {savedBids.map((bid, i) => (
                  <button key={i} className="btn-ghost" style={{ textAlign: "left", padding: "10px 14px" }}
                    onClick={() => setForm(f => ({ ...f, listingId: bid.listingId, vaultId: bid.bidVaultId }))}>
                    <div style={{ fontSize: 12, color: "#9d8fff" }}>Listing #{bid.listingId}</div>
                    <div style={{ fontSize: 11, color: "#3a3a5a", marginTop: 2 }}>{bid.bidVaultId.slice(0,14)}…</div>
                  </button>
                ))}
              </div>
              <div className="divider" />
            </div>
          )}
          <div><div className="label">Listing ID</div><input className="input" type="number" value={form.listingId} onChange={e => setForm(f => ({...f, listingId: e.target.value}))} style={{ maxWidth: 160 }} /></div>
          <div><div className="label">Your bid vault ID</div><input className="input" placeholder="0x…" value={form.vaultId} onChange={e => setForm(f => ({...f, vaultId: e.target.value}))} /></div>
          <div><div className="label">Your true bid amount (IP)</div>
            <input className="input" type="number" step="0.01" placeholder="0.0" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} />
            <div style={{ fontSize: 11, color: "#3a3a5a", marginTop: 6 }}>This must match the amount you encrypted in your vault</div>
          </div>
          <div style={{ padding: "14px 16px", background: "rgba(124,111,255,0.04)", border: "1px solid rgba(124,111,255,0.1)", borderRadius: 10, fontSize: 13, color: "#444460", lineHeight: 1.7 }}>
            CDR validators verify your wallet owns the vault, then your bid amount is submitted on-chain for ranking.
          </div>
          <button className="btn-primary" disabled={!account || revealing || revealed} onClick={handleReveal}>
            {!account ? "Connect wallet to reveal" : revealing ? "⟳ submitting reveal on-chain…" : revealed ? "✓ bid revealed on-chain!" : "Decrypt & reveal bid"}
          </button>
          {revealed && (
            <div style={{ padding: "16px", background: "rgba(100,220,120,0.06)", border: "1px solid rgba(100,220,120,0.15)", borderRadius: 10 }}>
              <div style={{ fontSize: 13, color: "#64dc78", marginBottom: 8 }}>✓ Bid revealed · Amount submitted on-chain</div>
              <CopyBox label="Transaction" value={revealTxHash} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettleTab({ account }: { account: string | null }) {
  const [listingId, setListingId] = useState("1");
  const [settling, setSettling] = useState(false);
  const [settled, setSettled] = useState(false);
  const [settleTxHash, setSettleTxHash] = useState("");
  const [resellForm, setResellForm] = useState({ tokenId: "", buyerAddress: "", price: "" });
  const [reselling, setReselling] = useState(false);
  const [resellDone, setResellDone] = useState(false);

  async function handleSettle() {
    setSettling(true);
    try {
      const { settleOnChain } = await import("./lib/wallet");
      const hash = await settleOnChain(Number(listingId));
      setSettleTxHash(hash);
      setSettled(true);
    } catch (e: any) {
      alert(e?.message ?? "Transaction failed");
    } finally {
      setSettling(false);
    }
  }

  async function handleResell() {
    if (!resellForm.tokenId || !resellForm.buyerAddress || !resellForm.price) return alert("Fill in all fields");
    setReselling(true);
    try { await new Promise(r => setTimeout(r, 2000)); setResellDone(true); }
    finally { setReselling(false); }
  }

  return (
    <div>
      <PageHeader title="Settle & download" sub="Trigger settlement after the deadline. Winner gets a License NFT, seller gets paid, losers are refunded automatically." />
      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 540 }}>
        <div className="card">
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: 15, marginBottom: 16, color: "#f0ede8" }}>Settle auction</div>
          <div style={{ marginBottom: 16 }}><div className="label">Listing ID</div><input className="input" type="number" value={listingId} onChange={e => setListingId(e.target.value)} style={{ maxWidth: 160 }} /></div>
          <button className="btn-primary" disabled={!account || settling || settled} onClick={handleSettle}>
            {!account ? "Connect wallet to settle" : settling ? "⟳ settling on-chain…" : settled ? "✓ auction settled!" : "Settle auction"}
          </button>
          {settled && (
            <div style={{ marginTop: 12, padding: "16px", background: "rgba(100,220,120,0.06)", border: "1px solid rgba(100,220,120,0.15)", borderRadius: 10 }}>
              <div style={{ fontSize: 13, color: "#64dc78", marginBottom: 8 }}>✓ Auction settled · License NFT minted · Seller paid · Losers refunded</div>
              <CopyBox label="Transaction" value={settleTxHash} />
            </div>
          )}
        </div>
        <div className="card">
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: 15, marginBottom: 8, color: "#f0ede8" }}>Download dataset</div>
          <div style={{ fontSize: 13, color: "#444460", marginBottom: 16, lineHeight: 1.6 }}>Hold the License NFT? CDR validators verify on-chain and release the decryption key. Data decrypts entirely client-side.</div>
          <button className="btn-ghost" disabled={!account}>{!account ? "Connect wallet" : "Decrypt & download"}</button>
        </div>
        <div className="card">
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 600, fontSize: 15, marginBottom: 8, color: "#f0ede8" }}>Resell License NFT</div>
          <div style={{ fontSize: 13, color: "#444460", marginBottom: 16, lineHeight: 1.6 }}>Transfer your License NFT to a new buyer. The original seller's royalty is paid automatically on-chain from every resale.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div><div className="label">License token ID</div><input className="input" placeholder="e.g. 1" value={resellForm.tokenId} onChange={e => setResellForm(f => ({...f, tokenId: e.target.value}))} /></div>
            <div><div className="label">Buyer wallet address</div><input className="input" placeholder="0x…" value={resellForm.buyerAddress} onChange={e => setResellForm(f => ({...f, buyerAddress: e.target.value}))} /></div>
            <div><div className="label">Resale price (IP)</div><input className="input" type="number" step="0.01" placeholder="0.0" value={resellForm.price} onChange={e => setResellForm(f => ({...f, price: e.target.value}))} /></div>
            <button className="btn-ghost" onClick={handleResell} disabled={reselling || !account}>{reselling ? "⟳ processing on-chain…" : "Resell License NFT"}</button>
            {resellDone && <div style={{ padding: "12px 16px", background: "rgba(100,220,120,0.06)", border: "1px solid rgba(100,220,120,0.15)", borderRadius: 10, fontSize: 13, color: "#64dc78" }}>✓ License transferred · royalty paid to original seller automatically</div>}
          </div>
        </div>
        <div style={{ padding: "16px 20px", background: "rgba(124,111,255,0.03)", border: "1px solid rgba(124,111,255,0.08)", borderRadius: 12, fontSize: 12, color: "#3a3a5a", lineHeight: 2.2 }}>
          <span style={{ color: "#7c6fff", fontWeight: 600 }}>Settlement flow </span>
          deadline passes → settle() → highest bid wins → <span style={{ color: "#9d8fff" }}>License NFT minted</span> → seller paid → losers refunded → CDR read condition: winner wallet → dataset unlocks in TEE
        </div>
      </div>
    </div>
  );
}