import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  instances: [] as any[],
  autoTableMock: vi.fn((doc: any) => {
    doc.lastAutoTable = { finalY: 95 };
  }),
}));

vi.mock('jspdf', () => {
  return {
    default: class JsPDFMock {
      internal = {
        pageSize: {
          getWidth: () => 210,
          getHeight: () => 297,
        },
      };
      lastAutoTable = { finalY: 90 };
      setFontSize = vi.fn();
      setFont = vi.fn();
      text = vi.fn();
      setDrawColor = vi.fn();
      setTextColor = vi.fn();
      line = vi.fn();
      save = vi.fn();
      constructor() {
        mocks.instances.push(this);
      }
    },
  };
});

vi.mock('jspdf-autotable', () => ({
  default: mocks.autoTableMock,
}));

import { generateInvoicePDF } from '../../../src/utils/generateInvoice';

function baseSale() {
  return {
    id: 's1',
    saleNumber: 'V-001',
    clientId: 'c1',
    client: {
      id: 'c1',
      clientType: 'NATURAL',
      firstName: 'Ana',
      lastName: 'Perez',
      phone: '0412',
    },
    sellerId: 'u1',
    seller: { id: 'u1', firstName: 'Luis', lastName: 'Diaz' },
    subtotal: 10,
    discount: 0,
    tax: 0,
    total: 10,
    paymentMethod: 'EFECTIVO',
    items: [
      {
        id: 'i1',
        productId: 'p1',
        product: { id: 'p1', name: 'Producto', sku: 'SKU', unit: 'unidad' },
        quantity: 1,
        unitPrice: 10,
        subtotal: 10,
      },
    ],
    createdAt: '2026-03-01T10:00:00.000Z',
  } as any;
}

describe('utils/generateInvoice', () => {
  beforeEach(() => {
    mocks.instances.length = 0;
    vi.clearAllMocks();
  });

  it('generates and saves PDF with expected filename', () => {
    const sale = baseSale();
    generateInvoicePDF(sale);

    expect(mocks.autoTableMock).toHaveBeenCalledTimes(1);
    expect(mocks.instances[0].save).toHaveBeenCalledWith('Factura-V-001.pdf');
  });

  it('renders juridico company name in client section', () => {
    const sale = baseSale();
    sale.client.clientType = 'JURIDICO';
    sale.client.companyName = 'Constructora ACME';
    sale.saleNumber = 'V-002';

    generateInvoicePDF(sale);

    const textCalls = mocks.instances[0].text.mock.calls.map((c: any[]) => c[0]);
    expect(textCalls.some((t: string) => t.includes('Nombre: Constructora ACME'))).toBe(true);
    expect(mocks.instances[0].save).toHaveBeenCalledWith('Factura-V-002.pdf');
  });
});
