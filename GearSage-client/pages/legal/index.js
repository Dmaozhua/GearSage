const { PRODUCT_ABOUT_ENTRY } = require('../../constants/product-about.js');

const CONTACT = {
  email: 'support@gearsage.example',
  wechat: 'GearSageSupport',
  officialAccount: 'GearSage路亚装备指南'
};

const UPDATED_AT = '2026年05月13日';

const LEGAL_CONTENT = {
  privacy: {
    title: '隐私政策',
    sections: [
      {
        title: '我们收集的信息',
        paragraphs: [
          '为了提供登录、发布、评论、举报、资料展示和内容审核服务，GearSage 会在必要范围内收集和处理你的信息。'
        ],
        items: [
          '账号信息：手机号、登录状态、用户 ID、昵称、头像、个人简介、背景图。',
          '内容信息：你发布的帖子、评论、图片、举报理由、申诉说明及相关时间记录。',
          '互动信息：点赞、评论、采纳、消息通知、举报处理结果等使用记录。',
          '设备与运行信息：为保障安全和排查问题，可能记录必要的请求时间、接口路径、错误信息和基础设备环境。'
        ]
      },
      {
        title: '为什么收集这些信息',
        items: [
          '用于完成账号登录、身份识别和基础安全校验。',
          '用于展示你的公开资料、发布内容和互动记录。',
          '用于内容安全审核、举报处理、违规处置和审核留痕。',
          '用于修复故障、提升服务稳定性，并防止恶意刷量、垃圾内容和违规使用。'
        ]
      },
      {
        title: '我们如何使用和保存',
        paragraphs: [
          '我们仅在实现 GearSage 产品功能、履行平台治理责任和满足法律法规要求所必需的范围内使用信息。',
          '账号、内容、举报和审核记录会保存在 GearSage 使用的服务器和数据库中，并采取访问控制、日志留存和必要的安全防护。未经你同意，我们不会将个人信息用于与 GearSage 服务无关的商业用途。'
        ]
      },
      {
        title: '信息删除与账号注销',
        paragraphs: [
          '你可以通过“账号注销说明”了解注销申请方式。完成身份核验后，我们会在合理期限内删除或匿名化不再需要保留的个人信息。',
          '因法律法规、内容审核、纠纷处理或安全留痕需要保留的记录，将在必要期限内继续保存，并限制使用范围。'
        ]
      },
      {
        title: '联系我们',
        items: [
          `联系邮箱：${CONTACT.email}`,
          `客服微信：${CONTACT.wechat}`,
          `公众号：${CONTACT.officialAccount}`
        ]
      }
    ]
  },
  agreement: {
    title: '用户协议',
    sections: [
      {
        title: '账号使用规则',
        items: [
          '你应使用真实、有效、可接收验证码的手机号注册和登录。',
          '不得冒用他人身份、盗用他人账号，或以自动化方式批量注册、登录、发布内容。',
          '你应妥善保管账号信息，因主动泄露或不当使用造成的损失由你自行承担。'
        ]
      },
      {
        title: '发帖与评论规则',
        items: [
          '你发布的装备经验、求推荐、评论和图片应基于真实体验或合理表达。',
          '不得发布与路亚装备、钓行经验、装备选择明显无关的垃圾内容。',
          '不得通过标题党、虚假评测、恶意引导等方式误导其他用户做出装备判断。'
        ]
      },
      {
        title: '禁止内容',
        items: [
          '违反法律法规、危害国家安全、破坏社会秩序或侵害他人合法权益的内容。',
          '广告营销、引流交易、刷量、诈骗、赌博、色情低俗、暴力恐吓等内容。',
          '人身攻击、辱骂、造谣、侵犯隐私、侵犯版权或未经授权使用他人内容。',
          '绕过平台审核、规避关键词或恶意测试安全规则的内容。'
        ]
      },
      {
        title: '违规处理',
        paragraphs: [
          '平台会对用户发布内容进行机器审核和人工复核。对于疑似违规内容，平台可采取待审核、驳回、隐藏、下架、限制账号、封禁账号等措施。',
          '如你认为处理结果有误，可以通过“举报与申诉”页面提供的联系方式提交申诉。'
        ]
      },
      {
        title: '平台免责边界',
        paragraphs: [
          'GearSage 致力于沉淀真实装备经验，但用户发布内容不代表平台立场。装备选择涉及预算、使用场景、技术习惯和个人偏好，请自行判断并承担决策结果。',
          '因不可抗力、网络故障、第三方服务异常或用户自身原因导致的服务中断、数据延迟或信息错误，平台将在合理范围内尽力修复，但不承担超出法律规定的责任。'
        ]
      }
    ]
  },
  communityRules: {
    title: '内容发布规范',
    sections: [
      {
        title: '基本原则',
        paragraphs: [
          'GearSage 鼓励真实、长期、可验证的路亚装备经验。发布内容应帮助钓友理解装备差异、使用场景和选择依据。'
        ]
      },
      {
        title: '禁止发布的内容',
        items: [
          '违法违规、危害国家安全、破坏公共秩序或宣扬违法行为的内容。',
          '广告营销、带货引流、无关推广、刷屏、重复灌水或恶意导流内容。',
          '人身攻击、辱骂、挑衅、造谣、歧视、骚扰或恶意挂人的内容。',
          '低俗色情、血腥暴力、赌博诈骗、诱导未成年人不当行为的内容。',
          '虚假误导、伪造体验、夸大效果、冒充官方或冒充他人的内容。',
          '泄露他人手机号、地址、聊天记录、订单信息等隐私的内容。',
          '未经授权搬运他人图片、文章、评测、视频或其他受版权保护内容。',
          '与路亚装备、钓行经验、装备选择和社区讨论明显无关的内容。'
        ]
      },
      {
        title: '审核与处置',
        paragraphs: [
          '平台会对标题、正文、评论、昵称、简介、图片和举报理由等用户提交内容进行审核。命中风险的内容可能被直接拦截，或进入后台人工复核。',
          '已发布内容如被举报或复核发现违规，平台可进行隐藏、下架、限制账号或封禁处理。'
        ]
      }
    ]
  },
  reportAppeal: {
    title: '举报与申诉',
    sections: [
      {
        title: '可以举报的对象',
        items: [
          '帖子：虚假误导、违规营销、侵权搬运、违法违规或明显无关内容。',
          '评论和回复：人身攻击、低俗辱骂、垃圾广告、违法违规或侵犯隐私内容。',
          '用户：冒充他人、持续骚扰、恶意刷屏、发布违规内容或其他破坏社区秩序的行为。'
        ]
      },
      {
        title: '举报处理方式',
        paragraphs: [
          '收到举报后，平台会结合举报理由、被举报内容、系统审核记录和人工判断进行处理。',
          '处理方式包括驳回举报、标记已处理、隐藏评论、下架帖子、封禁或解封用户，并会保留必要的审核日志。'
        ]
      },
      {
        title: '申诉方式',
        paragraphs: [
          '如果你认为内容被误判、账号被误封，或举报处理结果存在问题，可以通过以下联系方式提交申诉。请提供手机号、内容链接或 ID、处理结果截图和申诉理由。'
        ],
        items: [
          `申诉邮箱：${CONTACT.email}`,
          `客服微信：${CONTACT.wechat}`
        ]
      }
    ]
  },
  cancelAccount: {
    title: '账号注销说明',
    sections: [
      {
        title: '如何申请注销',
        paragraphs: [
          '如需注销 GearSage 账号，请通过“联系我们”中的邮箱或客服微信提交申请，并说明你的登录手机号和注销原因。',
          '当前版本先通过人工方式处理注销申请，后续如增加自助注销入口，会在本页面同步说明。'
        ]
      },
      {
        title: '身份核实',
        paragraphs: [
          '为保护账号安全，我们会核实申请人与账号的关联关系，可能要求你提供登录手机号、验证码校验结果、账号昵称或其他能够证明账号归属的信息。'
        ]
      },
      {
        title: '数据删除或匿名化',
        paragraphs: [
          '注销完成后，我们会停止为该账号提供服务，并在合理期限内删除或匿名化不再需要保留的个人资料。',
          '对于已产生的内容审核记录、举报处理记录、违规处置记录或法律法规要求保留的信息，平台会在必要期限内继续保存，并限制使用范围。'
        ]
      },
      {
        title: '注意事项',
        items: [
          '账号注销后，原账号资料、积分、标签、消息和部分互动记录可能无法恢复。',
          '注销申请处理期间，如账号仍存在未完成争议、违规处理或安全风险，平台可能需要先完成必要核查。'
        ]
      }
    ]
  },
  contact: {
    title: '联系我们',
    sections: [
      {
        title: '联系方式',
        paragraphs: [
          '以下联系方式为 GearSage 合规与客服入口，占位信息已集中在本页面配置中，后续可替换为正式邮箱、微信或公众号。'
        ],
        items: [
          `邮箱：${CONTACT.email}`,
          `微信：${CONTACT.wechat}`,
          `公众号：${CONTACT.officialAccount}`
        ]
      },
      {
        title: '适用事项',
        items: [
          '隐私政策、用户协议、账号注销和个人信息处理咨询。',
          '举报处理、内容申诉、账号封禁申诉和误判反馈。',
          '产品问题、数据错误、装备资料建议和其他用户支持事项。'
        ]
      }
    ]
  },
  about: {
    title: '关于 GearSage',
    sections: [
      {
        title: 'GearSage 是什么',
        paragraphs: [
          PRODUCT_ABOUT_ENTRY.brief,
          '我们希望用长期、具体、可复盘的经验，帮助钓友更稳妥地判断装备是否适合自己的预算、目标鱼、作钓水域和使用习惯。'
        ]
      },
      {
        title: '社区定位',
        items: [
          '鼓励真实体验、清楚场景和具体判断。',
          '反对无依据吹捧、恶意贬低、虚假营销和无关噪音。',
          '通过内容审核、举报处理和后台日志，维护可信的讨论环境。'
        ]
      }
    ]
  }
};

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    pageTitle: '隐私政策',
    updatedAt: UPDATED_AT,
    sections: []
  },

  onLoad(options = {}) {
    this.initNavigationMetrics();
    this.applyContent(options.type);
  },

  initNavigationMetrics() {
    const app = getApp();
    const statusBarHeight = (app && app.globalData && app.globalData.statusBarHeight) || 20;
    const navBarHeight = (app && app.globalData && app.globalData.navBarHeight) || 44;
    this.setData({ statusBarHeight, navBarHeight });
  },

  applyContent(type) {
    const normalizedType = String(type || 'privacy').trim();
    const content = LEGAL_CONTENT[normalizedType] || LEGAL_CONTENT.privacy;
    this.setData({
      pageTitle: content.title,
      sections: content.sections
    });
    wx.setNavigationBarTitle({ title: content.title });
  },

  onBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: '/pages/profile/profile' });
  }
});
