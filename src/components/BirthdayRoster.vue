<template>
  <div class="roster-container">
    <!-- 第一层：头部标题与计数 -->
    <div class="roster-header">
      <div class="header-left">
        <h3>👥 角色生日名册</h3>
        <span class="total-count"
          >已筛选出 {{ filteredRoster.length }} 位角色</span
        >
      </div>

      <!-- 时区独立筛选切换器 -->
      <div class="filter-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="tab-btn"
          :class="{ active: currentFilter === tab.value }"
          @click="currentFilter = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- 🌟 第二层：全新加入的搜索与排序工具栏 -->
    <div class="roster-toolbar">
      <!-- 搜索框 -->
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="🔍 输入名字实时搜索..."
          class="search-input"
        />
        <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn">
          ❌
        </button>
      </div>

      <!-- 排序按钮群 -->
      <div class="sort-group">
        <button
          v-for="mode in sortModes"
          :key="mode.value"
          class="sort-btn"
          :class="{ active: currentSortMode === mode.value }"
          @click="currentSortMode = mode.value"
        >
          {{ mode.label }}
        </button>
      </div>
    </div>

    <!-- 🌟 第三层：固定单列列表布局区域 -->
    <div class="roster-list">
      <div
        v-for="person in filteredRoster"
        :key="person.id"
        class="roster-card"
        :class="[
          person.timezone === 'Asia/Tokyo' ? 'theme-jp' : 'theme-cn',
          {
            'is-birthday-today': person.isToday,
            'is-urgent':
              !person.isToday &&
              person.daysRemaining <= 5 &&
              person.daysRemaining !== -999,
          },
        ]"
      >
        <!-- 头像区域 -->
        <div class="avatar-box">
          <img
            :src="getAvatarUrl(person.avatar)"
            :alt="person.name"
            class="avatar-img"
          />
          <span v-if="person.isToday" class="badge-today">TODAY</span>
        </div>

        <!-- 人物基本信息 -->
        <div class="profile-info">
          <h4 class="profile-name">
            {{ person.name }}
          </h4>
          <p class="profile-date">
            🎂
            <template v-if="person.month === 0 && person.day === 0"
              >未知</template
            >
            <template v-else>{{ person.month }}月{{ person.day }}日</template>
          </p>
        </div>

        <!-- 尾部：绝对倒计时指示 -->
        <div class="roster-countdown">
          <div v-if="person.daysRemaining === -999" class="magic-text">
            📌 特殊置顶
          </div>
          <div v-else-if="person.isToday" class="celebrate-text">
            🥳 正在过生日！
          </div>
          <div v-else class="wait-text">
            还有
            <strong class="days-highlight">{{ person.daysRemaining }}</strong>
            天
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredRoster.length === 0" class="empty-roster">
        没有找到匹配的角色信息
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  processBirthdayStatus,
  type RawBirthday,
  type OptimizedBirthday,
} from "../birthdayService";

const props = defineProps<{
  birthdayList: RawBirthday[];
}>();

// 1. 筛选状态
type FilterType = "all" | "Asia/Shanghai" | "Asia/Tokyo";
const currentFilter = ref<FilterType>("all");

const tabs = [
  { label: "全部", value: "all" },
  { label: "新月同行", value: "Asia/Shanghai" },
  { label: "扭曲仙境", value: "Asia/Tokyo" },
] as const;

// 🌟 2. 搜索状态
const searchQuery = ref("");

// 🌟 3. 排序模式状态
type SortModeType = "birthday" | "alpha" | "id";
const currentSortMode = ref<SortModeType>("birthday");

const sortModes = [
  { label: "📅 生日升序", value: "birthday" },
  { label: "🔤 首字母升序", value: "alpha" },
  { label: "🆔 ID升序", value: "id" },
] as const;

function getAvatarUrl(avatarName: string) {
  return new URL(`../assets/avatar/${avatarName}.webp`, import.meta.url).href;
}

/**
 * 🌟 升级版工业流水线：时区过滤 ➔ 名字模糊搜索 ➔ 条件动态排序
 */
