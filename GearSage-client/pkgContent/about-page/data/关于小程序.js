module.exports = {
  data: {
    // 带格式的文本节点数据（rich-text 可直接渲染）
    formattedContent: [
      {
        name: 'div',
        attrs: { class: 'title' },
            children: [{ type: 'text', text: '【关于本小程序：GearSage】' }]
      },
      { type: 'text', text: '\n\n' }, // 换行分隔

      {
        name: 'div',
        attrs: { class: 'subtitle' },
        children: [{ type: 'text', text: '小程序在做什么：' }]
      },
      {
        name: 'div',
        attrs: { class: 'content' },
        children: [{ type: 'text', text: '面向路亚钓友的装备资料查询、参数对比和装备经验交流工具' }]
      },
      { type: 'text', text: '\n\n' },

      {
        name: 'div',
        attrs: { class: 'subtitle' },
        children: [{ type: 'text', text: '小程序中有什么：' }]
      },
      {
        name: 'div',
        attrs: { class: 'content' },
        children: [{
          type: 'text',
          text: 'GearSage 聚焦路亚竿、轮、饵、线等装备资料、参数对比与长期使用经验，帮助钓友做更清楚的装备判断。'
        }]
      },
      { type: 'text', text: '\n\n' },

      {
        name: 'div',
        attrs: { class: 'subtitle' },
        children: [{ type: 'text', text: '经验交流的基本原则：' }]
      },
      {
        name: 'div',
        attrs: { class: 'content' },
        children: [{
          type: 'text',
          text: '鼓励长期、真实、可复核的装备经验。系统会对发布内容进行审核，审核通过后再公开展示。'
        }]
      },
      { type: 'text', text: '\n\n' },

      {
        name: 'div',
        attrs: { class: 'subtitle' },
        children: [{ type: 'text', text: '在这里，你可以：' }]
      },
      {
        name: 'ul',
        attrs: { class: 'list' },
        children: [
          {
            name: 'li',
            attrs: { class: 'list-item' },
            children: [{ type: 'text', text: '查询装备基础资料，查看关键参数；' }]
          },
          {
            name: 'li',
            attrs: { class: 'list-item' },
            children: [{ type: 'text', text: '对比同类装备，减少盲买；' }]
          },
          {
            name: 'li',
            attrs: { class: 'list-item' },
            children: [{ type: 'text', text: '发布或阅读真实使用经验与求推荐内容。' }]
          }
        ]
      },
      { type: 'text', text: '\n' },

      {
        name: 'div',
        attrs: { class: 'conclusion' },
        children: [{ type: 'text', text: 'GearSage 希望用可信资料和真实经验，帮助每一次装备选择更稳一点。' }]
      }
    ]
  }
}
