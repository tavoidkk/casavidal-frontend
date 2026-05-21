import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Upload } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let scanner: Html5Qrcode;
    const startCamera = async () => {
      try {
        scanner = new Html5Qrcode('barcode-scanner');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            onScan(decodedText);
            onClose();
          },
          () => {}
        );
      } catch (err) {
        setError('No se pudo acceder a la cámara. Puedes subir una imagen.');
      }
    };
    startCamera();
    return () => {
      scanner?.stop().catch(() => {});
    };
  }, [onScan, onClose]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const scanner = new Html5Qrcode('barcode-scanner');
      const result = await scanner.scanFile(file, true);
      onScan(result);
      onClose();
    } catch {
      setError('No se pudo leer el código de la imagen.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-lift w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary-500" /> Escanear Código
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4">
          <div ref={containerRef} id="barcode-scanner" className="w-full aspect-square bg-gray-100 rounded-xl overflow-hidden" />
          {error && (
            <div className="mt-4">
              <p className="text-sm text-red-600 mb-3">{error}</p>
              <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 transition-colors">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">Subir imagen con código</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}
          {!error && scanning && (
            <p className="text-sm text-gray-500 text-center mt-3">Enfoca el código de barras o QR</p>
          )}
        </div>
      </div>
    </div>
  );
}
