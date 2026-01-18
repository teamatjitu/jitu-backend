export class TryoutHistoryDto {
  id: number;
  title: string;
  date: string;
  score: number;
  maxScore: number;
  duration: string;
  questionsAnswered: number;
  totalQuestions: number;
  category: string;
  status: string;
  breakdown: {
    pu: number;
    ppu: number;
    pbm: number;
    pk: number;
    literasiIndo: number;
    literasiEng: number;
  };
}
