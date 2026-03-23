# SVG Loading 组件使用说明

## 概述

这是一个基于原生CSS动画实现的微信小程序loading组件，模拟了SVG旋转动画效果。组件具有良好的性能和兼容性。

## 功能特性

- ✅ 纯CSS动画实现，性能优秀
- ✅ 支持多种尺寸（small、default、large）
- ✅ 可自定义颜色和样式
- ✅ 支持显示/隐藏加载文本
- ✅ 可编程控制开始/停止动画
- ✅ 响应式设计，适配不同屏幕

## 基础用法

### 1. 在页面JSON中引入组件

```json
{
  "usingComponents": {
    "svg-loading": "/components/svg-loading/svg-loading"
  }
}
```

### 2. 在WXML中使用组件

```xml
<!-- 基础用法 -->
<svg-loading spinning="{{true}}" text="加载中..."></svg-loading>

<!-- 不显示文本 -->
<svg-loading spinning="{{true}}" show-text="{{false}}"></svg-loading>

<!-- 不同尺寸 -->
<svg-loading spinning="{{true}}" size="small" text="小尺寸"></svg-loading>
<svg-loading spinning="{{true}}" size="large" text="大尺寸"></svg-loading>
```

## 属性说明

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| spinning | Boolean | true | 是否显示加载动画 |
| text | String | '加载中...' | 加载文本内容 |
| showText | Boolean | true | 是否显示加载文本 |
| size | String | 'default' | 组件尺寸，可选值：small、default、large |
| customClass | String | '' | 自定义样式类名 |
| customStyle | String | '' | 自定义内联样式 |
| color | String | '#FF6700' | 加载器颜色（预留属性） |

## 方法说明

| 方法名 | 说明 | 参数 |
|--------|------|------|
| startLoading | 开始加载动画 | 无 |
| stopLoading | 停止加载动画 | 无 |

## 高级用法

### 1. 编程控制加载状态

```javascript
// 页面JS
Page({
  data: {
    isLoading: false
  },
  
  startLoad() {
    this.setData({ isLoading: true });
    
    // 模拟异步操作
    setTimeout(() => {
      this.setData({ isLoading: false });
    }, 3000);
  }
});
```

```xml
<!-- 页面WXML -->
<svg-loading spinning="{{isLoading}}" text="处理中..."></svg-loading>
<button bindtap="startLoad">开始加载</button>
```

### 2. 自定义样式

```xml
<svg-loading 
  spinning="{{true}}" 
  text="自定义样式" 
  custom-class="my-loading"
  custom-style="background: #f0f0f0; padding: 20rpx; border-radius: 10rpx;"
></svg-loading>
```

```css
/* 自定义样式 */
.my-loading {
  border: 2rpx dashed #FF6700;
}

.my-loading .circle-spinner {
  border-top-color: #FF6700;
}

.my-loading .loading-text {
  color: #FF6700;
  font-weight: bold;
}
```

## 演示页面

项目中包含了完整的演示页面：`pages/svg-loading-demo/svg-loading-demo`

可以通过以下方式访问：
1. 在微信开发者工具中打开项目
2. 在模拟器中访问 `/pages/svg-loading-demo/svg-loading-demo` 页面
3. 查看各种用法示例

## 注意事项

1. 组件使用CSS动画实现，在低端设备上可能存在性能问题
2. 建议在数据加载完成后及时停止动画，避免不必要的资源消耗
3. 自定义颜色功能需要配合CSS变量使用，部分旧版本微信可能不支持
4. 组件已适配暗黑模式，会根据系统主题自动调整颜色

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基础loading动画
- 支持多种尺寸和自定义样式
- 包含完整演示页面