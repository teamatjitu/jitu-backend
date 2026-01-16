import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { CreatePackageDto, UpdatePackageDto } from '../dto/package.dto';

@Injectable()
export class AdminPackageService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllPackages() {
    return await this.prisma.tokenPackage.findMany({
      orderBy: { price: 'asc' },
      include: {
        _count: {
          select: { payments: true }
        }
      }
    });
  }

  async getPackageById(id: string) {
    const pkg = await this.prisma.tokenPackage.findUnique({
      where: { id }
    });
    if (!pkg) throw new NotFoundException('Paket tidak ditemukan');
    return pkg;
  }

  async createPackage(dto: CreatePackageDto) {
    return await this.prisma.tokenPackage.create({
      data: {
        name: dto.name,
        tokenAmount: dto.tokenAmount,
        price: dto.price,
        isActive: dto.isActive ?? true,
      }
    });
  }

  async updatePackage(id: string, dto: UpdatePackageDto) {
    const pkg = await this.prisma.tokenPackage.findUnique({ where: { id } });
    if (!pkg) throw new NotFoundException('Paket tidak ditemukan');

    return await this.prisma.tokenPackage.update({
      where: { id },
      data: dto
    });
  }

  async togglePackageStatus(id: string) {
    const pkg = await this.prisma.tokenPackage.findUnique({ where: { id } });
    if (!pkg) throw new NotFoundException('Paket tidak ditemukan');

    return await this.prisma.tokenPackage.update({
      where: { id },
      data: { isActive: !pkg.isActive }
    });
  }

  async deletePackage(id: string) {
    const pkg = await this.prisma.tokenPackage.findUnique({
      where: { id },
      include: { _count: { select: { payments: true } } }
    });

    if (!pkg) throw new NotFoundException('Paket tidak ditemukan');

    // JANGAN HAPUS jika sudah ada transaksi (Payment) terkait demi integritas data
    if (pkg._count.payments > 0) {
      throw new BadRequestException(
        'Tidak bisa menghapus paket yang sudah memiliki riwayat transaksi. Gunakan fitur Nonaktifkan saja.'
      );
    }

    return await this.prisma.tokenPackage.delete({
      where: { id }
    });
  }
}
