import { useEffect, useRef } from 'react';
import { POSPanel } from './POSPanel';

interface SaleFormProps {
  onSaveComplete?: () => void;
  onHold?: () => void;
}

export function SaleForm({ onSaveComplete, onHold }: SaleFormProps) {
  const customerInputRef = useRef<HTMLInputElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/') {
        event.preventDefault();
        productInputRef.current?.focus();
      }
      if (event.key === 'F2') {
        event.preventDefault();
        customerInputRef.current?.focus();
      }
      if (event.key === 'Escape') {
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
      if (event.key === 'F8') {
        event.preventDefault();
        onSaveComplete?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSaveComplete]);

  return (
    <POSPanel
      customerInputRef={customerInputRef}
      productInputRef={productInputRef}
      onSaveComplete={onSaveComplete}
      onHold={onHold}
    />
  );
}
