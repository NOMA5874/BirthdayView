<template>
  <!-- 移除了原本的 header 块，保留纯净的数据核心 -->
  <div class="dashboard-container">
    <div class="dashboard-content">
      <!-- 置顶高亮：今日正在过生日的人 -->
      <div v-if="activeBirthdays.length > 0" class="active-banner">
        <h3>🎉 今日寿星 🎉</h3>
        <div class="active-grid">
          <div
            v-for="person in activeBirthdays"
            :key="person.id"
            class="active-card"
            :class="[
              person.timezone === 'Asia/Tokyo' ? 'theme-jp' : 'theme-cn',
              { 'is-expiring': person.isExpiring }, // 🌟 补上这行灵魂线！让 HTML 能够认出警报状态
            ]"
          >
            <div class="avatar-box">
              <img
                :src="getAvatarUrl(person.avatar)"
                :alt="person.name"
                class="avatar-img"
              />
              <span class="celebrate-icon">🥳</span>
            </div>
            <div class="active-info">
              <span class="active-name">{{ person.name }}</span>
              <span class="active-zone">
                <!-- 文本会自动无缝适配正常情况的“还剩 2时15分”，并在最后10分钟变为“🚨 极度紧迫！仅剩最后 2 分钟！” -->
                <template v-if="person.isExpiring">
                  🚨 极度紧迫！距离生日结束{{ person.countdownStr }}
                </template>
                <template v-else>
                  ⏱️ 距离生日结束还有{{ person.countdownStr }}
                </template>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 近期生日预告（双时区头名） -->
      <div class="upcoming-section">
        <h3>⏳ 次回生日预告</h3>
        <div class="card-list-dual">
          <div
            v-if="nextChinaBirthday"
            class="upcoming-card theme-cn"
            :class="{ 'is-urgent': nextChinaBirthday.daysRemaining <= 5 }"
          >
            <div class="card-left">
              <img
                :src="getAvatarUrl(nextChinaBirthday.avatar)"
                :alt="nextChinaBirthday.name"
                class="avatar-img-sm"
              />
              <div class="info">
                <span class="name">{{ nextChinaBirthday.name }}</span>
                <span class="date"
                  >🇨🇳 北京时区 · {{ nextChinaBirthday.month }}月{{
                    nextChinaBirthday.day
                  }}日</span
                >
              </div>
            </div>
            <div class="countdown">
              还有
              <strong class="days-num">{{
                nextChinaBirthday.daysRemaining
              }}</strong>
              天
            </div>
          </div>

          <div
            v-if="nextJapanBirthday"
            class="upcoming-card theme-jp"
            :class="{ 'is-urgent': nextJapanBirthday.daysRemaining <= 5 }"
          >
            <div class="card-left">
              <img
                :src="getAvatarUrl(nextJapanBirthday.avatar)"
                :alt="nextJapanBirthday.name"
                class="avatar-img-sm"
              />
              <div class="info">
                <span class="name">{{ nextJapanBirthday.name }}</span>
                <span class="date"
                  >🇯🇵 东京时区 · {{ nextJapanBirthday.month }}月{{
                    nextJapanBirthday.day
                  }}日</span
                >
              </div>
            </div>
            <div class="countdown">
              还有
              <strong class="days-num">{{
                nextJapanBirthday.daysRemaining
              }}</strong>
              天
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// --- 内部的 JS/TS 过滤与顺位继承逻辑保持完全不改动 ---
import { computed } from "vue";
import {
  processBirthdayStatus,
  type RawBirthday,
  type OptimizedBirthday,
} from "../birthdayService";

const props = defineProps<{
  birthdayList: RawBirthday[];
}>();

function getAvatarUrl(avatarName: string) {
  return new URL(`../assets/avatar/${avatarName}.webp`, import.meta.url).href;
}

const normalProcessedList = computed<OptimizedBirthday[]>(() => {
  return props.birthdayList
    .map((person) => processBirthdayStatus(person))
    .filter((person) => person.daysRemaining !== -999);
});

const activeBirthdays = computed(() => {
  return normalProcessedList.value.filter((p) => p.isToday);
});

const nextChinaBirthday = computed(() => {
  const cnList = normalProcessedList.value
    .filter((p) => p.timezone === "Asia/Shanghai" && !p.isToday)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
  return cnList[0] || null;
});

const nextJapanBirthday = computed(() => {
  const jpList = normalProcessedList.value
    .filter((p) => p.timezone === "Asia/Tokyo" && !p.isToday)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
  return jpList[0] || null;
});
</script>

<style lang="scss" scoped>
$text-dark: var(--text-main);
$text-muted: var(--text-muted);

