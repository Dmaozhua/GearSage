# Text-Editor 组件说明

## 概述

`text-editor` 是一个可复用的文本编辑组件，专门为解决微信小程序中长文本编辑时的页面滚动显示问题而设计。该组件提供了预览模式和编辑模式的切换，确保在内容较长时页面仍能正常滚动。

## 功能特性

### 1. 双模式设计
- **预览模式**: 显示固定长度的文本预览，超出部分可展开/收起
- **编辑模式**: 提供全屏编辑界面，固定高度，避免页面滚动问题

### 2. 智能文本处理
- 自动截取预览文本
- 智能判断是否需要展开/收起按钮
- 字符计数显示
- 最大长度限制

### 3. 用户体验优化
- 平滑的模式切换动画
- 暗色模式支持
- 自动聚焦功能
- 取消/确认操作

### 4. 高度可配置
- 可自定义编辑器高度
- 可自定义预览文本长度
- 可自定义占位符文本
- 可自定义标题

## 组件属性

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| value | String | '' | 文本内容 |
| placeholder | String | '请输入内容...' | 占位符文本 |
| maxLength | Number | 1000 | 最大字符长度 |
| title | String | '编辑内容' | 编辑器标题 |
| editorHeight | Number | 600 | 编辑器高度(rpx) |
| previewMaxLength | Number | 100 | 预览模式最大字符数 |
| autoFocus | Boolean | true | 是否自动聚焦 |
| disabled | Boolean | false | 是否禁用 |

## 组件事件

| 事件名 | 说明 | 参数 |
|--------|------|------|
| change | 文本内容变化 | {value: string} |
| edit | 进入编辑模式 | - |
| cancel | 取消编辑 | - |
| confirm | 确认编辑 | {value: string} |

## 使用方法

### 1. 在页面配置中引入组件

```json
{
  "usingComponents": {
    "text-editor": "../../components/text-editor/text-editor"
  }
}
```

### 2. 在 WXML 中使用组件

```xml
<text-editor
  value="{{content}}"
  placeholder="请输入内容..."
  maxLength="{{500}}"
  title="编辑内容"
  editorHeight="{{600}}"
  previewMaxLength="{{100}}"
  bind:change="onContentChange"
/>
```

### 3. 在 JS 中处理事件

```javascript
Page({
  data: {
    content: ''
  },
  
  onContentChange(e) {
    this.setData({
      content: e.detail.value
    });
  }
});
```

## 组件方法

组件提供了以下公共方法，可通过 `this.selectComponent()` 调用：

| 方法名 | 说明 | 参数 | 返回值 |
|--------|------|------|--------|
| getValue() | 获取当前文本值 | - | string |
| setValue(value) | 设置文本值 | value: string | - |
| getEditingState() | 获取编辑状态 | - | boolean |
| exitEdit() | 退出编辑模式 | - | - |

## 样式定制

组件支持暗色模式，会自动根据全局主题设置调整样式。如需自定义样式，可以通过以下 CSS 类名进行覆盖：

```css
/* 容器样式 */
.text-editor-container {}

/* 预览模式样式 */
.preview-wrapper {}
.preview-content {}
.preview-text {}
.preview-placeholder {}

/* 编辑模式样式 */
.editor-wrapper {}
.editor-header {}
.editor-content {}
.editor-textarea {}

/* 暗色模式 */
.text-editor-container.dark {}
```

## 解决的问题

1. **页面滚动问题**: 原有的 `auto-height` 文本域在内容过长时会导致页面无法正常滚动
2. **用户体验问题**: 长文本编辑时界面混乱，用户难以操作
3. **代码复用问题**: 提供了统一的文本编辑解决方案，可在多个页面复用

## 集成示例

该组件已成功集成到 `publish-wechatcontent` 组件中，替换了原有的 `textarea` 元素：

```xml
<!-- 原有实现 -->
<textarea 
  class="wechat-content-textarea"
  auto-height
  placeholder="{{contentPlaceholder}}"
  value="{{formData.mainContent}}"
  bindinput="onContentInput"
  maxlength="{{maxContentLength}}"
/>

<!-- 新的实现 -->
<text-editor
  value="{{formData.mainContent}}"
  placeholder="{{contentPlaceholder}}"
  maxLength="{{maxContentLength}}"
  title="编辑内容"
  editorHeight="{{600}}"
  previewMaxLength="{{150}}"
  bind:change="onContentChange"
/>
```

## 测试页面

创建了专门的测试页面 `pages/text-editor-test/text-editor-test`，可以用来验证组件的各项功能。

## 注意事项

1. 组件依赖全局的主题管理系统，确保 `app.js` 中有相应的主题管理逻辑
2. 编辑模式下使用固定高度，避免页面布局问题
3. 组件会自动处理文本的截取和展开逻辑
4. 建议在使用前测试不同长度的文本内容，确保显示效果符合预期
5. 展开/收起按钮使用 `catchtap` 事件绑定，避免事件冒泡问题

## 已知问题及修复

### 问题1: TypeError: e.stopPropagation is not a function

**问题描述**: 在点击展开/收起按钮时出现 `e.stopPropagation is not a function` 错误。

**原因**: 微信小程序的事件对象不支持 `stopPropagation()` 方法。

**修复方案**:
1. 移除 JavaScript 中的 `e.stopPropagation()` 调用
2. 在 WXML 中使用 `catchtap` 替代 `bindtap` 来阻止事件冒泡

**修复代码**:
```xml
<!-- 修复前 -->
<view class="expand-btn" bindtap="onToggleExpand">展开</view>

<!-- 修复后 -->
<view class="expand-btn" catchtap="onToggleExpand">展开</view>
```

```javascript
// 修复前
onToggleExpand(e) {
  e.stopPropagation(); // 这会导致错误
  // ...
}

// 修复后
onToggleExpand(e) {
  // 使用 catchtap 自动阻止冒泡，无需手动调用
  // ...
}
```