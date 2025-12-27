export class TryOutCardDto {
  id: string;
  title: string;
  number: string;
  canEdit: boolean;
  participants: number;
  badge: string;
}

export class SubjectDto {
  id: number;
  title: string;
  gradient: string;
  count: number;
}

export class TryoutDetailDto {
  id: number;
  title: string;
  number: string;
  badge: string;
  participants: number;
  description: string;
  duration: number;
  totalQuestions: number;
  startDate: string;
  endDate: string;
  isRegistered: boolean;
  isFree: boolean;
  tokenCost?: number;
  categories: {
    id: number;
    name: string;
    questionCount: number;
    duration: number;
    isCompleted: boolean;
  }[];
  benefits: string[];
  requirements: string[];
}

export class QuestionDto {
  id: number;
  questionText: string;
  options: string[];
  correctAnswer?: number;
  solution?: string;
}

export class SubtestExamDto {
  subtestId: number;
  subtestName: string;
  tryoutId: number;
  tryoutTitle: string;
  duration: number;
  questions: QuestionDto[];
}
