module.exports = {
  data: {
    auditContent: [
      // 大标题
      {
        name: 'div',
        attrs: { class: 'main-title' },
        children: [{ type: 'text', text: '关于审核' }]
      },
      // 副标题
      {
        name: 'div',
        attrs: { class: 'subheading' },
        children: [{ type: 'text', text: '【关于审核：用严格守护时间的重量】' }]
      },
      { type: 'text', text: '\n\n' },
      
      // 引言
      {
        name: 'div',
        attrs: { class: 'intro' },
        children: [{ 
          type: 'text', 
          text: '为了让每篇分享都配得上 “2 年使用” 的硬核标签，论坛审核会带着 “放大镜” 较真' 
        }]
      },
      { type: 'text', text: '\n' },
      
      // 必交材料部分
      {
        name: 'div',
        attrs: { class: 'section-title' },
        children: [
          { name: 'b', children: [{ type: 'text', text: '必交材料：购买信息是时间的 “入场券”' }] }
        ]
      },
      {
        name: 'div',
        attrs: { class: 'section-content' },
        children: [{ 
          type: 'text', 
          text: '每篇装备分享帖，除了装备本身的细节展示，必须附上能证明购买时间的凭证（订单截图、购物记录、实体发票等均可）。我们会对凭证做双重核查：' 
        }]
      },
      {
        name: 'ul',
        attrs: { class: 'check-list' },
        children: [
          {
            name: 'li',
            children: [
              { name: 'b', children: [{ type: 'text', text: '时间线必须清晰：' }] },
              { type: 'text', text: '购买日期距发帖日满 2 年，精确到天' }
            ]
          },
          {
            name: 'li',
            children: [
              { name: 'b', children: [{ type: 'text', text: '信息要能对应：' }] },
              { type: 'text', text: '凭证上的装备型号、规格需与分享内容一致' }
            ]
          }
        ]
      },
      {
        name: 'div',
        attrs: { class: 'note' },
        children: [{ type: 'text', text: '（放心，所有隐私信息可打码处理，我们只聚焦 “购买时间” 这一核心）' }]
      },
      { type: 'text', text: '\n' },
      
      // 审核尺度部分
      {
        name: 'div',
        attrs: { class: 'section-title' },
        children: [
          { name: 'b', children: [{ type: 'text', text: '审核尺度：用细节验证 “真・长期使用”' }] }
        ]
      },
      {
        name: 'div',
        attrs: { class: 'section-content' },
        children: [{ type: 'text', text: '小程序作者会逐字逐句审核每篇帖子，重点盯这些 “时间证据”：' }]
      },
      {
        name: 'ul',
        attrs: { class: 'check-list' },
        children: [
          {
            name: 'li',
            children: [{ type: 'text', text: '内容里是否有长期使用的细节？比如 “第二年冬天发现轮座有点松动”“经过两个雨季，背包防水性依然在线”' }]
          },
          {
            name: 'li',
            children: [{ type: 'text', text: '会不会出现 “刚买时觉得”“用了几个月发现” 这类短期体验描述？' }]
          },
          {
            name: 'li',
            children: [{ type: 'text', text: '装备的磨损、保养痕迹是否与 2 年使用时长匹配？' }]
          }
        ]
      },
      { type: 'text', text: '\n' },
      
      // 审核结果部分
      {
        name: 'div',
        attrs: { class: 'section-title' },
        children: [
          { name: 'b', children: [{ type: 'text', text: '审核结果：透明且有温度' }] }
        ]
      },
      {
        name: 'ul',
        attrs: { class: 'result-list' },
        children: [
          {
            name: 'li',
            children: [
              { name: 'b', children: [{ type: 'text', text: '通过：' }] },
              { type: 'text', text: '只有同时满足 “购买时间达标 + 内容体现长期体验”，才会放行上线' }
            ]
          },
          {
            name: 'li',
            children: [
              { name: 'b', children: [{ type: 'text', text: '未通过：' }] },
              { type: 'text', text: '会明确告知原因（比如 “购买时间差 1 个月”“内容更像短期感受”），待补充完善后可重新提交' }
            ]
          }
        ]
      },
      { type: 'text', text: '\n' },
      
      // 结尾
      {
        name: 'div',
        attrs: { class: 'conclusion' },
        children: [{ 
          type: 'text', 
          text: '我们知道审核严格会让发帖多花点时间，但这正是为了让你刷到的每篇分享，都带着 “时间筛过的真实”—— 毕竟，热爱从不是一时的热闹，而是能陪伴每一次抛投的实在建议。' 
        }]
      }
    ]
  }
}