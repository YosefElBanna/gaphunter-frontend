import React from 'react';
import { Target, Scan, ListChecks, FileText } from 'lucide-react';

interface StepperProps {
  currentStep: 1 | 2 | 3 | 4;
}

const Stepper: React.FC<StepperProps> = ({ currentStep }) => {
  const steps = [
    { num: 1, label: 'Choose Surface', icon: Target },
    { num: 2, label: 'Deep Scan', icon: Scan },
    { num: 3, label: 'Review Gaps', icon: ListChecks },
    { num: 4, label: 'Build Brief', icon: FileText },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto mb-10 flex items-center justify-between px-6 relative animate-in fade-in slide-in-from-top-4 duration-700">
       {/* Connector Line */}
       <div className="absolute top-[15px] left-10 right-10 h-px bg-brand-border/30 -z-10" />
       
       {steps.map((step) => {
         const isActive = currentStep >= step.num;
         const isCurrent = currentStep === step.num;
         return (
            <div key={step.num} className="flex flex-col items-center gap-3 bg-brand-bg px-2 z-10">
                <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-500
                    ${isActive 
                        ? 'bg-brand-card border-brand-accent text-brand-accent shadow-[0_0_15px_rgba(var(--accent)/0.2)]' 
                        : 'bg-brand-bg border-brand-border text-brand-muted/50'}
                    ${isCurrent ? 'scale-110 ring-2 ring-brand-accent/20' : ''}
                `}>
                    <step.icon size={14} strokeWidth={isCurrent ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-medium tracking-widest uppercase transition-colors duration-300 ${isCurrent ? 'text-brand-text' : 'text-brand-muted/40'}`}>
                    {step.label}
                </span>
            </div>
         );
       })}
    </div>
  );
};

export default Stepper;