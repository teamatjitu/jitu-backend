// src/modules/profile/dto/profile.dto.ts
export class ProfileStatsDto {
  basicInfo: {
    name: string;
    email: string;
    image: string | null;
    target: string;
    lastActive: string;
  };
  stats: {
    lastScore: number;
    personalBest: number;
    weeklyActivity: number;
    totalTryouts: number;
  };
  scoreHistory: {
    to: string; // Nama Tryout (misal: "TO 1")
    total: number;
    // Note: Karena skema DB saat ini belum menyimpan detail skor per subtest,
    // kita akan kirim total dulu. Nanti bisa diperluas.
    pu: number;
    ppu: number;
    pbm: number;
    pk: number;
    literasiIndo: number;
    literasiEng: number;
  }[];
}
