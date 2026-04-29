import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', interactive = false }) => {
  return (
    <motion.div
      className={`bg-white rounded-2xl shadow-card border border-gray-100 p-6 ${interactive ? 'cursor-pointer' : ''} ${className}`}
      whileHover={interactive ? { y: -2, boxShadow: '0 12px 28px rgba(15, 23, 42, 0.14)' } : undefined}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};
