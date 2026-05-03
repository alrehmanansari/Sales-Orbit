import React, { useState } from 'react'

const STEPS = [
  {
    step: 1, title: 'Opening & Greeting', target: '30 sec',
    en: '"Assalamu Alaikum, may I please speak with Muhammad Ali Sahib? Good [morning/afternoon], Muhammad Ali Sahib. My name is Abdul Rehman, and I am calling from SUNRATE. I hope you are doing well today."',
    ur: '"Assalamo Alaikum, kya me Muhammad Ali Sahib se baat kar sakta hu? Janab, me Abdul Rehman bol raha hu SUNRATE se. Umeed hai ap bilkul theek hain aur sab kheriyat se hai?"',
    tip: 'Pause here. Let them respond. Show genuine interest in their reply. Do not rush into the pitch. A warm opening builds trust in the first 30 seconds.',
  },
  {
    step: 2, title: 'Reason for Calling (Hook)', target: '45 sec',
    en: '"Muhammad Ali Sahib, I was reviewing your company\'s website — Softic Solutions — and I noticed that you are actively serving international clients. The reason for my call today is to understand the challenges you may be facing in receiving international payments, and to share how SUNRATE can offer you a significantly better solution."',
    ur: '"Muhammad Ali Sahib, me ap ki company Softic Solutions ki website dekh raha tha aur mujhe notice hua ke ap international clients ko serve kar rahe hain. Aaj call karne ka maqsad ye tha ke me apke saath international payments receive karne ke hawale se jo bhi challenges hain unhe samjhu, aur ap ko ek behtar solution present karu."',
    tip: 'Always personalise the hook — mention their website, their industry, or something specific you observed. Generic openers get rejected. Specific openers earn curiosity.',
  },
  {
    step: 3, title: 'SUNRATE Introduction', target: '60 sec',
    en: '"Before I proceed, allow me to give you a brief overview of SUNRATE. SUNRATE is a global payment platform founded in 2016, empowering businesses to scale worldwide with smarter, faster, and secure cross-border solutions. We offer multi-currency accounts in 16 major and 5 minor currencies, with support for 130+ currencies across 190+ countries. Headquartered in Singapore, with offices across Asia and Europe, we partner with Citibank, Barclays, J.P. Morgan, and Standard Chartered. We are also a principal member of Mastercard, Visa, and UnionPay."',
    ur: '"Aagay badhne se pehle, me SUNRATE ke baare mein mukhtasar baat karta hu. SUNRATE ek global payment platform hai jo 2016 mein qayam hua. Hamare paas 16 major aur 5 minor currencies mein multi-currency accounts hain, aur 190+ countries mein 130+ currencies ka support hai. Hamara headquarters Singapore mein hai. Hum Citibank, Barclays, J.P. Morgan aur Standard Chartered ke saath partner hain, aur Mastercard, Visa aur UnionPay ke principal member bhi hain."',
    tip: 'Keep this under 60 seconds. You are establishing credibility — not selling yet. The bank partnerships and Mastercard/Visa membership are powerful trust signals. Deliver them with confidence.',
  },
  {
    step: 4, title: 'Discovery — Listen to the Client', target: '3–5 min',
    en: '"Muhammad Ali Sahib, before I go any further, I would love to understand your current setup better. Could you help me with a few quick questions?"',
    ur: '"Muhammad Ali Sahib, aagay badhne se pehle me chahta hu ke aap ka current setup samjhu. Kya ap mere saath kuch quick questions discuss kar sakte hain?"',
    tip: 'Listen more than you speak. Take notes. Every pain point the client mentions is a door you can open with SUNRATE\'s solution. Never interrupt — let them finish completely.',
    questions: [
      { en: 'How are your international clients currently paying you?', ur: 'Aap ke international clients aap ko abhi kaise payment karte hain?' },
      { en: 'Which platforms or channels are you using to collect funds?', ur: 'Funds collect karne ke liye ap kaunse platforms ya channels use kar rahe hain?' },
      { en: 'Are you facing any delays, high conversion losses, or fee-related issues?', ur: 'Kya ap ko koi delays, high fees, ya conversion losses ka saamna hai?' },
      { en: 'Do you or your team use any virtual cards for online business spending?', ur: 'Kya ap ya apki team online business spend ke liye koi virtual cards use karti hai?' },
      { en: 'How do you currently move funds into your Pakistani bank accounts?', ur: 'Aap abhi apne Pakistan ke bank accounts mein funds kaise transfer karte hain?' },
    ],
  },
  {
    step: 5, title: 'Present the Solution', target: '3–4 min',
    en: '"Thank you for sharing that, Muhammad Ali Sahib. Based on what you have described, I believe SUNRATE can address these challenges very effectively. Let me walk you through what we can specifically offer you:"',
    ur: '"Shukriya Muhammad Ali Sahib, apne jo share kiya wo bohat useful tha. Jo ap ne describe kiya hai uske basis par mujhe yakeen hai ke SUNRATE aapke liye in challenges ko effectively solve kar sakta hai. Me aap ko specifically batata hu ke hum kya offer kar sakte hain:"',
    tip: 'Match each pillar to a specific pain point the client mentioned in Step 4. Never present all four blindly — lead with what matters most to them.',
    pillars: [
      { n: '①', title: 'Multi-Currency Collection Account', en: 'With SUNRATE, you receive a dedicated multi-currency collection account — enabling your international clients to pay you directly in USD, EUR, GBP, and 130+ other currencies across 190+ countries. No delays, no middlemen, no unnecessary conversions.', ur: 'SUNRATE ke saath aap ko ek dedicated multi-currency collection account milta hai — jisme aap ke international clients seedha USD, EUR, GBP aur 130+ currencies mein payment kar sakte hain, 190+ countries se.' },
      { n: '②', title: 'Virtual Cards', en: 'We also provide virtual cards that you and your team can use for all online business expenditure — software subscriptions, digital advertising, vendor payments, or any other global online spending.', ur: 'Hum virtual cards bhi provide karte hain jo aap aur aap ki team online business spend ke liye use kar sakte hain — software subscriptions, digital advertising, vendor payments ya koi bhi aur online business expenditure.' },
      { n: '③', title: 'Payout to Pakistani Local Banks', en: 'Once your funds are collected, you can payout directly into your Pakistani local bank account — quickly, transparently, and at highly competitive exchange rates.', ur: 'Jab aap ke funds collect ho jayen, aap directly apne Pakistani local bank account mein payout le sakte hain — tezi se, transparently, aur bohat competitive exchange rates par.' },
      { n: '④', title: 'Local Team & Dedicated Support', en: 'We have a dedicated local team present in Pakistan to support you at every stage — from onboarding and account setup through to day-to-day transactions and beyond.', ur: 'Hamare paas Pakistan mein ek dedicated local team hai jo har qadam par aap ki madad karegi — onboarding aur account setup se le kar rozana ke transactions tak aur uske baad bhi.' },
    ],
  },
  {
    step: 6, title: 'Handle Pricing Objection', target: '1–2 min',
    en: '"Muhammad Ali Sahib, I completely understand that pricing is an important consideration. If it would be helpful, I am happy to walk you through a direct comparison between your current costs and what SUNRATE offers — so you can evaluate the difference clearly for yourself."',
    ur: '"Muhammad Ali Sahib, me bilkul samajhta hu ke pricing ek important factor hai. Agar aap chahen, me aap ko apne current costs aur SUNRATE ki fees ka direct comparison dikhata hu — taake aap khud clearly farq dekh sakein aur apna decision le sakein."',
    tip: 'Never discount without comparing first. Let the numbers speak. If their current platform is charging 3–5% and SUNRATE is more competitive, that saving becomes your strongest closing argument.',
  },
  {
    step: 7, title: 'The Close — Sign Up & Test Payment', target: '1–2 min',
    en: '"Muhammad Ali Sahib, the best part is that there are absolutely no signup charges — registration is completely free. Allow me to share the signup link with you right now. Complete the registration at your convenience and simply process one test payment to experience the full end-to-end journey. There is no commitment required — just try it and see the difference firsthand."',
    ur: '"Muhammad Ali Sahib, sab se acha hissa ye hai ke signup ka bilkul koi charge nahi — registration poori tarah free hai. Me abhi aap ko signup link share karta hu. Apni suvidha mein registration complete karein aur sirf ek test payment karein. Koi commitment nahi chahiye — bas try karein aur khud farq mehsoos karein."',
    tip: '"Free" and "no commitment" remove the two biggest barriers to action. Your goal is one micro-commitment — the signup. Not the full sale. Get the link opened.',
  },
  {
    step: 8, title: 'Share Signup Link & Confirm Next Steps', target: '30 sec',
    en: '"I am sharing the signup link with you right now on WhatsApp / email. Once you have registered, our local team will reach out within 24 hours to assist you with the account setup and your first test transaction. Does that work for you, Muhammad Ali Sahib?"',
    ur: '"Me abhi aap ko signup link WhatsApp / email par share kar raha hu. Jaise hi aap register ho jayen, hamari local team 24 ghante ke andar aap se rabta karegi. Kya ye aap ke liye theek hai, Muhammad Ali Sahib?"',
  },
  {
    step: 9, title: 'Closing & Thank You', target: '30 sec',
    en: '"Thank you so much for your time today, Muhammad Ali Sahib. It was a genuine pleasure speaking with you. I look forward to supporting Softic Solutions on this journey. Please do not hesitate to reach out to me directly at any time — I am always available."',
    ur: '"Bohat shukriya Muhammad Ali Sahib, aap ne apna qeemti waqt diya. Aap se baat kar ke bohat acha laga. Kisi bhi waqt seedha mujhse rabta karein — me hamesha haazir hu."',
  },
]

