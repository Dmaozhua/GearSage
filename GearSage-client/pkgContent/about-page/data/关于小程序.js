module.exports = {
  data: {
    // 带格式的文本节点数据（rich-text 可直接渲染）
    formattedContent: [
      {
        name: 'div',
        attrs: { class: 'title' },
        children: [{ type: 'text', text: '【关于本小程序：钓友说】' }]
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
        children: [{ type: 'text', text: '专注路亚装备深度分享论坛小程序' }]
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
          text: '召集所有路亚玩家，专注于各类路亚装备的真实分享，涵盖路亚竿、轮和饵、线等消耗品，以及任何能提升钓鱼体验的物品都可以在这里找到交流。' 
        }]
      },
      { type: 'text', text: '\n\n' },
      
      {
        name: 'div',
        attrs: { class: 'subtitle' },
        children: [{ type: 'text', text: '论坛的硬核原则：' }]
      },
      {
        name: 'div',
        attrs: { class: 'content' },
        children: [{ 
          type: 'text', 
          text: '所有装备分享，发帖者必须是该装备的 “资深使用者”—— 使用时间满 2 年以上。这意味着你看到的每一份评价，都是经过长期实战检验的综合体验，杜绝一时兴起的片面之词。' 
        }]
      },
      { type: 'text', text: '\n\n' },
      
      {
        name: 'div',
        attrs: { class: 'subtitle' },
        children: [{ type: 'text', text: '在这儿，你可以尽情分享：' }]
      },
      {
        name: 'ul',
        attrs: { class: 'list' },
        children: [
          {
            name: 'li',
            attrs: { class: 'list-item' },
            children: [{ type: 'text', text: '心仪装备的独特亮点，让更多人发现它的魅力；' }]
          },
          {
            name: 'li',
            attrs: { class: 'list-item' },
            children: [{ type: 'text', text: '实用装备的使用心得，用亲身经验为钓友们指路推荐；' }]
          },
          {
            name: 'li',
            attrs: { class: 'list-item' },
            children: [{ type: 'text', text: '那些不为人知的小众好物，让好装备不再被埋没。' }]
          }
        ]
      },
      { type: 'text', text: '\n' },
      
      {
        name: 'div',
        attrs: { class: 'conclusion' },
        children: [{ type: 'text', text: '快来加入我们，一起在真实的装备体验分享中，让路亚之路获得最好的体验！' }]
      }
    ]
  }
}