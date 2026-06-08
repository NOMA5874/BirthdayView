<template>
  <div class="app-wrapper">
    <!-- 🌟 全新升级：全局独立功能页眉 -->
    <header class="global-app-header">
      <h1 class="main-title">🍊新月同行 & 🪞扭曲仙境<wbr />全角色生日雷达</h1>
      <p class="app-description">
        你可以在此快速浏览查询《新月同行》和《扭曲仙境》的角色生日。
        全版块已针对《扭曲仙境》角色进行日本时区适配。<br />
        如需对数据进行补充纠错请通过<i>1304158431@qq.com</i>联系项目维护人员。
      </p>
    </header>

    <!-- 模式切换按钮（保持固定悬浮定位，位置已微调） -->
    <div class="theme-switcher">
      <button
        @click="toggleTheme"
        class="switch-btn"
        :title="isDark ? '切换到亮色模式' : '切换到暗色模式'"
      >
        {{ isDark ? "☀️ 亮色" : "🌙 暗色" }}
      </button>
    </div>

    <!-- 1. 顶部置顶雷达看板 -->
    <BirthdayDashboard :birthdayList="allBirthdays" />

    <!-- 2. 下方自适应网格生日名册 -->
    <BirthdayRoster :birthdayList="allBirthdays" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import BirthdayDashboard from "./components/BirthdayDashboard.vue";
import BirthdayRoster from "./components/BirthdayRoster.vue";
import { type RawBirthday } from "./birthdayService";

const allBirthdays = ref<RawBirthday[]>([]);
const isDark = ref(false);
const heartBeatTrigger = ref(0); // 🌟 核心：中央响应式心跳骨架

let timerId: number | null = null;

onMounted(async () => {
  try {
    // 1. 获取 Vite 自动注入的二级路径（此时它等于 "/BirthdayView/"）
    const baseUrl = import.meta.env.BASE_URL;

    // 2. 智能剔除边缘多余的斜杠，精准组装出线上静态 API 路径
    const jsonPath = `${baseUrl.endsWith("/") ? baseUrl : baseUrl + "/"}birthdays.json`;

    // 3. 发射请求（此时线上会精准访问: /BirthdayView/birthdays.json）
    const res = await fetch(jsonPath);
    if (!res.ok) throw new Error(`HTTP 状态码异常: ${res.status}`);

    allBirthdays.value = await res.json();
  } catch (e) {
    console.error("加载全局生日名册失败", e);
  }
});

// 别忘了在组件销毁时清理计时器，防止便携式 U 盘环境产生内存泄漏
onUnmounted(() => {
  if (timerId) clearInterval(timerId);
});

function toggleTheme() {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("app_theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("app_theme", "light");
  }
}
</script>

<style lang="scss">
*,
*::before,
*::after {
  box-sizing: border-box;
}

:root {
  --bg-app: #f1f3f5;
  --bg-card: #ffffff;
  --bg-item: #f8f9fa;
  --border-item: #edf2f7;
  --text-main: #2d3436;
  --text-muted: #b2bec3;
  --text-normal-gray: #718096;
}

[data-theme="dark"] {
  --bg-app: #121212;
  --bg-card: #1e1e1e;
  --bg-item: #2d2d2d;
  --border-item: #3d3d3d;
  --text-main: #f5f6fa;
  --text-muted: #718096;
  --text-normal-gray: #a4b0be;
}

body {
  background: var(--bg-app);
  margin: 0;
  padding: 20px 10px; // 调整上下间距，更具呼吸感
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  transition: background 0.3s ease;
}

.app-wrapper {
  width: 100%;
  max-width: 550px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

// 🌟 全新加入的全局介绍文案排版样式
.global-app-header {
  text-align: center;
  margin-bottom: 5px;
  padding: 0 10px;

  .main-title {
    margin: 0 0 10px 0;
    font-size: 1.65em;
    font-weight: 800;
    color: var(--text-main);
    letter-spacing: -0.5px;
    word-break: keep-all;
  }

  .app-description {
    margin: 0;
    font-size: 0.86em;
    line-height: 1.6;
    color: var(--text-normal-gray);
    text-align: justify; // 让中文字体左右对齐，更具杂志排版的高级感
  }
}

.theme-switcher {
  position: fixed;
  top: 15px;
  right: 20px;
  z-index: 999;

  .switch-btn {
    background: var(--bg-card);
    color: var(--text-main);
    border: 1px solid var(--border-item);
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.85em;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    }
  }
}
</style>
