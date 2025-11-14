export interface SubtestConfig {
  name: string;
  type: 'PU' | 'PPU' | 'PBM' | 'PK' | 'LBI' | 'LBE' | 'PM';
  kategori:
    | 'TES_POTENSI_SKOLASTIK'
    | 'TES_LITERASI_BAHASA'
    | 'PENALARAN_MATEMATIKA';
  duration: number;
  defaultQuestionCount: number; // Default number of questions
}

export const UTBK_SUBTEST_CONFIGS: SubtestConfig[] = [
  // Tes Potensi Skolastik
  {
    name: 'Penalaran Umum',
    type: 'PU',
    kategori: 'TES_POTENSI_SKOLASTIK',
    duration: 30,
    defaultQuestionCount: 20,
  },
  {
    name: 'Pengetahuan dan Pemahaman Umum',
    type: 'PPU',
    kategori: 'TES_POTENSI_SKOLASTIK',
    duration: 25,
    defaultQuestionCount: 20,
  },
  {
    name: 'Pemahaman Bacaan dan Menulis',
    type: 'PBM',
    kategori: 'TES_POTENSI_SKOLASTIK',
    duration: 25,
    defaultQuestionCount: 20,
  },
  {
    name: 'Pengetahuan Kuantitatif',
    type: 'PK',
    kategori: 'TES_POTENSI_SKOLASTIK',
    duration: 30,
    defaultQuestionCount: 20,
  },
  // Tes Literasi Bahasa
  {
    name: 'Literasi Bahasa Indonesia',
    type: 'LBI',
    kategori: 'TES_LITERASI_BAHASA',
    duration: 45,
    defaultQuestionCount: 30,
  },
  {
    name: 'Literasi Bahasa Inggris',
    type: 'LBE',
    kategori: 'TES_LITERASI_BAHASA',
    duration: 45,
    defaultQuestionCount: 30,
  },
  // Penalaran Matematika
  {
    name: 'Penalaran Matematika',
    type: 'PM',
    kategori: 'PENALARAN_MATEMATIKA',
    duration: 45,
    defaultQuestionCount: 20,
  },
];

// Helper function to get config by type
export function getSubtestConfigByType(
  type: string,
): SubtestConfig | undefined {
  return UTBK_SUBTEST_CONFIGS.find((config) => config.type === type);
}
