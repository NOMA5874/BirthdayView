export interface CalendarCell {
  date: Date; // 该格子的完整日期对象
  dayNumber: number; // 界面显示的数字（1~31）
  isCurrentMonth: boolean; // 是否属于当前查看的月份
  isToday: boolean; // 是否是宿主机的今天
}

/**
 * 纯手写算法：生成指定年月对应的 6x7 (42天) 日历网格
 * 规则：第一列为星期一
 */
export function generateCalendarGrid(
  year: number,
  month: number,
): CalendarCell[] {
  const cells: CalendarCell[] = [];

  // 1. 获取当前月份的第一天和总天数
  // 注意：JavaScript的月份是从 0 开始的 (0 = 1月, 11 = 12月)
  const firstDayOfMonth = new Date(year, month, 1);

  // 2. 核心数学修正：计算当月第一天前面需要补多少天“上月尾巴”
  // 原生 getDay(): 0(日), 1(一), 2(二)...
  // 我们要的排位: 0(一), 1(二)... 6(日)
  let startOffset = firstDayOfMonth.getDay() - 1;
  if (startOffset === -1) startOffset = 6; // 如果第一天是周日，前面需要补 6 天

  // 3. 找出大网格中“第一个格子”对应的绝对日期
  // 将当前月1号往前推 startOffset 天，就是网格起点
  const gridStartDate = new Date(firstDayOfMonth);
  gridStartDate.setDate(firstDayOfMonth.getDate() - startOffset);

  // 4. 连续循环 42 次，生成 6x7 网格
  const now = new Date();
  const todayString = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

  for (let i = 0; i < 42; i++) {
    const currentGridDate = new Date(gridStartDate);
    currentGridDate.setDate(gridStartDate.getDate() + i);

    const cellString = `${currentGridDate.getFullYear()}-${currentGridDate.getMonth()}-${currentGridDate.getDate()}`;

    cells.push({
      date: currentGridDate,
      dayNumber: currentGridDate.getDate(),
      isCurrentMonth: currentGridDate.getMonth() === month,
      isToday: cellString === todayString, // 判断是否是现实中的今天
    });
  }

  return cells;
}
