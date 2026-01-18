import { Test, TestingModule } from '@nestjs/testing';
import { ShopService } from './shop.service';
import { PrismaService } from '../../prisma.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';

// --- MOCK CONSTANTS ---
const MOCK_USER_ID = 'user-123';
const MOCK_TX_ID = 'tx-abc-123';
const MOCK_QRIS_STATIC =
  '00020101021126570014ID.LINKAJA.WWW0118936009153355276600021520090815335527660303UMI51440014ID.OR.Q-RIS.WWW0215ID10200211756470303UMI5204581253033605802ID5919JITU STORE TESTING6012KOTA JAKARTA61051211063042A25';

describe('ShopService', () => {
  let service: ShopService;
  let prismaService: PrismaService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopService,
        {
          provide: PrismaService,
          useValue: {
            tokenTransaction: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            user: {
              update: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(MOCK_QRIS_STATIC),
          },
        },
      ],
    }).compile();

    service = module.get<ShopService>(ShopService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTokenTransaction', () => {
    it('should create a transaction and return dynamic QRIS', async () => {
      // Mock data transaksi yang dibuat
      const mockTx = {
        id: MOCK_TX_ID,
        userId: MOCK_USER_ID,
        amount: 10,
        type: 'UNPAID',
        createdAt: new Date(),
      };

      jest
        .spyOn(prismaService.tokenTransaction, 'create')
        .mockResolvedValue(mockTx as any);

      // Panggil fungsi (Paket 1: Rp 99.000)
      const result = await service.createTokenTransaction(MOCK_USER_ID, 1);

      // Verifikasi:
      expect(prismaService.tokenTransaction.create).toHaveBeenCalledWith({
        data: {
          amount: 10,
          userId: MOCK_USER_ID,
          type: 'UNPAID',
        },
      });

      // Pastikan QRIS mengandung nominal (Tag 54) -> 99000 (panjang 5) -> "540599000"
      expect(result.qris).toContain('540599000');

      // Pastikan QRIS mengandung Transaction ID (Tag 62) -> ID: tx-abc-123 (panjang 10) -> "6210tx-abc-123"
      expect(result.qris).toContain(`6210${MOCK_TX_ID}`);

      // Pastikan Point of Initiation berubah jadi 12 (Dynamic)
      expect(result.qris).toContain('010212');

      expect(result.totalPrice).toBe(99000);
    });

    it('should throw BadRequestException if package is invalid', async () => {
      await expect(
        service.createTokenTransaction(MOCK_USER_ID, 99 as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('setPaid', () => {
    it('should update transaction status and increment user token', async () => {
      const mockUnpaidTx = {
        id: MOCK_TX_ID,
        userId: MOCK_USER_ID,
        amount: 10,
        type: 'UNPAID',
      };

      const mockPaidTx = { ...mockUnpaidTx, type: 'PAID' };

      jest
        .spyOn(prismaService.tokenTransaction, 'findUnique')
        .mockResolvedValue(mockUnpaidTx as any);
      jest
        .spyOn(prismaService.tokenTransaction, 'update')
        .mockResolvedValue(mockPaidTx as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);

      const result = await service.setPaid(MOCK_TX_ID);

      // 1. Cek Transaksi diupdate jadi PAID
      expect(prismaService.tokenTransaction.update).toHaveBeenCalledWith({
        where: { id: MOCK_TX_ID },
        data: { type: 'PAID' },
      });

      // 2. Cek Saldo User ditambah
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: MOCK_USER_ID },
        data: {
          tokenBalance: { increment: 10 },
        },
      });

      expect(result.type).toBe('PAID');
    });

    it('should return immediately if already PAID (Idempotency)', async () => {
      const mockPaidTx = {
        id: MOCK_TX_ID,
        userId: MOCK_USER_ID,
        type: 'PAID',
      };

      jest
        .spyOn(prismaService.tokenTransaction, 'findUnique')
        .mockResolvedValue(mockPaidTx as any);

      const result = await service.setPaid(MOCK_TX_ID);

      // Tidak boleh update database lagi
      expect(prismaService.tokenTransaction.update).not.toHaveBeenCalled();
      expect(prismaService.user.update).not.toHaveBeenCalled();
      expect(result).toEqual(mockPaidTx);
    });

    it('should throw error if transaction not found', async () => {
      jest
        .spyOn(prismaService.tokenTransaction, 'findUnique')
        .mockResolvedValue(null);

      await expect(service.setPaid('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateQrisAmount (Unit Logic)', () => {
    it('should generate valid QRIS with correct CRC16', () => {
      // Kita test logic internalnya saja
      const nominal = 10000;
      const txId = 'TEST1234';

      const qris = service.updateQrisAmount(nominal, txId);

      // Format Tag 54: 54 + 05 + 10000 -> 540510000
      expect(qris).toContain('540510000');

      // Format Tag 62: 62 + 08 + TEST1234 -> 6208TEST1234
      expect(qris).toContain('6208TEST1234');

      // Pastikan diakhiri dengan CRC (4 digit hex)
      expect(qris).toMatch(/[0-9A-F]{4}$/);
    });
  });
});
