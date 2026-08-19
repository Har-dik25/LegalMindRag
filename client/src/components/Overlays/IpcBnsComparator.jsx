import React, { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { X, Search, Sliders, ArrowRight, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const ENHANCED_LEGAL_COMPARISONS = [
  // ─── BNS vs IPC (Substantive Criminal Law) ───
  {
    category: 'Criminal (Offences against Human Body)',
    oldCode: 'IPC § 302',
    newCode: 'BNS § 103(1)',
    oldTitle: 'Punishment for Murder',
    newTitle: 'Punishment for Murder & Mob Lynching',
    oldText: 'Whoever commits murder shall be punished with death, or imprisonment for life, and shall also be liable to fine.',
    newText: '(1) Whoever commits murder shall be punished with death or imprisonment for life, and shall also be liable to fine.\n(2) When a group of five or more persons acting in concert commits murder on the ground of race, caste, community, sex, place of birth, language, or personal belief, each member shall be punished with death or imprisonment for life and fine.',
    changes: 'Introduced explicit capital offence for mob lynching and group hate crimes under Section 103(2).',
    severity: 'Capital / Life Imprisonment',
  },
  {
    category: 'Criminal (Offences against Human Body)',
    oldCode: 'IPC § 304',
    newCode: 'BNS § 105',
    oldTitle: 'Culpable Homicide not amounting to Murder',
    newTitle: 'Punishment for Culpable Homicide',
    oldText: 'Punished with imprisonment for life, or imprisonment of either description for a term which may extend to ten years, and shall also be liable to fine.',
    newText: 'Whoever commits culpable homicide not amounting to murder shall be punished with imprisonment for life or imprisonment of either description up to ten years, and fine.',
    changes: 'Renumbered from 304 to 105. Retained two-tier penalty structure based on intention vs knowledge.',
    severity: 'Life Imprisonment / 10 Years',
  },
  {
    category: 'Criminal (Negligence & Rash Acts)',
    oldCode: 'IPC § 304A',
    newCode: 'BNS § 106',
    oldTitle: 'Causing Death by Negligence',
    newTitle: 'Causing Death by Negligence & Hit-and-Run',
    oldText: 'Whoever causes the death of any person by doing any rash or negligent act not amounting to culpable homicide, shall be punished with imprisonment up to two years, or fine, or both.',
    newText: '(1) Causing death by rash/negligent act: Imprisonment up to five years and fine.\n(2) Hit-and-Run: Whoever escapes without reporting the incident to a police officer or magistrate soon after the incident shall be punished with imprisonment up to ten years and fine.',
    changes: 'Major Enhancement: Basic negligence increased from 2 years to 5 years. Severe 10-year hit-and-run penalty created in Section 106(2).',
    severity: '5 Years / 10 Years for Hit-and-Run',
  },
  {
    category: 'Criminal (General Exceptions)',
    oldCode: 'IPC § 84',
    newCode: 'BNS § 22',
    oldTitle: 'Act of a Person of Unsound Mind (Insanity)',
    newTitle: 'Act of a Person of Unsound Mind',
    oldText: 'Nothing is an offence which is done by a person who, at the time of doing it, by reason of unsoundness of mind, is incapable of knowing the nature of the act, or that he is doing what is either wrong or contrary to law.',
    newText: 'Nothing is an offence which is done by a person who, at the time of doing it, by reason of unsoundness of mind, is incapable of knowing the nature of the act, or that he is doing what is either wrong or contrary to law.',
    changes: 'Verbatim retention of McNaughten rules under modern Section 22 BNS.',
    severity: 'Complete General Defence / Acquittal',
  },
  {
    category: 'Criminal (State Security & Sovereignty)',
    oldCode: 'IPC § 124A',
    newCode: 'BNS § 152',
    oldTitle: 'Sedition',
    newTitle: 'Acts Endangering Sovereignty, Unity and Integrity of India',
    oldText: 'Whoever by words, either spoken or written, or by signs, or by visible representation, or otherwise, excites or attempts to excite disaffection towards the Government established by law...',
    newText: 'Whoever, purposely or knowingly, by words spoken or written, or by signs, or by visible representation, or by electronic communication or by use of financial means, excites or attempts to excite secession or armed rebellion or subversive activities, or endangers sovereignty, unity and integrity of India...',
    changes: 'Repealed archaic colonial "Sedition". Replaced with targeted provisions against armed rebellion, secession, and electronic subversion.',
    severity: 'Life Imprisonment or up to 7 Years',
  },
  {
    category: 'Criminal (Sexual Offences)',
    oldCode: 'IPC § 375 / 376',
    newCode: 'BNS § 63 / 64',
    oldTitle: 'Rape & Punishment for Rape',
    newTitle: 'Rape & Gang Rape Provisions',
    oldText: 'Punished with rigorous imprisonment not less than ten years, which may extend to imprisonment for life, and fine.',
    newText: 'Consolidated sexual offences under Chapter V. Section 69 creates a specialized offence for deceitful sexual intercourse (false promise of marriage/employment).',
    changes: 'New offence for sex on deceitful promise of marriage (S. 69 BNS). Gang rape of minor punishable with death or life imprisonment.',
    severity: 'Rigorous 10 Years to Death',
  },
  {
    category: 'Criminal (Organized Crime & Terrorism)',
    oldCode: 'IPC (No Direct Provision - State MCOCA)',
    newCode: 'BNS § 111 & 113',
    oldTitle: 'Organized Crime / Terrorist Acts (State Acts)',
    newTitle: 'Organized Crime & Terrorist Acts in General Law',
    oldText: 'No central IPC section existed; relied on Special State Acts like MCOCA, KCOCA, or central UAPA.',
    newText: 'Codified Organized Crime (S. 111) and Terrorist Acts (S. 113) directly within the general substantive penal code.',
    changes: 'Nationalization of organized syndicate crime and economic fraud into standard penal law.',
    severity: 'Death or Life Imprisonment + ₹5-10 Lakh Fine',
  },

  // ─── BNSS vs CrPC (Criminal Procedure) ───
  {
    category: 'Procedure (FIR & Investigation)',
    oldCode: 'CrPC § 154',
    newCode: 'BNSS § 173',
    oldTitle: 'Information in Cognizable Cases (FIR)',
    newTitle: 'Zero FIR, e-FIR & Preliminary Enquiry',
    oldText: 'Every information relating to the commission of a cognizable offence, if given orally to an officer in charge of a police station, shall be reduced to writing...',
    newText: 'Mandates Zero FIR registration at any police station with 24-hour transfer. Permits electronic FIR (e-FIR) with 3-day signature rule. Adds 14-day preliminary enquiry window for 3-7 year offences with DSP permission.',
    changes: 'Statutory codification of Zero FIR and e-FIR. Institutionalized preliminary enquiry to prevent frivolous arrests.',
    severity: 'Procedural Protection',
  },
  {
    category: 'Procedure (Arrest & Notice)',
    oldCode: 'CrPC § 41 & 41A',
    newCode: 'BNSS § 35',
    oldTitle: 'When Police May Arrest Without Warrant & Notice of Appearance',
    newTitle: 'Arrest Safeguards & Mandatory DSP Permission',
    oldText: 'Arnesh Kumar guidelines applied via judicial interpretation for offences punishable with up to 7 years.',
    newText: 'Requires DSP-rank permission prior to arresting individuals above 60 years or infirm persons for offences punishable with less than 3 years. Mandatory notice of appearance.',
    changes: 'Enhanced protection for senior citizens and medically infirm persons against arbitrary arrest.',
    severity: 'Constitutional Safeguard',
  },
  {
    category: 'Procedure (Undertrial Relief & Bail)',
    oldCode: 'CrPC § 436A',
    newCode: 'BNSS § 479',
    oldTitle: 'Maximum Period for which an Undertrial Prisoner can be Detained',
    newTitle: 'First-Time Offender Bail on 1/3rd Detention',
    oldText: 'Undertrials released on personal bond after completing one-half (1/2) of maximum sentence.',
    newText: 'First-time offenders (never convicted previously) MUST be released on bail after serving one-third (1/3rd) of the maximum imprisonment period. Jail superintendents mandated to apply for bail.',
    changes: 'Accelerated bail for first-time offenders (reduced from 50% to 33.3% of maximum sentence).',
    severity: 'Bail Right for Undertrials',
  },
  {
    category: 'Procedure (Digital Trial & Tech)',
    oldCode: 'CrPC (No Broad Video Trial Mandate)',
    newCode: 'BNSS § 530',
    oldTitle: 'Physical Trials & In-Person Evidence',
    newTitle: 'Electronic Mode for all Inquiries, Trials & Proceedings',
    oldText: 'Primarily physical court proceedings with limited video-conferencing in select high-security trials.',
    newText: 'All trials, inquiries, examination of witnesses, summons, warrants, and evidence can be conducted electronically via audio-video electronic means.',
    changes: 'Complete paperless digital court enablement across all tiers of criminal justice.',
    severity: 'Digital Modernization',
  },

  // ─── BSA vs IEA (Evidence Law) ───
  {
    category: 'Evidence (Digital & Electronic Records)',
    oldCode: 'IEA § 65B',
    newCode: 'BSA § 61 & 63',
    oldTitle: 'Admissibility of Electronic Records',
    newTitle: 'Primary vs Secondary Electronic Evidence',
    oldText: 'Section 65B mandatory certificate required for all secondary computer outputs (Arjun Panditrao rule).',
    newText: 'Section 61 recognizes original device/server as Primary Evidence without certificate. Section 63 governs secondary electronic copies requiring Section 57/63 validation certificates.',
    changes: 'Crystalized distinction between original smartphones/laptops (primary) and printouts/flash drives (secondary).',
    severity: 'Evidentiary Admissibility Standard',
  },
  {
    category: 'Evidence (Burden of Proof & Presumptions)',
    oldCode: 'IEA § 108',
    newCode: 'BSA § 111',
    oldTitle: 'Burden of Proving that Person is Alive (Civil Death)',
    newTitle: 'Presumption of Civil Death (7 Years Absence)',
    oldText: 'Burden of proving a person is alive shifts if not heard of for seven years by natural relations.',
    newText: 'Retains the statutory 7-year presumption of civil death shifting the evidentiary burden to the asserting party.',
    changes: 'Retained verbatim and harmonized into Chapter VII of BSA 2023.',
    severity: 'Statutory Presumption of Law',
  },
];

export default function IpcBnsComparator() {
  const { ipcBnsOpen, setIpcBnsOpen } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sliderVal, setSliderVal] = useState(50);
  const [activeItem, setActiveItem] = useState(ENHANCED_LEGAL_COMPARISONS[0]);

  const categories = useMemo(() => {
    const cats = ['ALL', ...new Set(ENHANCED_LEGAL_COMPARISONS.map(i => i.category.split(' (')[0]))];
    return cats;
  }, []);

  const filteredItems = useMemo(() => {
    return ENHANCED_LEGAL_COMPARISONS.filter(item => {
      const matchCat = selectedCategory === 'ALL' || item.category.startsWith(selectedCategory);
      const query = searchTerm.toLowerCase();
      const matchSearch = (
        item.oldCode.toLowerCase().includes(query) ||
        item.newCode.toLowerCase().includes(query) ||
        item.oldTitle.toLowerCase().includes(query) ||
        item.newTitle.toLowerCase().includes(query) ||
        item.changes.toLowerCase().includes(query)
      );
      return matchCat && matchSearch;
    });
  }, [searchTerm, selectedCategory]);

  if (!ipcBnsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-lg">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="w-full max-w-6xl h-[92vh] bg-[#0E0F12] border border-[#B08D57]/30 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col font-inter"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#B08D57]/20 bg-[#16181D]/90 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#B08D57]/10 border border-[#B08D57]/30 text-[#B08D57]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-serif font-bold text-[#E9E6DD] tracking-wide">
                Statutory Transmutation Matrix (IPC/CrPC/IEA ↔ BNS/BNSS/BSA 2023)
              </h2>
              <p className="text-xs text-[#8A8778]">
                Interactive legal comparator examining statutory renumbering, penalties, and new legislative additions.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIpcBnsOpen(false)}
            className="p-2 hover:bg-[#B08D57]/10 rounded-lg text-[#8A8778] hover:text-[#B08D57] transition-all"
            title="Close Comparator"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="px-6 py-3.5 border-b border-[#B08D57]/15 bg-[#121316] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8778]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search section number (e.g. 302, 103, 173, 420), crime, or keywords..."
              className="w-full bg-black/40 border border-[#B08D57]/20 rounded-lg pl-10 pr-4 py-2 text-xs text-[#E9E6DD] placeholder:text-[#8A8778]/50 focus:border-[#B08D57] focus:outline-none"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#B08D57] text-[#0E0F12] font-semibold shadow-[0_0_10px_rgba(176,141,87,0.3)]'
                    : 'bg-[#1C1F26] text-[#8A8778] hover:text-[#E9E6DD] border border-[#B08D57]/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left List Navigation */}
          <div className="w-72 md:w-80 border-r border-[#B08D57]/15 bg-[#121316]/70 overflow-y-auto scrollbar-chambers p-3 space-y-2 flex-shrink-0">
            {filteredItems.map((item, idx) => {
              const isSelected = activeItem?.oldCode === item.oldCode;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveItem(item)}
                  className={`w-full text-left p-3 rounded-xl transition-all border ${
                    isSelected
                      ? 'bg-[#B08D57]/15 border-[#B08D57]/50 shadow-[0_0_15px_rgba(176,141,87,0.15)]'
                      : 'bg-[#16181D]/60 border-[#B08D57]/10 hover:border-[#B08D57]/30 hover:bg-[#16181D]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#B08D57] mb-1">
                    <span>{item.oldCode}</span>
                    <ArrowRight className="w-3 h-3 text-[#8A8778]" />
                    <span className="text-emerald-400">{item.newCode}</span>
                  </div>
                  <div className="text-xs font-semibold text-[#E9E6DD] line-clamp-1 mb-1">
                    {item.newTitle}
                  </div>
                  <div className="text-[10px] text-[#8A8778] line-clamp-1">
                    {item.changes}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Dual Diff Viewport */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0E0F12]">
            {/* Timeline Slider Control */}
            <div className="px-6 py-3 border-b border-[#B08D57]/15 bg-[#16181D]/40 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-red-400 font-medium">Legacy Law (Pre-July 2024)</span>
                <span className="text-[#8A8778]">◀ Time Slider ▶</span>
                <span className="text-emerald-400 font-medium">New Sanhitas (Post-July 2024)</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderVal}
                onChange={(e) => setSliderVal(Number(e.target.value))}
                className="w-48 h-1.5 rounded-full accent-[#B08D57] cursor-pointer bg-[#22262F]"
              />
            </div>

            {/* Split Comparison Columns */}
            <div className="flex-1 flex overflow-y-auto scrollbar-chambers p-6 gap-6">
              {/* Legacy Law Card */}
              <div
                className={`flex-1 flex flex-col p-5 rounded-xl border transition-all duration-300 ${
                  sliderVal > 70 ? 'opacity-30' : 'opacity-100'
                } bg-red-950/15 border-red-500/20`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                    REPEALED / LEGACY
                  </span>
                  <span className="text-xs font-mono text-[#8A8778]">{activeItem?.category}</span>
                </div>
                <h3 className="text-lg font-serif font-bold text-red-200 mb-1">{activeItem?.oldCode}</h3>
                <p className="text-xs font-medium text-red-300/80 mb-4">{activeItem?.oldTitle}</p>
                <div className="p-4 rounded-lg bg-black/40 border border-red-500/20 text-xs font-serif leading-relaxed text-red-200/90 whitespace-pre-line flex-1">
                  {activeItem?.oldText}
                </div>
              </div>

              {/* Modern Law Card */}
              <div
                className={`flex-1 flex flex-col p-5 rounded-xl border transition-all duration-300 ${
                  sliderVal < 30 ? 'opacity-30' : 'opacity-100'
                } bg-emerald-950/15 border-emerald-500/25 shadow-[0_0_25px_rgba(16,185,129,0.08)]`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    ENACTED / ACTIVE LAW
                  </span>
                  <span className="text-xs font-mono text-emerald-400/80">{activeItem?.severity}</span>
                </div>
                <h3 className="text-lg font-serif font-bold text-emerald-200 mb-1">{activeItem?.newCode}</h3>
                <p className="text-xs font-medium text-emerald-300/90 mb-4">{activeItem?.newTitle}</p>
                <div className="p-4 rounded-lg bg-black/40 border border-emerald-500/20 text-xs font-serif leading-relaxed text-emerald-100/95 whitespace-pre-line flex-1">
                  {activeItem?.newText}
                </div>
              </div>
            </div>

            {/* Bottom Substantive Shift Callout */}
            {activeItem?.changes && (
              <div className="px-6 py-3.5 border-t border-[#B08D57]/20 bg-[#16181D] flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-[#B08D57] flex-shrink-0" />
                <p className="text-xs text-[#E9E6DD]">
                  <strong className="text-[#B08D57]">Substantive Legal Shift:</strong> {activeItem.changes}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