.dashboard-container {
  width: 100%;
  max-width: 100%;
  margin: 0;
  background: var(--bg-card);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: background 0.3s;

  .dashboard-content {
    padding: 20px;

    // 今日寿星横幅区域
    .active-banner {
      background: var(--bg-item);
      border-radius: 12px;
      padding: 15px;
      margin-bottom: 20px;
      border: 1px solid var(--border-item);

      h3 {
        margin: 0 0 12px 0;
        color: #ff6b6b;
        text-align: center;
        font-size: 1em;
        font-weight: 700;
      }
      .active-grid {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .active-card {
        display: flex;
        align-items: center;
        padding: 14px; // 稍微加大内边距，更具呼吸感
        border-radius: 10px;
        border: 1px solid transparent;
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);

        .avatar-box {
          position: relative;
          width: 55px;
          height: 55px;
          margin-right: 15px;
          .avatar-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
            border: 2px solid var(--bg-card);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }
          .celebrate-icon {
            position: absolute;
            top: -6px;
            right: -6px;
            font-size: 1.3em;
          }
        }

        .active-info {
          .active-name {
            display: block;
            font-weight: bold;
            font-size: 1.1em;
            color: white;
          }
          .active-zone {
            font-size: 0.82em;
            color: rgba(255, 255, 255, 0.9);
            font-family: monospace, sans-serif;
            letter-spacing: 0.2px;
          }
        }

        // 默认状态下的双时区渐变色
        &.theme-cn {
          background: linear-gradient(135deg, #ff9f43, #ff6b6b);
        }
        &.theme-jp {
          background: linear-gradient(135deg, #9c88ff, #482ff7);
        }

        // ==========================================================
        // 🌟 全新重构：克制、优雅的 3分钟 临界微光柔和呼吸状态
        // 抛弃红黑轰炸，改用同色系浅粉红/暗红呼吸，完美融入全站
        // ==========================================================
        &.is-expiring {
          // 1. 亮色模式下的温和橙红渐变呼吸
          background: linear-gradient(135deg, #ff6b6b, #ee5a24) !important;
          border-color: rgba(#ff4d4f, 0.4) !important;
          box-shadow: 0 4px 15px rgba(#ff4d4f, 0.15) !important;
          animation: gentlePulseLight 3s infinite ease-in-out; // 放慢到 3 秒一次的舒适频率

          .active-name,
          .active-zone {
            color: #ffffff !important;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
            font-weight: 700 !important;
          }

          .avatar-box .avatar-img {
            border-color: #ff6b6b !important;
          }

          // 2. 完美的暗色模式无缝自适应：在黑色背景下转化为低调深沉的微光警报
          :root[data-theme="dark"] & {
            background: linear-gradient(
              135deg,
              #2d1f1f,
              #1e1e1e
            ) !important; // 深炭黑夹杂一丝暗红
            border-color: rgba(#ff4d4f, 0.5) !important;
            box-shadow: 0 4px 20px rgba(#ff4d4f, 0.2) !important;
            animation: gentlePulseDark 3s infinite ease-in-out;

            .active-name {
              color: #ff6b6b !important;
            } // 名字变成温和的亮红
            .active-zone {
              color: var(--text-normal-gray) !important;
            }
            .avatar-box .avatar-img {
              border-color: #3d3d3d !important;
            }
          }
        }
      }
    }

    // 各时区紧邻生日预告区域（保持不动）
    .upcoming-section {
      h3 {
        color: $text-dark;
        font-size: 1em;
        margin-bottom: 12px;
      }
      .card-list-dual {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .upcoming-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: var(--bg-item);
        border-radius: 10px;
        border: 1px solid var(--border-item);
        transition: all 0.2s;
        .card-left {
          display: flex;
          align-items: center;
          gap: 12px;
          .avatar-img-sm {
            width: 38px;
            height: 38px;
            object-fit: cover;
            border-radius: 50%;
            border: 1px solid var(--bg-card);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }
          .info {
            .name {
              display: block;
              font-weight: 600;
              color: $text-dark;
            }
            .date {
              font-size: 0.78em;
              color: var(--text-normal-gray);
            }
          }
        }
        .countdown {
          font-size: 0.85em;
          color: var(--text-normal-gray);
          font-family: monospace;
        }
        &.theme-cn {
          &.is-urgent {
            border-bottom: 4px solid #ff9f43;
            background: rgba(255, 159, 67, 0.05);
          }
        }
        &.theme-jp {
          &.is-urgent {
            border-bottom: 4px solid #9c88ff;
            background: rgba(156, 136, 255, 0.05);
          }
        }
      }
    }
  }
}

// ==========================================================
// 🌟 3. 精调动画（利用透明度/深浅度做渐变，告别大块纯色撞击）
// ==========================================================

// 亮色模式：饱满而柔和的极光粉橙呼吸
@keyframes gentlePulseLight {
  0% {
    opacity: 0.93;
  }
  50% {
    opacity: 1;
    filter: saturate(1.1);
  }
  100% {
    opacity: 0.93;
  }
}

// 暗色模式：神秘沉稳的暗夜火山微光浮现
@keyframes gentlePulseDark {
  0% {
    border-color: rgba(#ff4d4f, 0.2);
    box-shadow: 0 4px 15px rgba(#ff4d4f, 0.05);
  }
  50% {
    border-color: rgba(#ff4d4f, 0.6);
    box-shadow: 0 4px 25px rgba(#ff4d4f, 0.25);
    background: #3a2222 !important;
  }
  100% {
    border-color: rgba(#ff4d4f, 0.2);
    box-shadow: 0 4px 15px rgba(#ff4d4f, 0.05);
  }
}
</style>
