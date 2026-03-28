import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from '../../../../src/components/ui/Modal';

describe('components/ui/Modal', () => {
  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Mi modal">
        <div>Contenido</div>
      </Modal>,
    );

    expect(screen.queryByText('Mi modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Contenido')).not.toBeInTheDocument();
  });

  it('renders content and triggers onClose from close button', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Mi modal">
        <div>Contenido modal</div>
      </Modal>,
    );

    expect(screen.getByText('Mi modal')).toBeInTheDocument();
    expect(screen.getByText('Contenido modal')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
