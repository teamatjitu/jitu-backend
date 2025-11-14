export interface SubtestConfig {
  name: string;
  type: 'PU' | 'PPU' | 'PBM' | 'PK' | 'LBI' | 'LBE' | 'PM';
  kategori: 'TES_POTENSI_SKOLASTIK' | 'TES_LITERASI_BAHASA' | 'PENALARAN_MATEMATIKA';
  duration: number;
}

export const UTBK_SUBTEST_CONFIGS: SubtestConfig[] = [
  // Tes Potensi Skolastik
  {
    name: 'Penalaran Umum',
    type: 'PU',
    kategori: 'TES_POTENSI_SKOLASTIK',
    duration: 30,
  },
  {
    name: 'Pengetahuan dan Pemahaman Umum',
    type: 'PPU',
    kategori: 'TES_POTENSI_SKOLASTIK',
    duration: 25,
  },
  {
    name: 'Pemahaman Bacaan dan Menulis',
    type: 'PBM',
    kategori: 'TES_POTENSI_SKOLASTIK',
    duration: 25,
  },
  {
    name: 'Pengetahuan Kuantitatif',
    type: 'PK',
    kategori: 'TES_POTENSI_SKOLASTIK',
    duration: 30,
  },
  // Tes Literasi Bahasa
  {
    name: 'Literasi Bahasa Indonesia',
    type: 'LBI',
    kategori: 'TES_LITERASI_BAHASA',
    duration: 45,
  },
  {
    name: 'Literasi Bahasa Inggris',
    type: 'LBE',
    kategori: 'TES_LITERASI_BAHASA',
    duration: 45,
  },
  // Penalaran Matematika
  {
    name: 'Penalaran Matematika',
    type: 'PM',
    kategori: 'PENALARAN_MATEMATIKA',
    duration: 45,
  },
];
