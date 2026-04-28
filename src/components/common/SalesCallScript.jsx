import React from 'react'

const STEPS = [
  {
    step: 1,
    title: 'Opening & Greeting',
    en: '"Assalamu Alaikum, may I please speak with Muhammad Ali Sahib? Good [morning/afternoon], Muhammad Ali Sahib. My name is Abdul Rehman, and I am calling from SUNRATE. I hope you are doing well today."',
    ur: '"Assalamo Alaikum, kya me Muhammad Ali Sahib se baat kar sakta hu? Janab, me Abdul Rehman bol raha hu SUNRATE se. Umeed hai ap bilkul theek hain aur sab kheriyat se hai?"',
    tip: 'Pause here. Let them respond. Show genuine interest in their reply. Do not rush into the pitch. A warm opening builds trust in the first 30 seconds.',
    target: '30 sec',
  },
  {
    step: 2,
    title: 'Reason for Calling (Hook)',
    en: '"Muhammad Ali Sahib, I was reviewing your company\'s website — Softic Solutions — and I noticed that you are actively serving international clients. The reason for my call today is to understand the challenges you may be facing in receiving international payments, and to share how SUNRATE can offer you a significantly better solution."',
    ur: '"Muhammad Ali Sahib, me ap ki company Softic Solutions ki website dekh raha tha aur mujhe notice hua ke ap international clients ko serve kar rahe hain. Aaj call karne ka maqsad ye tha ke me apke saath international payments receive karne ke hawale se jo bhi challenges hain unhe samjhu, aur ap ko ek behtar solution present karu."',
    tip: 'Always personalise the hook — mention their website, their industry, or something specific you observed. Generic openers get rejected. Specific openers earn curiosity.',
    target: '45 sec',
  },
  {
    step: 3,
    title: 'SUNRATE Introduction',
    en: '"Before I proceed, allow me to give you a brief overview of SUNRATE. SUNRATE is a global payment platform founded in 2016, empowering businesses to scale worldwide with smarter, faster, and secure cross-border solutions. We offer multi-currency accounts in 16 major and 5 minor currencies, with support for 130+ currencies across 190+ countries. Headquartered in Singapore, with offices across Asia and Europe, we partner with Citibank, Barclays, J.P. Morgan, and Standard Chartered. We are also a principal member of Mastercard, Visa, and UnionPay."',
    ur: '"Aagay badhne se pehle, me SUNRATE ke baare mein mukhtasar baat karta hu. SUNRATE ek global payment platform hai jo 2016 mein qayam hua. Hamare paas 16 major aur 5 minor currencies mein multi-currency accounts hain, aur 190+ countries mein 130+ currencies ka support hai. Hamara headquarters Singapore mein hai. Hum Citibank, Barclays, J.P. Morgan aur Standard Chartered ke saath partner hain, aur Mastercard, Visa aur UnionPay ke principal member bhi hain."',
    tip: 'Keep this under 60 seconds. You are establishing credibility — not selling yet. The bank partnerships and Mastercard/Visa membership are powerful trust signals. Deliver them with confidence.',
    target: '60 sec',
  },
  {
    step: 4,
    title: 'Discovery — Listen to the Client',
    en: '"Muhammad Ali Sahib, before I go any further, I would love to understand your current setup better. Could you help me with a few quick questions?"',
    ur: '"Muhammad Ali Sahib, aagay badhne se pehle me chahta hu ke aap ka current setup samjhu. Kya ap mere saath kuch quick questions discuss kar sakte hain?"',
    tip: 'Listen more than you speak in this step. Take notes. Every pain point the client mentions is a door you can open with SUNRATE\'s solution. Never interrupt — let them finish completely.',
    target: '3–5 min',
    questions: [
      { en: 'How are your international clients currently paying you?', ur: 'Aap ke international clients aap ko abhi kaise payment karte hain?' },
      { en: 'Which platforms or channels are you using to collect funds?', ur: 'Funds collect karne ke liye ap kaunse platforms ya channels use kar rahe hain?' },
      { en: 'Are you facing any delays, high conversion losses, or fee-related issues?', ur: 'Kya ap ko koi delays, high fees, ya conversion losses ka saamna hai?' },
      { en: 'Do you or your team use any virtual cards for online business spending?', ur: 'Kya ap ya apki team online business spend ke liye koi virtual cards use karti hai?' },
      { en: 'How do you currently move funds into your Pakistani bank accounts?', ur: 'Aap abhi apne Pakistan ke bank accounts mein funds kaise transfer karte hain?' },
    ],
  },
  {
    step: 5,
    title: 'Present the Solution',
    en: '"Thank you for sharing that, Muhammad Ali Sahib. Based on what you have described, I believe SUNRATE can address these challenges very effectively. Let me walk you through what we can specifically offer you:"',
    ur: '"Shukriya Muhammad Ali Sahib, apne jo share kiya wo bohat useful tha. Jo ap ne describe kiya hai uske basis par mujhe yakeen hai ke SUNRATE aapke liye in challenges ko effectively solve kar sakta hai. Me aap ko specifically batata hu ke hum kya offer kar sakte hain:"',
    tip: 'Match each pillar to a specific pain point the client mentioned in Step 4. Never present all four blindly — lead with what matters most to them.',
    target: '3–4 min',
    pillars: [
      {
        icon: '①',
        title: 'Multi-Currency Collection Account',
        en: 'With SUNRATE, you receive a dedicated multi-currency collection account — enabling your international clients to pay you directly in USD, EUR, GBP, and 130+ other currencies across 190+ countries. No delays, no middlemen, no unnecessary conversions.',
        ur: 'SUNRATE ke saath aap ko ek dedicated multi-currency collection account milta hai — jisme aap ke international clients seedha USD, EUR, GBP aur 130+ currencies mein payment kar sakte hain, 190+ countries se. Koi delay nahi, koi middleman nahi, koi ghair zaroori conversion nahi.',
      },
      {
        icon: '②',
        title: 'Virtual Cards',
        en: 'We also provide virtual cards that you and your team can use for all online business expenditure — whether it is software subscriptions, digital advertising, vendor payments, or any other global online spending.',
        ur: 'Hum virtual cards bhi provide karte hain jo aap aur aap ki team online business spend ke liye use kar sakte hain — chahe software subscriptions hon, digital advertising ho, vendor payments hon, ya koi bhi aur online business expenditure.',
      },
      {
        icon: '③',
        title: 'Payout to Pakistani Local Banks',
        en: 'Once your funds are collected, you can payout directly into your Pakistani local bank account — quickly, transparently, and at highly competitive exchange rates.',
        ur: 'Jab aap ke funds collect ho jayen, aap directly apne Pakistani local bank account mein payout le sakte hain — tezi se, transparently, aur bohat competitive exchange rates par.',
      },
      {
        icon: '④',
        title: 'Local Team & Dedicated Support',
        en: 'We have a dedicated local team present in Pakistan to support you at every stage — from onboarding and account setup through to day-to-day transactions and beyond.',
        ur: 'Hamare paas Pakistan mein ek dedicated local team hai jo har qadam par aap ki madad karegi — onboarding aur account setup se le kar rozana ke transactions tak aur uske baad bhi.',
      },
    ],
  },
  {
    step: 6,
    title: 'Handle Pricing Objection',
    en: '"Muhammad Ali Sahib, I completely understand that pricing is an important consideration. If it would be helpful, I am happy to walk you through a direct comparison between your current costs and what SUNRATE offers — so you can evaluate the difference clearly for yourself."',
    ur: '"Muhammad Ali Sahib, me bilkul samajhta hu ke pricing ek important factor hai. Agar aap chahen, me aap ko apne current costs aur SUNRATE ki fees ka direct comparison dikhata hu — taake aap khud clearly farq dekh sakein aur apna decision le sakein."',
    tip: 'Never discount without comparing first. Let the numbers speak. If their current platform is charging 3–5% and SUNRATE is more competitive, that saving becomes your strongest closing argument.',
    target: '1–2 min',
  },
  {
    step: 7,
    title: 'The Close — Sign Up & Test Payment',
    en: '"Muhammad Ali Sahib, the best part is that there are absolutely no signup charges — registration is completely free of cost. What I would suggest is this: allow me to share the signup link with you right now, complete the registration at your convenience, and simply process one test payment to experience the full end-to-end journey yourself. There is no commitment required — just try it and see the difference firsthand."',
    ur: '"Muhammad Ali Sahib, sab se acha hissa ye hai ke signup ka bilkul koi charge nahi hai — registration poori tarah free of cost hai. Me suggest karunga ke me abhi aap ko signup link share karta hu, aap apni suvidha mein registration complete karein, aur sirf ek test payment karein taake aap khud poori end-to-end journey experience kar sakein. Koi commitment nahi chahiye — bas try karein aur khud farq mehsoos karein."',
    tip: '"Free" and "no commitment" remove the two biggest barriers to action. Your goal at this stage is one micro-commitment — the signup. Not the full sale. Get the link opened.',
    target: '1–2 min',
  },
  {
    step: 8,
    title: 'Share Signup Link & Confirm Next Steps',
    en: '"I am sharing the signup link with you right now on WhatsApp / email. Once you have registered, our local team will reach out within 24 hours to assist you with the account setup and your first test transaction. Does that work for you, Muhammad Ali Sahib?"',
    ur: '"Me abhi aap ko signup link WhatsApp / email par share kar raha hu. Jaise hi aap register ho jayen, hamari local team 24 ghante ke andar aap se rabta karegi aur account setup aur pehle test transaction mein madad karegi. Kya ye aap ke liye theek hai, Muhammad Ali Sahib?"',
    target: '30 sec',
  },
  {
    step: 9,
    title: 'Closing & Thank You',
    en: '"Thank you so much for your time today, Muhammad Ali Sahib. It was a genuine pleasure speaking with you. I look forward to supporting Softic Solutions on this journey. Please do not hesitate to reach out to me directly at any time — I am always available."',
    ur: '"Bohat shukriya Muhammad Ali Sahib, aap ne apna qeemti waqt diya. Aap se baat kar ke bohat acha laga. Mujhe umeed hai ke hum Softic Solutions ke saath mil kar ek kamyab safar shuru kar sakenge. Kisi bhi waqt seedha mujhse rabta karein — me hamesha haazir hu."',
    target: '30 sec',
  },
]