const filteredRoster = computed<OptimizedBirthday[]>(() => {
  // 步骤一：预处理，计算每个人的实时倒计时和状态值
  const allProcessed = props.birthdayList.map((person) =>
    processBirthdayStatus(person),
  );

  // 步骤二：时区物理过滤
  let result = allProcessed.filter((person) => {
    if (currentFilter.value === "all") return true;
    return person.timezone === currentFilter.value;
  });

  // 步骤三：名字模糊搜索拦截（不区分大小写）
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    result = result.filter((person) =>
      person.name.toLowerCase().includes(query),
    );
  }

  // 步骤四：动态条件排序机制
  return result.sort((a, b) => {
    // ==========================================
    // 分流 A：只有在【按生日排序】模式下，特殊日期才需要置顶
    // ==========================================
    if (currentSortMode.value === "birthday") {
      // 1. 特殊魔幻日期 (-999) 无条件绝对第一置顶
      if (a.daysRemaining === -999 && b.daysRemaining !== -999) return -1;
      if (b.daysRemaining === -999 && a.daysRemaining !== -999) return 1;
      if (a.daysRemaining === -999 && b.daysRemaining === -999)
        return a.id - b.id;

      // 2. 今天过生日的人，排在特殊日期之后，普通日期前面
      if (a.isToday && !b.isToday) return -1;
      if (b.isToday && !a.isToday) return 1;

      // 3. 常规日期，按照剩余天数正常升序
      return a.daysRemaining - b.daysRemaining;
    }

    // ==========================================
    // 分流 B：按首字母或 ID 排序，所有人无特权，公平竞技
    // ==========================================
    if (currentSortMode.value === "alpha") {
      // 按名字首字母（zh-CN 拼音字典顺序）公平排序
      return a.name.localeCompare(b.name, "zh-CN");
    } else {
      // currentSortMode.value === 'id' -> 严格按原始登记的 ID 数字排序
      return a.id - b.id;
    }
  });
});
</script>

<style lang="scss" scoped>
$bg-card: var(--bg-card);
$bg-item: var(--bg-item);
$border-item: var(--border-item);
$text-main: var(--text-main);
$text-muted: var(--text-muted);
$text-gray: var(--text-normal-gray);

