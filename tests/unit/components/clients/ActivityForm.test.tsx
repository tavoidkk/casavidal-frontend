import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ActivityForm } from '../../../../src/components/clients/ActivityForm';

describe('components/clients/ActivityForm', () => {
  it('renders form fields and buttons when open', () => {
    render(
      <ActivityForm
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        title="Nueva actividad CRM"
      />,
    );

    expect(screen.getByText('Nueva actividad CRM')).toBeInTheDocument();
    expect(screen.getByText('Título *')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar Actividad' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('allows typing and closing with cancel button', () => {
    const onClose = vi.fn();
    render(
      <ActivityForm
        isOpen={true}
        onClose={onClose}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        title="Actividad"
      />,
    );

    const titleInput = screen.getByPlaceholderText('Ej: Llamada de seguimiento') as HTMLInputElement;
    fireEvent.change(titleInput, { target: { value: 'Seguimiento post venta' } });
    expect(titleInput.value).toBe('Seguimiento post venta');

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('submits valid form and closes modal', async () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ActivityForm
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
        title="Actividad"
      />,
    );

    const titleInput = screen.getByPlaceholderText('Ej: Llamada de seguimiento');
    fireEvent.change(titleInput, { target: { value: 'Llamada inicial' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar Actividad' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onClose).toHaveBeenCalled();
  });
});
