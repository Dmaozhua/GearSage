# 主题切换动画组件 (theme-toggle)

基于原始 mode.js 创建的微信小程序主题切换动画组件，提供了类似星球大战塔图因星球的日夜切换动画效果。

## 功能特性

- 🌅 日夜主题切换动画
- 🎨 动态颜色变化
- ⭐ 星星出现动画
- 🚀 飞行器浮动效果
- 🔄 3D旋转过渡
- 📱 微信小程序原生组件

## 使用方法

### 1. 在页面JSON中引入组件

```json
{
  "usingComponents": {
    "theme-toggle": "/components/theme-toggle/theme-toggle"
  }
}
```

### 2. 在WXML中使用组件

```xml
<theme-toggle 
  isDarkMode="{{isDarkMode}}" 
  size="{{40}}"
  bind:themeToggle="onThemeToggle"
></theme-toggle>
```

### 3. 在JS中处理事件

```javascript
// 处理主题切换事件
onThemeToggle(e) {
  const isDarkMode = e.detail.isDarkMode;
  // 执行主题切换逻辑
  this.setData({ isDarkMode });
}
```

## 属性说明

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| isDarkMode | Boolean | false | 是否为夜间模式 |
| size | Number | 60 | 组件大小（rpx） |

## 事件说明

| 事件名 | 说明 | 参数 |
|--------|------|------|
| themeToggle | 主题切换事件 | {isDarkMode: Boolean} |

## 动画效果

1. **3D旋转**: 组件在主题切换时会执行180度旋转
2. **颜色过渡**: 所有元素颜色平滑过渡
3. **星星动画**: 夜间模式时星星依次出现
4. **飞行器浮动**: 持续的上下浮动效果

## 设计灵感

本组件基于原始的 mode.js 代码，该代码展示了星球大战塔图因星球的日夜切换场景，包含：
- 分层的地面
- 双太阳/月亮
- 星空效果
- 路行者飞行器

## 技术实现

- 使用微信小程序原生组件开发
- CSS3动画和过渡效果
- 响应式设计
- 事件驱动的状态管理

## 注意事项

1. 组件大小建议在 40-80rpx 之间
2. 动画执行期间会有短暂的状态锁定
3. 颜色计算基于简化的 lighten + invert 算法
4. 适配了微信小程序的事件系统