.roster-container {
  width: 100%; // 🌟 强行撑满父容器
  max-width: 100%; // 🌟 移除原本写死的 550px，改成 100%
  margin: 0; // 🌟 移除外边距干扰

  background: var(--bg-card);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: background 0.3s;

  .roster-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    border-bottom: 2px solid $border-item;
    padding-bottom: 12px;
    flex-wrap: wrap;
    gap: 12px;

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 4px;
      h3 {
        margin: 0;
        color: $text-main;
        font-size: 1.1em;
      }
      .total-count {
        font-size: 0.85em;
        color: $text-muted;
        font-weight: 500;
      }
    }

    .filter-tabs {
      display: flex;
      background: $bg-item;
      padding: 4px;
      border-radius: 8px;
      .tab-btn {
        border: none;
        background: transparent;
        padding: 6px 12px;
        font-size: 0.85em;
        font-weight: 600;
        color: $text-gray;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s;
        &:hover {
          color: #6c5ce7;
        }
        &.active {
          background: $bg-card;
          color: #6c5ce7;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }
      }
    }
  }

  // 🌟 新增：工具栏样式排版（搜索+排序按钮）
  .roster-toolbar {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 18px;

    .search-box {
      position: relative;
      width: 100%;

      .search-input {
        width: 100%;
        padding: 10px 35px 10px 12px;
        box-sizing: border-box;
        border: 1px solid $border-item;
        background: $bg-item;
        color: $text-main;
        border-radius: 8px;
        font-size: 0.9em;
        transition: all 0.2s;

        &:focus {
          border-color: #6c5ce7;
          background: $bg-card;
          outline: none;
          box-shadow: 0 0 8px rgba(108, 92, 231, 0.15);
        }
      }

      .clear-btn {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 0.8em;
        padding: 2px;
      }
    }

    .sort-group {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;

      .sort-btn {
        border: 1px solid $border-item;
        background: $bg-item;
        color: $text-main;
        padding: 8px 4px;
        border-radius: 6px;
        font-size: 0.78em;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          border-color: #6c5ce7;
          color: #6c5ce7;
        }
        &.active {
          background: #6c5ce7;
          border-color: #6c5ce7;
          color: white !important;
          box-shadow: 0 2px 6px rgba(108, 92, 231, 0.2);
        }
      }
    }
  }

  // 🌟 彻底重构：放弃 Grid 网格，改用纯垂直单列列表（List 架构）
  .roster-list {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .roster-card {
      display: flex;
      align-items: center;
      background: $bg-item;
      border-radius: 12px;
      padding: 12px 16px; // 拓宽列表两端间距
      border: 1px solid $border-item;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        transform: translateX(4px); // 列表布局 hover 时向右滑出微步，极具灵动感
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      }

      &.is-birthday-today {
        background: linear-gradient(
          135deg,
          rgba(#fff0f6, 0.6),
          rgba(#fff0f6, 1)
        );
      }

      .avatar-box {
        position: relative;
        width: 46px;
        height: 46px;
        margin-right: 14px;
        flex-shrink: 0;
        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
          border: 2px solid $bg-card;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        }
        .badge-today {
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          color: white;
          font-size: 0.55em;
          font-weight: bold;
          padding: 1px 4px;
          border-radius: 4px;
          white-space: nowrap;
        }
      }

      .profile-info {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        gap: 3px;
        .profile-name {
          margin: 0;
          font-size: 0.95em;
          color: $text-main;
          display: flex;
          align-items: center;
          gap: 6px;
          .zone-tag {
            font-size: 0.68em;
            padding: 1px 5px;
            border-radius: 4px;
            font-weight: normal;
          }
        }
        .profile-date {
          margin: 0;
          font-size: 0.78em;
          color: $text-gray;
        }
      }

      // 倒计时文本区域
      .roster-countdown {
        text-align: right;
        font-size: 0.8em;
        color: $text-gray;
        flex-shrink: 0;
        margin-left: 10px;

        .days-highlight {
          font-size: 1.15em;
          font-weight: bold;
        }

        .celebrate-text {
          font-weight: bold;
          font-size: 0.85em;
        }

        .magic-text {
          color: #74b9ff;
          font-weight: bold;
          font-size: 0.8em;
          background: $border-item;
          padding: 2px 6px;
          border-radius: 4px;
        }
      }

      // ==========================================
      // 🌟 独立时区主题微调（修复后清晰的嵌套层级）
      // ==========================================

      // ==========================================
      // 独立时区主题微调（完美重构为下边框高亮）
      // ==========================================

      // 🇨🇳 中国时区
      &.theme-cn {
        $theme-color: #ff9f43;

        // 🌟 平时未触发高亮时，头像自带 2px 的精致浅橙色呼吸防护圈
        .avatar-box .avatar-img {
          border-color: rgba($theme-color, 0.4) !important;
        }

        .days-highlight {
          color: #ee5a24;
        }
        .badge-today {
          background: #ee5a24;
        }

        // 🌟 核心修改：移除左边框，切换为更加吸睛的加粗下边框高亮
        &.is-urgent {
          border-bottom: 4px solid $theme-color; // 底部暖橙色条托举
          box-shadow: 0 4px 12px rgba($theme-color, 0.08); // 增加温和的底部投影
          border-bottom-left-radius: 12px; // 保持与卡片原本的圆角弧度完美贴合
          border-bottom-right-radius: 12px;
        }

        &.is-birthday-today {
          background: linear-gradient(135deg, $theme-color, #ff6b6b);
          border-color: transparent;
          .profile-name,
          .profile-date,
          .celebrate-text {
            color: white;
          }
          .zone-tag {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border-color: transparent;
          }
        }
      }

      // 🇯🇵 日本时区
      &.theme-jp {
        $theme-color: #9c88ff;

        // 🌟 平时未触发高亮时，头像自带 2px 的精致梦幻紫防护圈
        .avatar-box .avatar-img {
          border-color: rgba($theme-color, 0.4) !important;
        }

        .days-highlight {
          color: #6c5ce7;
        }
        .badge-today {
          background: #6c5ce7;
        }

        // 🌟 核心修改：移除左边框，切换为更加吸睛的加粗下边框高亮
        &.is-urgent {
          border-bottom: 4px solid $theme-color; // 底部梦幻紫条托举
          box-shadow: 0 4px 12px rgba($theme-color, 0.08); // 增加温和的底部投影
          border-bottom-left-radius: 12px; // 保持圆角贴合
          border-bottom-right-radius: 12px;
        }

        &.is-birthday-today {
          background: linear-gradient(135deg, $theme-color, #482ff7);
          border-color: transparent;
          .profile-name,
          .profile-date,
          .celebrate-text {
            color: white;
          }
          .zone-tag {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border-color: transparent;
          }
        }
      }
    } // <-- .roster-card 结束

    // 整个名册完全为空时的状态
    .empty-roster {
      text-align: center;
      color: $text-muted;
      padding: 40px 20px;
      font-size: 0.9em;
    }
  } // <-- .roster-list 结束
} // <-- .roster-container 结束
</style>