const QUICK_REF = [
  { stage: 'Opening',      goal: 'Build rapport',           time: '30 sec' },
  { stage: 'Hook',         goal: 'Earn curiosity',          time: '45 sec' },
  { stage: 'Introduction', goal: 'Establish credibility',   time: '60 sec' },
  { stage: 'Discovery',    goal: 'Identify pain points',    time: '3–5 min' },
  { stage: 'Solution',     goal: 'Match pain to product',   time: '3–4 min' },
  { stage: 'Pricing',      goal: 'Neutralise objection',    time: '1–2 min' },
  { stage: 'Close',        goal: 'Secure signup commitment',time: '1–2 min' },
  { stage: 'Next Steps',   goal: 'Confirm follow-up action',time: '30 sec' },
  { stage: 'Total',        goal: '',                        time: '~12–15 min', bold: true },
]

export default function SalesCallScript({ onClose }) {
  return (
    <div className="modal-overlay" style={{ zIndex: 1300 }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={{ maxWidth: 900, maxHeight: '90vh' }}>

        {/* Header */}
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, rgba(71,150,227,0.08), rgba(145,119,199,0.08))' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase', background: 'var(--so-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 3 }}>
              SUNRATE · BD Sales Guide
            </div>
            <h3 style={{ margin: 0 }}>Sales Call Script &nbsp;·&nbsp; English &amp; Urdu</h3>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ fontSize: 16 }}>✕</button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {STEPS.map(s => (
            <div key={s.step} style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>

              {/* Step header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px',
                background: 'linear-gradient(90deg, var(--so-blue-soft), var(--so-purple-soft))',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: 'var(--so-gradient)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0
                  }}>{s.step}</div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
                    Step {s.step}: {s.title}
                  </span>
                </div>
                {s.target && (
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--so-blue)', background: 'var(--so-blue-soft)', padding: '2px 8px', borderRadius: 20, letterSpacing: '0.3px' }}>
                    ⏱ {s.target}
                  </span>
                )}
              </div>

              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* English */}
                <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: '10px 14px', borderLeft: '3px solid var(--so-blue)' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--so-blue)', marginBottom: 5 }}>English</div>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.7, fontStyle: 'italic' }}>{s.en}</div>
                </div>

                {/* Urdu */}
                <div style={{ background: 'var(--bg-tertiary)', borderRadius: 8, padding: '10px 14px', borderLeft: '3px solid var(--so-purple)' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--so-purple)', marginBottom: 5 }}>Urdu</div>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.7, fontStyle: 'italic' }}>{s.ur}</div>
                </div>

                {/* Discovery questions */}
                {s.questions && (
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ padding: '7px 12px', background: 'var(--bg-tertiary)', fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                      Discovery Questions
                    </div>
                    {s.questions.map((q, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderTop: i === 0 ? 'none' : '0.5px solid var(--border-color)' }}>
                        <div style={{ padding: '7px 12px', fontSize: 11, color: 'var(--text-primary)', borderRight: '0.5px solid var(--border-color)' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--so-blue)', marginRight: 6 }}>{i + 1}</span>{q.en}
                        </div>
                        <div style={{ padding: '7px 12px', fontSize: 11, color: 'var(--text-secondary)' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--so-purple)', marginRight: 6 }}>{i + 1}</span>{q.ur}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Solution pillars */}
                {s.pillars && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {s.pillars.map((p, i) => (
                      <div key={i} style={{ border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 12px', background: 'var(--bg-card)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, background: 'var(--so-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{p.icon}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{p.title}</span>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 6 }}>{p.en}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.6, fontStyle: 'italic', borderTop: '0.5px solid var(--border-color)', paddingTop: 6 }}>{p.ur}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* BD Tip */}
                {s.tip && (
                  <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)', borderRadius: 8, padding: '9px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 13, flexShrink: 0 }}>💡</span>
                    <div>
                      <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#E37400', marginRight: 6 }}>BD Tip</span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.tip}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Quick Reference */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', background: 'linear-gradient(90deg, var(--so-blue-soft), var(--so-pink-soft))', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>📋</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Quick Reference Card</span>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Stage</th><th>Goal</th><th>Target Time</th></tr>
              </thead>
              <tbody>
                {QUICK_REF.map(r => (
                  <tr key={r.stage}>
                    <td style={{ fontWeight: r.bold ? 800 : 600, color: r.bold ? 'var(--so-blue)' : 'var(--text-primary)' }}>{r.stage}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.goal}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: r.bold ? 800 : 600, color: r.bold ? 'var(--so-blue)' : 'var(--text-primary)' }}>{r.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Golden Rule */}
          <div style={{ background: 'linear-gradient(135deg, var(--so-blue-soft), var(--so-purple-soft))', border: '1px solid rgba(71,150,227,0.2)', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>🏆</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', background: 'var(--so-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 5 }}>Golden Rule for BDs</div>
              <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.7 }}>
                The client who talks the most in a sales call is the one most likely to convert. Your job is to ask smart questions, listen carefully, and present SUNRATE as the natural answer to the pain the client described in their own words.
              </div>
            </div>
          </div>

        </div>

        <div className="modal-footer">
          <button className="btn btn-primary btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
