import React from 'react';
import { VisionSection } from '../types';
import { Heart, Cpu, GraduationCap, Sparkles, ShieldCheck, X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const sections: VisionSection[] = [
    {
      title: "الأسس التكنولوجية",
      icon: <Cpu className="text-blue-500" />,
      points: ["معالجة لغة طبيعية متقدمة", "تعلم عميق متكيف", "بنية تحتية متطورة"]
    },
    {
      title: "البعد العاطفي",
      icon: <Heart className="text-red-500" />,
      points: ["تعاطف حقيقي", "دعم نفسي", "فهم السياق الشعوري"]
    },
    {
      title: "التميز التعليمي",
      icon: <GraduationCap className="text-brand-600" />,
      points: ["تفريد التعليم", "أمثلة واقعية", "تقييم بناء"]
    },
    {
      title: "السمات الشخصية",
      icon: <Sparkles className="text-amber-500" />,
      points: ["ذكاء اجتماعي", "روح مرحة", "تواضع وفضول"]
    },
    {
      title: "الضمانات والأخلاق",
      icon: <ShieldCheck className="text-emerald-500" />,
      points: ["خصوصية البيانات", "أمان عاطفي", "شفافية تامة"]
    }
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Content */}
      <aside 
        className={`
          fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto border-l border-slate-100
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          lg:translate-x-0 lg:static lg:shadow-none lg:z-0
        `}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-800">رؤية المشروع</h2>
            <button onClick={onClose} className="lg:hidden p-2 hover:bg-slate-100 rounded-full text-slate-500">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-8">
            {sections.map((section, idx) => (
              <div key={idx} className="group">
                <div className="flex items-center gap-3 mb-3 text-slate-800">
                  <span className="p-2 bg-slate-50 rounded-lg group-hover:bg-brand-50 transition-colors">
                    {section.icon}
                  </span>
                  <h3 className="font-bold text-sm">{section.title}</h3>
                </div>
                <ul className="mr-11 space-y-2">
                  {section.points.map((point, pIdx) => (
                    <li key={pIdx} className="text-xs text-slate-500 list-disc marker:text-brand-300">
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 p-4 bg-gradient-to-br from-brand-50 to-accent-50 rounded-xl border border-brand-100">
            <p className="text-xs text-slate-600 text-center font-medium leading-relaxed">
              "ليس مجرد مساعد، بل رفيق رحلتك التعليمية ومرآة تعكس أفضل ما فيك."
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};