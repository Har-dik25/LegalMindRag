import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { X, ChevronRight, Check } from 'lucide-react';

const steps = [
  { id: 'type', title: 'Issue Type', desc: 'What kind of matter is this?' },
  { id: 'date', title: 'Date of Incident', desc: 'When did this occur?' },
  { id: 'desc', title: 'Description', desc: 'Briefly describe the situation' }
];

export default function CaseIntakeWizard({ onClose }) {
  const { addMatter } = useApp();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({ type: '', date: '', desc: '' });

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      addMatter(formData.type || 'New Matter', formData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="absolute top-6 right-6 z-10">
        <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="w-full max-w-xl">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors ${i <= step ? 'bg-amber-500' : 'bg-white/10'}`} />
              <div className={`text-xs mt-2 font-medium ${i <= step ? 'text-amber-500' : 'text-zinc-500'}`}>{s.title}</div>
            </div>
          ))}
        </div>

        {/* Wizard Content */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden min-h-[300px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 p-8 flex flex-col justify-between"
            >
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{steps[step].title}</h2>
                <p className="text-zinc-400 mb-6">{steps[step].desc}</p>
                
                {step === 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {['Criminal', 'Civil', 'Corporate', 'Family'].map(t => (
                      <button key={t} onClick={() => setFormData(p => ({ ...p, type: t }))}
                        className={`p-4 rounded-xl border text-left transition-all ${formData.type === t ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-zinc-800 border-transparent text-zinc-300 hover:bg-zinc-700'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                )}

                {step === 1 && (
                  <div>
                    <input type="date" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors" />
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <textarea rows={4} value={formData.desc} onChange={e => setFormData(p => ({ ...p, desc: e.target.value }))}
                      placeholder="Enter a brief summary..."
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors resize-none" />
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-6">
                <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
                  className={`px-4 py-2 text-sm font-medium ${step === 0 ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-400 hover:text-white'}`}>
                  Back
                </button>
                <button onClick={handleNext}
                  className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-all">
                  {step === steps.length - 1 ? 'Create Matter' : 'Continue'}
                  {step === steps.length - 1 ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
