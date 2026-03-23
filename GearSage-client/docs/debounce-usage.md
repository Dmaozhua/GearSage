# 防抖工具使用指南

本项目提供了完整的防抖解决方案，包括工具类、页面混入和组件，用于解决按钮连续点击和UI交互问题。

## 1. 防抖工具类 (debounceUtils.js)

### 基本用法

```javascript
const { debounce, isProcessing } = require('../../utils/debounceUtils.js');

// 简单防抖
await debounce('saveData', async () => {
  // 执行保存操作
  await api.saveData(data);
}, {
  loadingTitle: '保存中...',
  showLoading: true,
  maskLoading: true
});

// 检查操作状态
if (isProcessing('saveData')) {
  console.log('保存操作正在进行中');
}
```

### 高级配置

```javascript
await debounce('complexOperation', async () => {
  // 复杂操作
  const result = await performComplexOperation();
  return result;
}, {
  loadingTitle: '处理中...',
  showLoading: true,
  maskLoading: true,
  onStart: () => {
    console.log('操作开始');
  },
  onComplete: (result) => {
    console.log('操作完成:', result);
    wx.showToast({ title: '操作成功', icon: 'success' });
  },
  onError: (error) => {
    console.error('操作失败:', error);
    wx.showToast({ title: '操作失败', icon: 'none' });
  }
});
```

## 2. 页面混入 (debouncePageMixin)

### 在页面中使用

```javascript
const { debouncePageMixin } = require('../../utils/debounceUtils.js');

Page(Object.assign({}, debouncePageMixin, {
  data: Object.assign({}, debouncePageMixin.data, {
    // 页面数据
    userInfo: {},
    // 其他数据...
  }),

  // 使用防抖执行操作
  async onSave() {
    await this.executeWithDebounce('saveUserInfo', async () => {
      // 执行保存逻辑
      await this.saveUserInfo();
      return { success: true, message: '保存成功' };
    }, {
      loadingTitle: '保存中...',
      onComplete: (result) => {
        if (result.success) {
          wx.showToast({ title: result.message, icon: 'success' });
        }
      }
    });
  },

  // 检查防抖状态
  checkSaveStatus() {
    if (this.isDebounceProcessing('saveUserInfo')) {
      console.log('保存操作正在进行中');
    }
  }
}));
```

### WXML中使用防抖状态

```xml
<!-- 按钮状态控制 -->
<button 
  bindtap="onSave" 
  loading="{{_debounceStates.saveUserInfo}}"
  disabled="{{_debounceStates.saveUserInfo}}"
>
  {{_debounceStates.saveUserInfo ? '保存中...' : '保存'}}
</button>

<!-- 取消按钮也可以在操作进行时禁用 -->
<button 
  bindtap="onCancel" 
  disabled="{{_debounceStates.saveUserInfo}}"
>
  取消
</button>
```

## 3. 防抖按钮组件 (debounce-button)

### 组件注册

在页面的 `.json` 文件中注册组件：

```json
{
  "usingComponents": {
    "debounce-button": "/components/debounce-button/debounce-button"
  }
}
```

### 基本使用

```xml
<!-- 基本用法 -->
<debounce-button 
  text="保存"
  debounce-key="saveData"
  bind:tap="onSave"
/>

<!-- 自定义样式 -->
<debounce-button 
  text="提交订单"
  loading-text="提交中..."
  type="primary"
  size="default"
  debounce-key="submitOrder"
  loading-title="正在提交订单..."
  bind:tap="onSubmitOrder"
/>

<!-- 警告按钮 -->
<debounce-button 
  text="删除"
  loading-text="删除中..."
  type="warn"
  debounce-key="deleteItem"
  bind:tap="onDelete"
/>
```

### 组件属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| text | String | '确定' | 按钮文本 |
| loading-text | String | '处理中...' | 加载中的文本 |
| type | String | 'primary' | 按钮类型：primary/default/warn |
| size | String | 'default' | 按钮大小：default/mini |
| disabled | Boolean | false | 是否禁用 |
| debounce-key | String | '' | 防抖操作的唯一标识符 |
| loading-title | String | '处理中...' | 加载提示文字 |
| show-loading | Boolean | true | 是否显示加载动画 |
| mask-loading | Boolean | true | 是否启用蒙层 |
| custom-class | String | '' | 自定义样式类 |
| plain | Boolean | false | 是否为朴素按钮 |
| shape | String | 'square' | 按钮形状：square/round |

### 事件处理

```javascript
// 页面JS
Page({
  async onSave(e) {
    const { resolve, reject } = e.detail;
    
    try {
      // 执行保存逻辑
      await this.saveUserInfo();
      
      // 操作成功
      resolve({ success: true, message: '保存成功' });
      
      wx.showToast({ title: '保存成功', icon: 'success' });
    } catch (error) {
      // 操作失败
      reject(error);
      
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  }
});
```

## 4. 最佳实践

### 1. 操作标识符命名规范

```javascript
// 推荐的命名方式
'saveUserInfo'     // 保存用户信息
'submitOrder'      // 提交订单
'deleteItem'       // 删除项目
'uploadImage'      // 上传图片
'sendMessage'      // 发送消息
```

### 2. 错误处理

```javascript
await this.executeWithDebounce('saveData', async () => {
  // 业务逻辑
  const result = await api.saveData(data);
  
  // 验证结果
  if (!result.success) {
    throw new Error(result.message || '保存失败');
  }
  
  return result;
}, {
  onError: (error) => {
    // 自定义错误处理
    if (error.code === 'NETWORK_ERROR') {
      wx.showToast({ title: '网络错误，请检查网络连接', icon: 'none' });
    } else {
      wx.showToast({ title: error.message || '操作失败', icon: 'none' });
    }
  }
});
```

### 3. 页面卸载时的清理

```javascript
Page(Object.assign({}, debouncePageMixin, {
  // 页面卸载时会自动清理防抖状态
  onUnload() {
    // 如果有其他清理逻辑，在这里添加
    console.log('页面卸载，防抖状态已清理');
  }
}));
```

### 4. 多个操作的协调

```javascript
// 在一个操作进行时禁用其他操作
<button 
  bindtap="onSave" 
  disabled="{{_debounceStates.saveUserInfo || _debounceStates.deleteUserInfo}}"
>
  保存
</button>

<button 
  bindtap="onDelete" 
  disabled="{{_debounceStates.saveUserInfo || _debounceStates.deleteUserInfo}}"
>
  删除
</button>
```

## 5. 故障排除

### 常见问题

1. **防抖不生效**
   - 检查是否正确引入了防抖工具
   - 确认操作标识符是否唯一且一致
   - 验证是否正确使用了混入或组件

2. **页面状态不更新**
   - 确认在WXML中正确绑定了 `_debounceStates`
   - 检查是否正确混入了 `debouncePageMixin`

3. **组件事件不触发**
   - 确认组件已正确注册
   - 检查事件处理函数中的 resolve/reject 调用

### 调试技巧

```javascript
// 开启调试日志
console.log('[Debug] 当前防抖状态:', debounceManager.getProcessingOperations());

// 检查页面状态
console.log('[Debug] 页面防抖状态:', this.data._debounceStates);
```

## 6. 性能优化

- 防抖工具使用 Map 存储状态，性能优异
- 页面卸载时自动清理状态，避免内存泄漏
- 组件化设计，按需加载，不影响整体性能
- 支持多个操作并发，互不干扰