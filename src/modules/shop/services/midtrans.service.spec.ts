import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MidtransService } from './midtrans.service';

describe('MidtransService', () => {
  let service: MidtransService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MidtransService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                SERVER_KEY: 'test-server-key',
                CLIENT_KEY: 'test-client-key',
                MERCHANT_ID: 'test-merchant-id',
                NODE_ENV: 'development',
                QRIS_ID:
                  '00020101021126570014ID.LINKAJA.WWW0118936009153355276600021520090815335527660303UMI51440014ID.OR.Q-RIS.WWW0215ID10200211756470303UMI5204581253033605802ID5919JITU STORE TESTING6012KOTA JAKARTA61051211063042A25',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MidtransService>(MidtransService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateCRC16', () => {
    it('should calculate correct CRC16-CCITT checksum', () => {
      // QRIS/EMV uses CRC16-CCITT-FALSE: polynomial 0x1021, initial 0xFFFF.
      expect(service.calculateCRC16('123456789')).toBe('29B1');
    });

    it('should handle empty string', () => {
      expect(service.calculateCRC16('')).toBe('FFFF');
    });

    it('should produce consistent results for QRIS payload', () => {
      // Sample QRIS payload without CRC
      const payload =
        '00020101021126570014ID.LINKAJA.WWW0118936009153355276600021520090815335527660303UMI51440014ID.OR.Q-RIS.WWW0215ID10200211756470303UMI52045812530336054041000055020256020157035356304';
      const crc = service.calculateCRC16(payload);

      // CRC should be a 4-character uppercase hex string
      expect(crc).toMatch(/^[0-9A-F]{4}$/);

      // Same input should produce same output
      expect(service.calculateCRC16(payload)).toBe(crc);
    });
  });

  describe('generateQris', () => {
    it('should generate valid QRIS string with amount', () => {
      const qrisString = service.generateQris(10000);

      // QRIS should end with 4-character CRC
      expect(qrisString).toMatch(/[0-9A-F]{4}$/);

      // Should contain the amount tag (54xx)
      expect(qrisString).toContain('5405');
      expect(qrisString).toContain('10000');
    });

    it('should include transaction ID when provided', () => {
      const qrisString = service.generateQris(50000, 'TXN123');

      // Should contain tag 62 with transaction ID
      expect(qrisString).toContain('TXN123');
    });

    it('should truncate long transaction IDs', () => {
      const longId = 'VERY_LONG_TRANSACTION_ID_THAT_EXCEEDS_LIMIT';
      const qrisString = service.generateQris(10000, longId);

      // Transaction ID should be truncated to 20 chars
      expect(qrisString).toContain(longId.slice(0, 20));
      expect(qrisString).not.toContain(longId);
    });

    it('should throw error if QRIS_ID not configured', () => {
      // Create service with missing QRIS_ID
      const moduleRef = Test.createTestingModule({
        providers: [
          MidtransService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn(() => undefined),
            },
          },
        ],
      });

      moduleRef.compile().then((module) => {
        const svc = module.get<MidtransService>(MidtransService);
        expect(() => svc.generateQris(10000)).toThrow(
          'QRIS_ID belum dikonfigurasi',
        );
      });
    });
  });
});