const QUICK_REF = [
  { stage: 'Opening',      goal: 'Build rapport',             time: '30 sec'       },
  { stage: 'Hook',         goal: 'Earn curiosity',            time: '45 sec'       },
  { stage: 'Introduction', goal: 'Establish credibility',     time: '60 sec'       },
  { stage: 'Discovery',    goal: 'Identify pain points',      time: '3–5 min'      },
  { stage: 'Solution',     goal: 'Match pain to product',     time: '3–4 min'      },
  { stage: 'Pricing',      goal: 'Neutralise objection',      time: '1–2 min'      },
  { stage: 'Close',        goal: 'Secure signup commitment',  time: '1–2 min'      },
  { stage: 'Next Steps',   goal: 'Confirm follow-up action',  time: '30 sec'       },
  { stage: 'Total',        goal: '',                          time: '~12–15 min', bold: true },
]

function LangTab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
      fontFamily: 'var(--font)', fontSize: 12, fontWeight: active ? 600 : 400,
      background: active ? 'var(--bg-card)' : 'transparent',
      color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
      boxShadow: active ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
      transition: 'all 0.15s',
    }}>{label}</button>
  )
}

export default function SalesCallScript({ onClose }) {
  const [lang, setLang] = useState('Both')
  const [open, setOpen] = useState(() => STEPS.reduce((a, s) => ({ ...a, [s.step]: true }), {}))
  const toggle = step => setOpen(p => ({ ...p, [step]: !p[step] }))
  const allOpen = Object.values(open).every(Boolean)
  const toggleAll = () => setOpen(STEPS.reduce((a, s) => ({ ...a, [s.step]: !allOpen }), {}))

  const showEN = lang === 'English' || lang === 'Both'
  const showUR = lang === 'Urdu'    || lang === 'Both'

  return (
    <div className="modal-overlay" style={{ zIndex: 1300 }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ maxWidth: 860, width: '100%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>

        {/* ── Modal header ──────────────────────────────────────────── */}
        <div className="modal-header" style={{
          background: 'linear-gradient(135deg,rgba(71,150,227,0.07),rgba(145,119,199,0.07))',
          flexShrink: 0, gap: 12, justifyContent: 'flex-start',
        }}>
          {/* Title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase', background: 'var(--so-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 3 }}>
              SUNRATE · BD Sales Guide
            </div>
            <h3 style={{ margin: 0 }}>Sales Call Script &nbsp;·&nbsp; 9 Steps · ~12–15 min</h3>
          </div>

          {/* Controls — language switcher + collapse toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 2, background: 'var(--bg-tertiary)', borderRadius: 22, padding: 3, border: '1px solid var(--border-color)' }}>
              {['English','Urdu','Both'].map(l => (
                <LangTab key={l} label={l} active={lang === l} onClick={() => setLang(l)} />
              ))}
            </div>

            <button onClick={toggleAll} style={{
              padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border-color)',
              background: 'var(--bg-card)', color: 'var(--text-secondary)',
              fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--so-blue)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              {allOpen ? 'Collapse All' : 'Expand All'}
            </button>
          </div>

          {/* Close — separate, always at far right */}
          <button className="btn-icon" onClick={onClose} style={{ fontSize: 16, flexShrink: 0 }}>✕</button>
        </div>

        {/* ── Scrollable body ────────────────────────────────────────── */}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {STEPS.map(s => (
            <div key={s.step} style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-card)', boxShadow: 'var(--shadow-xs)' }}>

              {/* Step header */}
              <div
                onClick={() => toggle(s.step)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 16px', cursor: 'pointer', userSelect: 'none',
                  background: open[s.step]
                    ? 'linear-gradient(90deg, rgba(71,150,227,0.07), transparent)'
                    : 'transparent',
                  borderBottom: open[s.step] ? '1px solid var(--border-color)' : 'none',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: 'var(--so-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', boxShadow: '0 2px 8px rgba(71,150,227,0.3)' }}>
                    {s.step}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{s.title}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1 }}>Step {s.step} of {STEPS.length}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {s.target && (
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--so-blue)', background: 'var(--so-blue-soft)', padding: '2px 9px', borderRadius: 20 }}>
                      ⏱ {s.target}
                    </span>
                  )}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transition: 'transform 0.2s', transform: open[s.step] ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>

              {/* Step body */}
              {open[s.step] && (
                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Script blocks */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {showEN && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--so-blue)', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 3, height: 13, borderRadius: 2, background: 'var(--so-blue)', display: 'inline-block' }} />
                          English Script
                        </div>
                        <div style={{ borderLeft: '3px solid var(--so-blue)', background: 'rgba(71,150,227,0.04)', borderRadius: '0 9px 9px 0', padding: '12px 16px', fontSize: 13, lineHeight: 1.85, color: 'var(--text-primary)' }}>
                          {s.en}
                        </div>
                      </div>
                    )}
                    {showUR && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--so-purple)', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 3, height: 13, borderRadius: 2, background: 'var(--so-purple)', display: 'inline-block' }} />
                          Urdu Script
                        </div>
                        <div style={{ borderLeft: '3px solid var(--so-purple)', background: 'rgba(145,119,199,0.04)', borderRadius: '0 9px 9px 0', padding: '12px 16px', fontSize: 13, lineHeight: 1.85, color: 'var(--text-primary)' }}>
                          {s.ur}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Discovery questions */}
                  {s.questions && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)', marginBottom: 8 }}>Discovery Questions</div>
                      <div style={{ border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden' }}>
                        {s.questions.map((q, i) => (
                          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 14px', borderTop: i > 0 ? '1px solid var(--border-color)' : 'none', background: i % 2 === 0 ? 'transparent' : 'var(--bg-tertiary)' }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: 'var(--so-blue-soft)', color: 'var(--so-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, marginTop: 1 }}>{i + 1}</div>
                            <div style={{ flex: 1 }}>
                              {showEN && <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: showUR ? 4 : 0 }}>{q.en}</div>}
                              {showUR && <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, ...(showEN ? { paddingTop: 4, borderTop: '0.5px dashed var(--border-color)' } : {}) }}>{q.ur}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Solution pillars */}
                  {s.pillars && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)', marginBottom: 8 }}>Solution Pillars</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {s.pillars.map((p, i) => (
                          <div key={i} style={{ border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'linear-gradient(90deg,rgba(71,150,227,0.06),transparent)', borderBottom: '1px solid var(--border-color)' }}>
                              <span style={{ fontSize: 16, fontWeight: 800, background: 'var(--so-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', flexShrink: 0 }}>{p.n}</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{p.title}</span>
                            </div>
                            <div style={{ padding: '11px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {showEN && <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.75 }}>{p.en}</div>}
                              {showUR && <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.75, ...(showEN ? { paddingTop: 8, borderTop: '0.5px dashed var(--border-color)' } : {}) }}>{p.ur}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* BD Coach Tip */}
                  {s.tip && (
                    <div style={{ background: 'rgba(227,116,0,0.06)', border: '1px solid rgba(227,116,0,0.25)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1 }}>💡</span>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#E37400', marginBottom: 5 }}>BD Coach Tip</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{s.tip}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Quick Reference */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ padding: '11px 16px', background: 'linear-gradient(90deg,rgba(71,150,227,0.07),rgba(202,102,115,0.05))', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 15 }}>📋</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Quick Reference Card</span>
            </div>
            <table className="data-table">
              <thead><tr><th>Stage</th><th>Goal</th><th>Target Time</th></tr></thead>
              <tbody>
                {QUICK_REF.map(r => (
                  <tr key={r.stage} style={r.bold ? { background: 'var(--so-blue-soft)' } : {}}>
                    <td style={{ fontWeight: r.bold ? 800 : 600, color: r.bold ? 'var(--so-blue)' : 'var(--text-primary)', fontSize: r.bold ? 13 : 12 }}>{r.stage}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{r.goal}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: r.bold ? 800 : 600, color: r.bold ? 'var(--so-blue)' : 'var(--text-primary)', fontSize: r.bold ? 13 : 12 }}>{r.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Golden Rule */}
          <div style={{ background: 'linear-gradient(135deg,rgba(71,150,227,0.08),rgba(145,119,199,0.08))', border: '1px solid rgba(71,150,227,0.2)', borderRadius: 12, padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>🏆</span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px', background: 'var(--so-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 7 }}>
                Golden Rule for BDs
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.85 }}>
                The client who talks the most in a sales call is the one most likely to convert. Your job is to ask smart questions, listen carefully, and present SUNRATE as the natural answer to the pain the client described in their own words.
              </div>
            </div>
          </div>

        </div>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <div className="modal-footer" style={{ flexShrink: 0 }}>
          <button className="btn btn-primary btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
