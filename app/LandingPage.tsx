"use client";

import { useState } from "react";
import Link from "next/link";
import "./landing.css";

const STAGES: { key: string; label: string; desc: string }[] = [
  { key: "DISCOVER", label: "DISCOVER", desc: "Opportunity enters the system." },
  { key: "RESEARCH", label: "RESEARCH", desc: "Evidence is gathered." },
  { key: "PAIN", label: "PAIN", desc: "Problem evidence is tested." },
  { key: "BUYER", label: "BUYER", desc: "Buyer identity is established." },
  { key: "WTP", label: "WTP", desc: "Willingness to pay is examined." },
  { key: "WHITESPACE", label: "WHITESPACE", desc: "Competitive space is assessed." },
  { key: "GTM", label: "GTM", desc: "Route to market is evaluated." },
  { key: "PRE_SALE", label: "PRE-SALE", desc: "Commitment evidence is collected." },
  { key: "BUILD", label: "BUILD", desc: "Only after authorization." },
  { key: "LAUNCH", label: "LAUNCH", desc: "Validated product ships." },
  { key: "REVENUE", label: "REVENUE", desc: "Commercial outcome is tracked." },
  { key: "EXIT", label: "EXIT", desc: "Lifecycle reaches terminal state." },
];

const LIFECYCLE = [
  { label: "DISCOVER", note: "Opportunity intake" },
  { label: "RESEARCH", note: "Evidence gathering" },
  { label: "PAIN", note: "Problem validation" },
  { label: "BUYER", note: "Buyer validation" },
  { label: "WTP", note: "Commercial willingness" },
  { label: "WHITESPACE", note: "Market space" },
  { label: "GTM", note: "Route to market" },
  { label: "PRE-SALE", note: "Commitment evidence", active: true },
  { label: "BUILD", note: "Authorized execution" },
  { label: "LAUNCH", note: "Market release" },
  { label: "REVENUE", note: "Commercial outcome" },
  { label: "EXIT", note: "Terminal lifecycle" },
];

