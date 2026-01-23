import { IsNotEmpty, IsString } from 'class-validator';

export class SubmitDailyAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  @IsNotEmpty()
  answer: string; // The ID of the selected option
}

export class DailyQuestionResponseDto {
  alreadyAnswered: boolean;
  isCorrect?: boolean;
  userAnswer?: string; // Menyimpan jawaban user (ID option atau teks essai)
  question: {
    id: string;
    type: string;
    content: string | null;
    imageUrl: string | null;
    narration: string | null;
    options: Array<{
      id: string;
      content: string | null;
      order: number;
    }>;
  };
}

export class DailyStreakResponseDto {
  currentStreak: number;
  bestStreak: number;
  totalProblemsSolved: number;
}

export class DailyAnswerResponseDto {
  success: boolean;
  message?: string;
  isCorrect?: boolean;
  newStreak?: number;
  explanation?: string;
}
