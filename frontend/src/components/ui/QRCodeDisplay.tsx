import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, Download, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  title?: string;
  subtitle?: string;
  showBorder?: boolean;
  className?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 140,
  title,
  subtitle,
  showBorder = true,
  className = '',
}) => {
  const handleDownload = () => {
    const svg = document.getElementById(`qr-code-svg-${value.replace(/[^a-zA-Z0-9]/g, '')}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = size + 40;
      canvas.height = size + 40;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngFile;
        downloadLink.download = `CampusAccess-Pass-QR.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        toast.success('QR Pass downloaded to your device!');
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const svgId = `qr-code-svg-${value.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div className={`flex flex-col items-center justify-center p-3 text-center ${className}`}>
      {/* Container Card */}
      <div
        className={`bg-white p-3.5 rounded-2xl ${
          showBorder ? 'border border-slate-200 shadow-md ring-4 ring-slate-100' : ''
        } relative inline-flex flex-col items-center group`}
      >
        {/* Actual Scannable SVG QR Code */}
        <QRCodeSVG
          id={svgId}
          value={value}
          size={size}
          level="H"
          includeMargin={true}
          fgColor="#0f172a"
          bgColor="#ffffff"
          imageSettings={{
            src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%234f46e5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
            x: undefined,
            y: undefined,
            height: Math.floor(size * 0.2),
            width: Math.floor(size * 0.2),
            excavate: true,
          }}
        />

        {/* Quick Download Overlay / Action */}
        <button
          onClick={handleDownload}
          type="button"
          title="Download QR Code Pass"
          className="mt-2 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 opacity-90 group-hover:opacity-100 cursor-pointer"
        >
          <Download className="w-3 h-3 text-indigo-600" />
          <span>Save QR Code</span>
        </button>
      </div>

      {title && (
        <p className="text-xs font-extrabold text-slate-900 mt-2 flex items-center gap-1 justify-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>{title}</span>
        </p>
      )}

      {subtitle && (
        <p className="text-[10px] font-mono text-slate-500 mt-0.5 max-w-[200px] truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
};
