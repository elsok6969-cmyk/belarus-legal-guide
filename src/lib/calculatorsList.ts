export interface CalcListItem {
  slug: string;
  title: string;
  description: string;
  emoji: string;
}

export const allCalculators: CalcListItem[] = [
  { slug: 'nds', title: 'Калькулятор НДС', description: 'Выделить или начислить НДС', emoji: '💰' },
  { slug: 'income-tax', title: 'Подоходный налог', description: 'Расчёт подоходного налога 13%', emoji: '📊' },
  { slug: 'tax-penalty', title: 'Пеня по налогам', description: 'Расчёт пени за просрочку', emoji: '⚠️' },
  { slug: 'vacation-pay', title: 'Расчёт отпускных', description: 'Средний заработок и отпускные', emoji: '🌴' },
  { slug: 'work-experience', title: 'Трудовой стаж', description: 'Подсчёт стажа по периодам', emoji: '💼' },
  { slug: 'alimony', title: 'Калькулятор алиментов', description: 'Расчёт алиментов на детей', emoji: '👨‍👧' },
  { slug: 'sick-leave', title: 'Больничный лист', description: 'Пособие по нетрудоспособности', emoji: '🏥' },
  { slug: 'business-trip', title: 'Командировочные', description: 'Суточные и аванс', emoji: '✈️' },
  { slug: 'rent', title: 'Арендная плата', description: 'Расчёт по базовой арендной величине', emoji: '🏢' },
  { slug: 'statute-of-limitations', title: 'Исковая давность', description: 'Проверка срока исковой давности', emoji: '⏳' },
];
