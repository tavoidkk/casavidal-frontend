import { useRef, useImperativeHandle, forwardRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { trimCanvas } from '../../utils/trimCanvas';

export interface SignaturePadHandle {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: (type?: string, encoderOptions?: number) => string;
  getCanvas: () => HTMLCanvasElement;
  getTrimmedCanvas: () => HTMLCanvasElement;
}

interface SignaturePadProps {
  onEnd?: () => void;
  penColor?: string;
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ onEnd, penColor = '#1e293b' }, ref) => {
    const sigRef = useRef<SignatureCanvas>(null);

    useImperativeHandle(ref, () => ({
      clear: () => sigRef.current?.clear(),
      isEmpty: () => sigRef.current?.isEmpty() ?? true,
      toDataURL: (type?: string, encoderOptions?: number) =>
        sigRef.current?.toDataURL(type, encoderOptions) ?? '',
      getCanvas: () => sigRef.current?.getCanvas() as HTMLCanvasElement,
      getTrimmedCanvas: () => {
        const canvas = sigRef.current?.getCanvas();
        if (!canvas) throw new Error('Canvas not available');
        return trimCanvas(canvas);
      },
    }));

    return (
      <SignatureCanvas
        ref={sigRef}
        penColor={penColor}
        onEnd={onEnd}
        clearOnResize={false}
        canvasProps={{
          className:
            'w-full h-36 border border-gray-300 rounded-lg bg-white cursor-crosshair touch-none',
          style: { width: '100%', height: '144px' },
        }}
      />
    );
  }
);

SignaturePad.displayName = 'SignaturePad';
