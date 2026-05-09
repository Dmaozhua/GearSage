// pages/about-page/about-page.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 导航栏相关数据
    statusBarHeight: 0,
    navBarHeight: 0,
    
    // 主题模式
    containerClass: '',
    
    // 页面标题
    pageTitle: '',
    
    // 内容类型
    contentType: '',
    
    // 内容数据
    contentData: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取导航栏高度信息
    const app = getApp();
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight
    });
    
    // 初始化主题模式
    this.initThemeMode();
    
    // 获取内容类型
    const { type } = options;
    if (type) {
      this.setData({ contentType: type });
      this.loadContent(type);
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 同步主题模式
    this.initThemeMode();
    
    // 通知自定义导航栏更新主题
    const customNavbar = this.selectComponent('#custom-navbar');
    if (customNavbar && customNavbar.updateTheme) {
      customNavbar.updateTheme();
    }
  },

  /**
   * 初始化主题模式
   */
  initThemeMode() {
    try {
      const app = getApp();
      const isDarkMode = app.globalData.isDarkMode || false;
      this.setData({
        containerClass: isDarkMode ? 'dark' : ''
      });
    } catch (error) {
      console.error('初始化主题模式失败:', error);
    }
  },

  /**
   * 加载内容
   */
  loadContent(type) {
    try {
      let pageTitle = '';
      let contentData = null;
      
      // 根据类型加载不同内容
      switch (type) {
        case 'about':
          pageTitle = '关于小程序';
          try {
            // 导入关于小程序的内容
            const aboutApp = require('./data/关于小程序.js');
            contentData = aboutApp.data.formattedContent;
            console.log('加载关于小程序内容成功');
          } catch (err) {
            console.error('加载关于小程序内容失败:', err);
            wx.showToast({
              title: '加载内容失败',
              icon: 'none'
            });
          }
          break;
        case 'audit':
          pageTitle = '关于审核';
          try {
            // 导入关于审核的内容
            const aboutAudit = require('./data/关于审核.js');
            contentData = aboutAudit.data.auditContent;
            console.log('加载关于审核内容成功');
          } catch (err) {
            console.error('加载关于审核内容失败:', err);
            wx.showToast({
              title: '加载内容失败',
              icon: 'none'
            });
          }
          break;
        case 'privacy':
          pageTitle = '隐私政策';
          contentData = this.buildStaticContent([
            ['GearSage 隐私政策', 'GearSage 用于路亚装备资料查询、参数对比和装备经验交流。我们只在完成登录、发布、评论、举报、内容审核和账号安全所必需的范围内处理信息。'],
            ['我们收集的信息', '手机号验证码登录信息、昵称、头像、简介、发帖标题与正文、评论、举报理由、上传图片、设备与网络请求基础日志。'],
            ['使用目的', '用于账号识别、内容展示、内容审核、举报处理、违规追溯、账号封禁/解封、服务稳定性排查。'],
            ['保存与删除', '审核记录、举报记录和操作日志会为平台治理留存。你可通过联系方式申请查看、更正或删除个人资料，账号注销后将按合规要求处理可删除数据。'],
            ['第三方服务', '验证码短信和内容安全审核可能使用腾讯云服务，相关数据仅用于验证码发送、文本审核、图片审核和风险处置。'],
            ['联系方式', '如需隐私相关协助，请通过本页“联系方式”中的邮箱提交。']
          ]);
          break;
        case 'terms':
          pageTitle = '用户协议';
          contentData = this.buildStaticContent([
            ['GearSage 用户协议', 'GearSage 是面向路亚钓友的装备资料查询、参数对比和装备经验交流工具。使用本小程序即表示你同意遵守本协议。'],
            ['账号规则', '请使用本人可接收验证码的手机号登录，不得冒用他人身份或绕过平台审核与治理措施。'],
            ['发布与评论规则', '发布标题、正文、图片、评论、昵称和简介须真实、克制、可理解，不得包含违法违规、辱骂骚扰、广告引流、虚假信息或侵犯他人权益的内容。'],
            ['审核与处置', '平台会对文本和图片进行机器审核与人工复核。未通过内容可能被驳回、下架；违规账号可能被限制、封禁或解封后恢复。'],
            ['举报与申诉', '你可以举报帖子、评论或用户。平台会保留处理记录，并可通过联系方式接收补充说明或申诉。']
          ]);
          break;
        case 'cancel':
          pageTitle = '账号注销说明';
          contentData = this.buildStaticContent([
            ['账号注销说明', '如需注销 GearSage 账号，请通过联系方式提交申请，并提供登录手机号及必要的身份核验信息。'],
            ['注销影响', '注销后，账号资料将停止展示；依法需要留存的审核、举报、日志和安全记录会在必要期限内保留。'],
            ['处理时限', '收到完整申请后，我们会在合理期限内完成核验和处理，并通过你提交的联系方式反馈结果。'],
            ['撤回申请', '注销完成前，你可以通过同一联系方式撤回申请。']
          ]);
          break;
        case 'contact':
          pageTitle = '联系方式';
          contentData = this.buildStaticContent([
            ['联系方式与举报申诉', '如需联系平台，可通过邮箱提交隐私、协议、账号注销、举报申诉或审核问题。'],
            ['联系邮箱', 'gearsage@outlook.com'],
            ['举报入口', '帖子更多菜单、评论操作区、他人主页均提供举报入口。举报理由会进入文本审核并留痕。'],
            ['处理说明', '平台会在审核后台查看举报、处理帖子/评论、封禁或解封用户，并保留处理日志。']
          ]);
          break;
        default:
          pageTitle = '关于';
          break;
      }
      
      this.setData({
        pageTitle,
        contentData
      });
    } catch (error) {
      console.error('加载内容失败:', error);
      wx.showToast({
        title: '加载内容失败',
        icon: 'none'
      });
    }
  },

  buildStaticContent(sections = []) {
    const nodes = [];
    sections.forEach(([title, content], index) => {
      nodes.push({
        name: 'div',
        attrs: { class: index === 0 ? 'title' : 'subtitle' },
        children: [{ type: 'text', text: title }]
      });
      nodes.push({
        name: 'div',
        attrs: { class: 'content' },
        children: [{ type: 'text', text: content }]
      });
      nodes.push({ type: 'text', text: '\n\n' });
    });
    return nodes;
  }
});
