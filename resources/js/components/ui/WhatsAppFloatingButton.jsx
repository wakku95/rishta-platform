import React from 'react';

/**
 * Universal SVG for official WhatsApp branding
 */
export function WhatsAppIcon({ className = 'w-6 h-6' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      className={className}
      aria-hidden="true"
    >
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

/**
 * Floating WhatsApp Action Button.
 * Placed in the bottom-right corner for instant matrimonial help & direct matchmaking support.
 */
export default function WhatsAppFloatingButton({
  phoneNumber = '923239225450',
  defaultMessage = 'Assalam-o-Alaikum RaabtaNow Team, I need assistance regarding matrimonial services.',
}) {
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 select-none print:hidden">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp with RaabtaNow Support"
        title="Chat with RaabtaNow on WhatsApp (+92-323-9225450)"
        className="group relative flex items-center gap-2.5 p-3 sm:px-4 sm:py-3 rounded-full bg-gradient-to-tr from-[#25D366] to-[#128C7E] hover:from-[#20bd5a] hover:to-[#0f776a] text-white shadow-2xl shadow-[#25D366]/40 hover:shadow-[#25D366]/60 hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#25D366]/60 cursor-pointer"
      >
        {/* Subtle breathing ping ring */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-35 animate-ping pointer-events-none" />

        {/* WhatsApp Icon */}
        <div className="relative flex items-center justify-center shrink-0">
          <WhatsAppIcon className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-200" />
        </div>

        {/* Text Label on tablet and desktop */}
        <div className="hidden sm:flex items-center gap-1.5 pr-1 font-semibold text-xs leading-none">
          <span>Chat on WhatsApp</span>
          <span className="opacity-75">•</span>
          <span className="font-urdu text-[11px] font-normal" dir="rtl">
            رابطہ کریں
          </span>
        </div>
      </a>
    </div>
  );
}
