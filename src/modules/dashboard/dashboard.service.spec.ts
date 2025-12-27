import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../prisma.service';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';
import { BadRequestException } from '@nestjs/common';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
    },
  },
}));

jest.mock('streamifier', () => ({
  createReadStream: jest.fn(),
}));

const prismaMock = {
  user: {
    update: jest.fn(),
  },
};

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('should update profile without image', async () => {
      const userId = 'user-1';
      const payload = { name: 'New Name', target: 'UGM' };

      prismaMock.user.update.mockResolvedValue({
        id: userId,
        ...payload,
        email: 'test@test.com',
        image: null,
        updatedAt: new Date(),
      });

      const result = await service.updateProfile(userId, payload);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: payload,
        select: expect.any(Object),
      });
      expect(result.name).toBe('New Name');
      expect(result.target).toBe('UGM');
    });

    it('should upload image and update profile', async () => {
      const userId = 'user-1';
      const payload = { name: 'New Name' };
      const mockFile = {
        buffer: Buffer.from('fake-image'),
      } as Express.Multer.File;

      const mockUrl = 'https://cloudinary.com/image.jpg';

      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(null, { secure_url: mockUrl });
          return {}; // dummy stream
        },
      );

      // Mock Streamifier: Return object with pipe
      (streamifier.createReadStream as jest.Mock).mockReturnValue({
        pipe: jest.fn(),
      });

      prismaMock.user.update.mockResolvedValue({
        id: userId,
        name: payload.name,
        image: mockUrl,
        email: 'test@test.com',
        target: 'Bismillah Lolos UTBK 2029',
        updatedAt: new Date(),
      });

      const result = await service.updateProfile(userId, payload, mockFile);

      expect(cloudinary.uploader.upload_stream).toHaveBeenCalled();
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { ...payload, image: mockUrl },
        select: expect.any(Object),
      });
      expect(result.image).toBe(mockUrl);
    });

    it('should throw BadRequestException if upload fails', async () => {
      const userId = 'user-1';
      const payload = {};
      const mockFile = {
        buffer: Buffer.from('fake-image'),
      } as Express.Multer.File;

      // Mock Cloudinary: Simulate Error
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (options, callback) => {
          callback(new Error('Cloudinary Error'), null);
          return {};
        },
      );

      (streamifier.createReadStream as jest.Mock).mockReturnValue({
        pipe: jest.fn(),
      });

      await expect(
        service.updateProfile(userId, payload, mockFile),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