export default function LandingPage() {
  const [activeStage, setActiveStage] = useState("DISCOVER");
  const [displayStage, setDisplayStage] = useState("DISCOVER");
  const [menuOpen, setMenuOpen] = useState(false);
  const [failed, setFailed] = useState(false);

  const stageDesc = STAGES.find((s) => s.key === displayStage)?.desc ?? "";

  return (
    <div className="landing-root">
      <header>
        <nav className="wrap" aria-label="Primary">
          <a className="brand" href="#top" aria-label="Neuracode home">
            <span className="brand-mark">
              <span>N</span>
            </span>
            <span>
              NEURACODE
              <small>PRODUCT DECISION ENGINE</small>
            </span>
          </a>
          <div className="navlinks">
            <a href="#how">How it works</a>
            <a href="#lifecycle">Lifecycle</a>
            <a href="#architecture">Architecture</a>
            <Link className="platform" href="/login">
              Open Platform →
            </Link>
          </div>
          <button
            className="menu"
            aria-expanded={menuOpen}
            aria-controls="mobileMenu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            Menu
          </button>
        </nav>
        <div id="mobileMenu" className={`mobile-menu${menuOpen ? " open" : ""}`}>
          <a href="#how" onClick={() => setMenuOpen(false)}>
            How it works
          </a>
          <a href="#lifecycle" onClick={() => setMenuOpen(false)}>
            Lifecycle
          </a>
          <a href="#architecture" onClick={() => setMenuOpen(false)}>
            Architecture
          </a>
          <Link href="/login" onClick={() => setMenuOpen(false)}>
            Open Platform →
          </Link>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="wrap">
            <div className="eyebrow">Decision infrastructure / evidence-first</div>
            <h1>
              NO VALIDATION.
              <br />
              <span>NO BUILD.</span>
            </h1>
            <p className="hero-copy">
              Neuracode is the Product Decision Engine between product conviction and execution.
              An opportunity reaches BUILD only when evidence is real, validation has passed,
              commitments are verified, and the required authority permits the transition.
            </p>
            <div className="actions">
              <a className="btn primary" href="#gate">
                See how the gate works ↓
              </a>
              <a className="btn secondary" href="#architecture">
                Read the architecture →
              </a>
            </div>
          </div>
        </section>

        <section id="how">
          <div className="wrap">
            <div className="section-head">
              <div>
                <div className="eyebrow">01 / Lifecycle pipeline</div>
                <h2>One enforced path.</h2>
              </div>
              <p>
                The repository defines twelve lifecycle stages. BUILD is a controlled transition,
                not a client-editable checkbox.
              </p>
            </div>
            <div className="pipeline" role="list" aria-label="Opportunity lifecycle">
              {STAGES.map((s) => (
                <button
                  key={s.key}
                  className={`stage${activeStage === s.key ? " active" : ""}`}
                  onMouseEnter={() => setDisplayStage(s.key)}
                  onFocus={() => setDisplayStage(s.key)}
                  onClick={() => {
                    setActiveStage(s.key);
                    setDisplayStage(s.key);
                  }}
                >
                  <strong>{s.label}</strong>
                  <small>{s.desc}</small>
                </button>
              ))}
            </div>
            <div className="context" aria-live="polite">
              {displayStage} — {stageDesc}
            </div>
          </div>
        </section>

        <section>
          <div className="wrap">
            <div className="quote">
              <div className="eyebrow">02 / Operating philosophy</div>
              <blockquote>
                Conviction is not evidence.
                <br />
                <span>Interest is not commitment.</span>
              </blockquote>
              <p className="note">
                <strong>The client can request BUILD.</strong> The client cannot decide BUILD. The
                decision path evaluates the evidence and authorization conditions before the
                lifecycle transition is permitted.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="wrap">
            <div className="section-head">
              <div>
                <div className="eyebrow">03 / Decision instruments</div>
                <h2>Proof, not paperwork.</h2>
              </div>
              <p>Three mechanisms turn a product opinion into an auditable decision state.</p>
            </div>
            <div className="instruments">
              <article className="card">
                <span className="num">01</span>
                <h3>Product-Buyer Validation</h3>
                <p>
                  Weighted validation dimensions produce a structured PBV score from normalized
                  evidence.
                </p>
                <div className="tiny mono">EVIDENCE → SCORE → PBV</div>
              </article>
              <article className="card">
                <span className="num">02</span>
                <h3>Canonical Gates</h3>
                <p>
                  Required gates are evaluated by the authoritative decision layer rather than
                  manufactured by the interface.
                </p>
                <div className="tiny mono">OPEN → PASSED / FAILED</div>
              </article>
              <article className="card">
                <span className="num">03</span>
                <h3>Verified Commitments</h3>
                <p>
                  Commitment types are tracked with verification state. Qualifying verified
                  commitments contribute to BUILD authorization.
                </p>
                <div className="tiny mono">VERIFY → QUALIFY → AUTHORIZE</div>
              </article>
            </div>
          </div>
        </section>

        <section id="gate">
          <div className="wrap">
            <div className="section-head">
              <div>
                <div className="eyebrow">04 / Decision gate</div>
                <h2>BUILD is earned.</h2>
              </div>
              <p>
                Interactive demonstration of the decision path. The values below are illustrative
                and never represent customer data.
              </p>
            </div>
            <div className="gate-layout">
              <div className="gate">
                <div className="gate-title">
                  <div>
                    <div className="eyebrow">Illustrative decision state</div>
                    <h3>◈ GATE</h3>
                  </div>
                  <div className="lock" aria-label="Controlled gate">
                    ⌕
                  </div>
                </div>
                <div className="checks">
                  <div className="check">
                    <span>CURRENT STATE</span>
                    <b>PRE-SALE</b>
                  </div>
                  <div className="check">
                    <span>PBV_SCORE</span>
                    <b>87 / 100 — PASS</b>
                  </div>
                  <div className="check">
                    <span>GATES_SATISFIED</span>
                    <b className={failed ? "fail" : "pass"}>{failed ? "FAIL" : "PASS"}</b>
                  </div>
                  <div className="check">
                    <span>COMMITMENTS_OK</span>
                    <b className="pass">PASS</b>
                  </div>
                  <div className="check">
                    <span>ROLE_AUTHORIZED</span>
                    <b className="pass">PASS</b>
                  </div>
                </div>
                <div className="decision mono">
                  transition_opportunity() → {failed ? "BUILD_BLOCKED" : "BUILD_AUTHORIZED"}
                </div>
                <button className="toggle" disabled={failed} aria-disabled={failed} onClick={() => setFailed(true)}>
                  {failed ? "Failed condition simulated" : "Simulate a failed condition"}
                </button>
              </div>
              <aside className="failure">
                <div className="eyebrow">Failure path</div>
                <div className={`blocked mono${failed ? " fail" : ""}`}>
                  {failed ? "REQUIRED GATE FAILED" : "ANY REQUIRED CONDITION FAILS"}
                </div>
                <p className="muted">
                  {failed
                    ? "A required condition is not satisfied. The transition remains blocked until the authoritative conditions pass."
                    : "The transition is blocked whenever any required condition fails. The UI cannot override the authoritative decision."}
                </p>
                <button className="toggle" onClick={() => setFailed(false)}>
                  Restore passing state
                </button>
              </aside>
            </div>
          </div>
        </section>

        <section id="lifecycle">
          <div className="wrap">
            <div className="section-head">
              <div>
                <div className="eyebrow">05 / Lifecycle</div>
                <h2>Ordered by design.</h2>
              </div>
              <p>The lifecycle mirrors the authoritative opportunity-stage vocabulary.</p>
            </div>
            <div className="lifecycle">
              {LIFECYCLE.map((l) => (
                <div key={l.label} className={`life${l.active ? " active" : ""}`}>
                  <strong>{l.label}</strong>
                  <span>{l.note}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="architecture">
          <div className="wrap">
            <div className="section-head">
              <div>
                <div className="eyebrow">06 / Architecture</div>
                <h2>
                  The UI advises.
                  <br />
                  The decision layer decides.
                </h2>
              </div>
              <p>
                Critical lifecycle decisions belong to the authoritative path, not to client-side
                state.
              </p>
            </div>
            <div className="flow">
              <div className="flow-row">
                <span className="node">USER</span>
                <span className="arrow">→</span>
                <span className="node">UI</span>
                <span className="arrow">→</span>
                <span className="node">API / ADVISORY</span>
                <span className="arrow">→</span>
                <span className="node authoritative">AUTHORITATIVE DECISION LAYER</span>
              </div>
              <div className="flow-row" style={{ marginTop: 12 }}>
                <span className="node">RECOMPUTE</span>
                <span className="arrow">→</span>
                <span className="node">VALIDATE</span>
                <span className="arrow">→</span>
                <span className="node">AUTHORIZE</span>
                <span className="arrow">→</span>
                <span className="node authoritative">POSTGRESQL</span>
                <span className="arrow">→</span>
                <span className="node">EVIDENCE / GATES / AUDIT</span>
              </div>
            </div>
            <div className="security">
              <div className="card">
                <span className="num">TRUST / 01</span>
                <h3>RLS</h3>
                <p>Database access controls constrain sensitive data paths.</p>
              </div>
              <div className="card">
                <span className="num">TRUST / 02</span>
                <h3>Authorization</h3>
                <p>Controlled actions are role-gated rather than assumed from UI state.</p>
              </div>
              <div className="card">
                <span className="num">TRUST / 03</span>
                <h3>Transactional</h3>
                <p>Lifecycle transitions evaluate decision conditions through the authoritative path.</p>
              </div>
              <div className="card">
                <span className="num">TRUST / 04</span>
                <h3>Audit</h3>
                <p>Transition history is preserved through the decision ledger.</p>
              </div>
            </div>
            <div className="evidence">
              <div>
                <b>01 / CLAIM</b>
                <span className="muted">What is asserted?</span>
              </div>
              <div>
                <b>02 / EVIDENCE</b>
                <span className="muted">What supports it?</span>
              </div>
              <div>
                <b>03 / VERIFICATION</b>
                <span className="muted">Has it been checked?</span>
              </div>
              <div>
                <b>04 / DECISION</b>
                <span className="muted">What can the system authorize?</span>
              </div>
            </div>
          </div>
        </section>

        <section className="cta">
          <div className="wrap">
            <div className="eyebrow">07 / Final decision</div>
            <h2>STOP SHIPPING ON CONVICTION ALONE.</h2>
            <p>
              Turn product validation into an enforced decision process. Evidence first. Gates
              second. Authorization before BUILD.
            </p>
            <div className="actions" style={{ justifyContent: "center" }}>
              <Link className="btn primary" href="/login">
                Enter the Platform →
              </Link>
              <a className="btn secondary" href="#top">
                Back to top ↑
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <span>© {new Date().getFullYear()} Neuracode</span>
          <span>Product Decision Engine · No validation. No build.</span>
        </div>
      </footer>
    </div>
  );
}
