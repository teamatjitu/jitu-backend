import { IsNotEmpty, IsString } from 'class-validator';

export class UserStatsDto {
  tokenBalance: number;
  lastScore: number;
  personalBest: number;
  weeklyActivity: number;
  completedTryouts: number;
  currentStreak: number;
}

export class ActiveTryoutDto {
  id: string;
  title: string;
  code: number;
  batch: string;
  participants: number;
  progress: number;
  totalSubtests: number;
  endDate: Date | null;
}

export class OngoingTryoutDto {
  id: string;
  title: string;
  description: string | null;
  solutionPrice: number;
  isPublic: boolean;
  scheduledStart: Date | null;
  createdAt: Date;
  participants: number;
  isRegistered: boolean;
}

export class AvailableTryoutDto {
  id: string;
  title: string;
  description: string | null;
  solutionPrice: number;
  isPublic: boolean;
  scheduledStart: Date | null;
  createdAt: Date;
  participants: number;
}

export class ScoreHistoryDto {
  to: string;
  tryOutTitle: string;
  total: number;
  pu: number;
  ppu: number;
  pbm: number;
  pk: number;
  literasiIndo: number;
  literasiEng: number;
}
