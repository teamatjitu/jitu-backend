export class StatCardDto {
  label: string;
  value: string;
  color?: string;
  bgColor?: string;
  suffix?: string;
}

export class ScoreDataDto {
  to: string;
  total: number;
  pu: number;
  ppu: number;
  pbm: number;
  pk: number;
  literasiIndo: number;
  literasiEng: number;
}

export class SubtestDto {
  id: string;
  label: string;
  color: string;
  hoverColor: string;
}

export class MenuItemDto {
  label: string;
  description: string;
  color?: string;
  bgColor?: string;
  action?: string;
  items?: {
    label: string;
    description?: string;
    toggle?: boolean;
    link?: boolean;
  }[];
}

export class DashboardDataDto {
  stats: StatCardDto[];
  scoreHistory: ScoreDataDto[];
  subtests: SubtestDto[];
  menuItems: MenuItemDto[];
}
