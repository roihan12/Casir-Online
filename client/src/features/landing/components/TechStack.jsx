import React from 'react';
import { SiReact, SiTailwindcss, SiNodedotjs, SiPostgresql, SiPrisma } from 'react-icons/si';

const TechStack = () => {
  const technologies = [
    { name: 'React', icon: <SiReact className="text-[#61DAFB]" /> },
    { name: 'Tailwind CSS', icon: <SiTailwindcss className="text-[#06B6D4]" /> },
    { name: 'Node.js', icon: <SiNodedotjs className="text-[#339933]" /> },
    { name: 'PostgreSQL', icon: <SiPostgresql className="text-[#336791]" /> },
    { name: 'Prisma', icon: <SiPrisma className="text-gray-900" /> },
  ];

  return (
    <div className="relative py-10 border-y border-gray-100 bg-gradient-to-r from-gray-50/50 via-white to-gray-50/50 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-50/20 via-transparent to-transparent pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <p className="text-center text-sm font-semibold text-gray-500 mb-8 uppercase tracking-widest">
          Didukung Oleh Teknologi Modern & Stabil
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
          {technologies.map((tech, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 group cursor-pointer transition-all duration-300 hover:scale-110">
              <div className="text-4xl text-gray-400 group-hover:text-current transition-colors duration-300">
                {tech.icon}
              </div>
              <span className="text-xs font-semibold text-gray-500 group-hover:text-gray-900">{tech.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TechStack;
