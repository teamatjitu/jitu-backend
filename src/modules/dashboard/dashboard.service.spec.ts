import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../prisma.service';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';
import { BadRequestException } from '@nestjs/common';
// Gunakan path relatif ke generated prisma client
import { TryoutStatus } from '../../../generated/prisma/enums';

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
  tryOutAttempt: {
    findFirst: jest.fn(),
    aggregate: jest.fn(),
    count: jest.fn(),
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

  describe('getUserStats', () => {
    it('should return correct calculated stats when user has activity', async () => {
      const userId = 'user-active';

      // 1. Mock: User punya attempt terakhir dengan skor 750
      prismaMock.tryOutAttempt.findFirst.mockResolvedValue({ totalScore: 750 });

      // 2. Mock: Personal Best user adalah 800
      prismaMock.tryOutAttempt.aggregate.mockResolvedValue({
        _max: { totalScore: 800 },
      });

      // 3. Mock: Weekly Activity (count pertama) = 3
      // 4. Mock: Total Finished (count kedua) = 5
      prismaMock.tryOutAttempt.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(5);

      const result = await service.getUserStats(userId);

      expect(result).toEqual({
        lastScore: 750,
        personalBest: 800,
        weeklyActivity: 3,
        totalFinished: 5,
      });

      expect(prismaMock.tryOutAttempt.findFirst).toHaveBeenCalledWith({
        where: { userId, status: TryoutStatus.FINISHED },
        orderBy: { finishedAt: 'desc' },
        select: { totalScore: true },
      });

      expect(prismaMock.tryOutAttempt.aggregate).toHaveBeenCalledWith({
        where: { userId, status: TryoutStatus.FINISHED },
        _max: { totalScore: true },
      });
    });

    it('should return zero stats for new user', async () => {
      const userId = 'user-new';

      prismaMock.tryOutAttempt.findFirst.mockResolvedValue(null);
      prismaMock.tryOutAttempt.aggregate.mockResolvedValue({
        _max: { totalScore: null },
      });
      prismaMock.tryOutAttempt.count.mockResolvedValue(0);

      const result = await service.getUserStats(userId);

      expect(result).toEqual({
        lastScore: 0,
        personalBest: 0,
        weeklyActivity: 0,
        totalFinished: 0,
      });
    });
  });
});
