import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  placeholder?: string;
  allowPattern?: RegExp;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', onChange, allowPattern, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (allowPattern || e.target.type === 'tel') {
        const cursor = e.target.selectionStart;
        let sanitized = e.target.value;

        if (e.target.type === 'tel') {
          sanitized = sanitized.replace(/[^0-9+\-() ]/g, '');
        }
        if (allowPattern) {
          sanitized = sanitized.split('').filter((c) => allowPattern.test(c)).join('');
        }

        if (sanitized !== e.target.value) {
          e.target.value = sanitized;
          try { e.target.setSelectionRange(cursor, cursor); } catch {}
        }
      }

      onChange?.(e);
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 border rounded-xl text-gray-900 placeholder-gray-400 bg-white
            focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400
            disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors
            ${error ? 'border-red-400' : 'border-gray-200'}
            ${className}
          `}
          onChange={handleChange}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
