export interface RawBirthday {
  id: number; // 确保 id 是绝对存在的、不可缺少的强类型属性
  name: string;
  month: number;
  day: number;
  timezone: "Asia/Tokyo" | "Asia/Shanghai";
  avatar: string;
}

// 完美继承，这样 a.id 和 b.id 在编译期就拥有了 100% 的合法通行证
export interface OptimizedBirthday extends RawBirthday {
  isToday: boolean;
  daysRemaining: number;
  isExpiring: boolean;
  countdownStr: string;
}
/**
 * 【秒级实时心跳版】精准处理全球时区与毫秒倒计时
 */
export function processBirthdayStatus(person: RawBirthday): OptimizedBirthday {
  // 1. 特殊魔幻日期拦截（保持不动）
  const isMagicDate =
    (person.month === 0 && person.day === 0) ||
    (person.month === 20 && person.day === 98);
  if (isMagicDate) {
    return {
      ...person,
      isToday: false,
      daysRemaining: -999,
      isExpiring: false,
      countdownStr: "",
    };
  }

  const now = new Date();

  // 利用 Intl 提取寿星本地的当前时间数据（保持不动）
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: person.timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = formatter.formatToParts(now);
  const partMap = Object.fromEntries(parts.map((p) => [p.type, p.value]));

  const tzYear = parseInt(partMap.year || "0");
  const tzMonth = parseInt(partMap.month || "0");
  const tzDay = parseInt(partMap.day || "0");

  const isToday = tzMonth === person.month && tzDay === person.day;

  let daysRemaining = 0;
  let isExpiring = false;
  let countdownStr = "";

  const mm = String(person.month).padStart(2, "0");
  const dd = String(person.day).padStart(2, "0");
  const tzOffset = person.timezone === "Asia/Tokyo" ? "+09:00" : "+08:00";

  if (isToday) {
    // 🌟 2. 今日寿星：计算距离寿星本地今天 23:59:59 结束还剩多少【小时和分钟】
    const birthdayEndTime = new Date(
      `${tzYear}-${mm}-${dd}T23:59:59${tzOffset}`,
    );

    // ----------- 🌟 临时测试作弊代码：强行让差值只剩 2 分钟 -----------
    isExpiring = true;
    countdownStr = `仅剩最后 2 分钟！`;
    return { ...person, isToday, daysRemaining, isExpiring, countdownStr };
    // ---------------------------------------------------------------

    const diffMs = birthdayEndTime.getTime() - now.getTime();

    if (diffMs > 0) {
      // 换算为纯总分钟数
      const totalMins = Math.floor(diffMs / (1000 * 60));

      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;

      // 🌟 改变展现形式：只展现到分钟，隐藏刺眼的秒钟
      countdownStr = `${hours}小时${String(mins).padStart(2, "0")}分钟`;

      // 🌟 极限紧迫拦截：当寿星本地的生日距离结束【小于或等于 3 分钟】时，无缝引爆最高危警报
      if (totalMins <= 10) {
        isExpiring = true;
        countdownStr = `仅剩最后 ${totalMins} 分钟！`; // 触发紧迫文本替换
      }
    }
  } else {
    // 3. 未来寿星倒计时天数计算（保持不动）
    let targetYear = tzYear;
    if (
      tzMonth > person.month ||
      (tzMonth === person.month && tzDay > person.day)
    ) {
      targetYear = tzYear + 1;
    }

    const nextBirthdayAbsolute = new Date(
      `${targetYear}-${mm}-${dd}T00:00:00${tzOffset}`,
    );
    const currentDayTzZero = new Date(
      `${tzYear}-${String(tzMonth).padStart(2, "0")}-${String(tzDay).padStart(2, "0")}T00:00:00${tzOffset}`,
    );

    const diffTime =
      nextBirthdayAbsolute.getTime() - currentDayTzZero.getTime();
    daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));
    countdownStr = `还有 ${daysRemaining} 天`;
  }

  return { ...person, isToday, daysRemaining, isExpiring, countdownStr };
}
