// pages/articleDetail/articleDetail.js
Page({
  data: {
    // 导航栏相关数据
    statusBarHeight: 0,
    navBarHeight: 0,
    article: null,
    loading: true,
    articleId: null,
    containerClass: '', // 夜间模式容器类名
    startX: 0,          // 触摸起始X坐标
    startY: 0,          // 触摸起始Y坐标
    swipeTransform: '',  // 滑动变换样式
    isSwiping: false,    // 是否正在滑动
    maxSwipeDistance: 150, // 最大滑动距离
    pageStyle: "overflow: visible" ,// 允许页面滚动
    swipeProgress: 0,       // 新增滑动进度(0-1)
    isAnimating: false ,     // 新增动画状态锁
    swipeTransform: 'transform: translateX(0)',
    isTouchMoving: false,
    referencesCollapsed: true  // 参考文献折叠状态
  },

  onLoad: function(options) {
    // 获取导航栏高度信息
    const app = getApp()
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight
    })
    
    // 初始化主题模式
    this.initThemeMode();
    
    // 获取文章ID
    if (options.articleId) {
      const articleId = parseInt(options.articleId);
      this.setData({
        articleId: articleId
      });
      this.loadArticleDetail(articleId);
    } else {
      wx.showToast({
        title: '无效的文章ID',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },
// 新增触摸事件处理函数
touchStart(e) {
  if (this.data.isAnimating) return;
  
  const touch = e.touches[0]
  this.setData({
    startX: touch.clientX,
    startY: touch.clientY,
    isTouchMoving: false
  })
},


touchMove(e) {
  if (this.data.isAnimating) return;

  const touch = e.touches[0]
  const deltaX = touch.clientX - this.data.startX
  const deltaY = touch.clientY - this.data.startY
  
  // 方向锁定逻辑
  if (!this.data.isTouchMoving) {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      this.setData({ isTouchMoving: true })
    } else {
      return // 纵向滑动不处理
    }
  }
  const progress = Math.min(Math.max(deltaX / this.data.maxSwipeDistance, 0), 1)
  this.setData({
    swipeTransform: `transform: translateX(${deltaX}px)`,
    swipeProgress: progress,
    isSwiping: progress > 0.2
  })
},

touchEnd() {
  if (this.data.isAnimating) return;
  
  this.setData({ 
    isAnimating: true,
    isTouchMoving: false 
  })

  const finalTransform = this.data.swipeProgress > 0.5 ? 
    `transform: translateX(100vw) translateZ(0); transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);` :
    `transform: translateX(0) translateZ(0); transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);`

  this.setData({
    swipeTransform: finalTransform
  }, () => {
    setTimeout(() => {
      if (this.data.swipeProgress > 0.5) {
        wx.navigateBack()
      }
      this.setData({ 
        isAnimating: false,
        swipeProgress: 0,
        isSwiping: false
      })
    }, 350)
  })

},

  // 加载文章详情
  loadArticleDetail: function(articleId) {
    try {
      // 动态加载文章数据
      const articleData = [];
      let article = null;
      
      // 由于小程序的安全限制，我们无法直接列出目录内容
      // 所以我们使用一个足够大的范围来尝试加载文章，类似于articlePage.js的实现
      const maxArticleNumber = 50; // 设置一个足够大的数字来尝试加载文章
      
      for (let i = 1; i <= maxArticleNumber; i++) {
        const fileName = `article${i}.js`;
        try {
          // 动态构建require路径
          const articleModule = require(`../../data/textData/${fileName}`);
          // 检查导出方式，支持多种导出格式
          let currentArticle;
          if (articleModule.fishingData) {
            currentArticle = articleModule.fishingData;
          } else if (articleModule.default) {
            currentArticle = articleModule.default;
          } else {
            currentArticle = articleModule;
          }
          
          // 将文章添加到列表中
          const currentId = i;
          articleData.push({id: currentId, data: currentArticle});
          
          // 如果ID匹配，设置为当前文章
          if (currentId === articleId) {
            article = currentArticle;
          }
          console.log(`成功加载文章: article${i}.js`);
        } catch (e) {
          // 如果连续5个文件都加载失败，则认为已经没有更多文章了
          if (i > 5 && articleData.length === 0) {
            console.log('没有找到任何文章文件，停止尝试加载');
            break;
          }
          // 如果已经加载了一些文章，并且连续5个文件都加载失败，则认为已经加载完所有文章
          if (articleData.length > 0 && i - articleData.length >= 5) {
            console.log('已加载所有可用文章文件，停止尝试加载');
            break;
          }
          console.log(`尝试加载article${i}.js：文件不存在或格式不正确`);
        }
      }
      
      // 如果没有直接匹配到文章ID，则从加载的文章列表中查找
      if (!article && articleData.length > 0) {
        const foundArticle = articleData.find(item => item.id === articleId);
        if (foundArticle) {
          article = foundArticle.data;
        }
      }
      
      if (article) {
        // 处理文章数据，转换为适合在详情页显示的格式
        const processedArticle = this.processArticleData(article);
        
        this.setData({
          article: processedArticle,
          loading: false
        });
      } else {
        wx.showToast({
          title: '文章不存在',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } catch (error) {
      console.error('加载文章详情失败:', error);
      wx.showToast({
        title: '加载文章失败',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 导航到主页
  navigateToHome: function() {
    wx.switchTab({
      url: '/pages/home/home'
    });
  },

  // 返回上一页
  navigateBack: function() {
    wx.navigateBack();
  },
  

  

  
  // 处理文章数据，转换为适合在详情页显示的格式
  processArticleData: function(rawArticle) {
    // 创建一个新的文章对象，包含meta信息
    const processedArticle = {
      meta: {
        title: rawArticle.title || "无标题",
        author: rawArticle.author || "未知作者",
        publishDate: rawArticle.publishDate || "未知日期"
      },
      introduction: {
        title: "引言",
        text: ""
      },
      // 保留原始的content字段，并处理换行符
      content: this.processReferences(rawArticle.content || rawArticle.text || ""),
      // 保留原始的children结构，但需要处理引用链接
      children: this.processChildrenWithReferences(rawArticle.children || []),
      chapters: []
    };
    
    // 处理文章内容
    if (rawArticle.children && rawArticle.children.length > 0) {
      // 第一个子节点通常是引言
      const intro = rawArticle.children[0];
      if (intro) {
        processedArticle.introduction = {
          title: intro.title || "引言",
          text: this.processReferences(intro.content || "")
        };
      }
      
      // 处理其余章节
      for (let i = 1; i < rawArticle.children.length; i++) {
        const chapter = rawArticle.children[i];
        if (!chapter) continue;
        
        const processedChapter = {
          title: chapter.title || `章节 ${i}`,
          sections: []
        };
        
        // 如果章节有直接内容
        if (chapter.content && chapter.content.trim() !== "") {
          processedChapter.sections.push({
            subtitle: "",
            content: [{ type: "text", value: this.processReferences(chapter.content) }]
          });
        }
        
        // 处理章节的子节点
        if (chapter.children && chapter.children.length > 0) {
          chapter.children.forEach(section => {
            if (section) {
              processedChapter.sections.push({
                subtitle: section.title || "",
                content: [{ type: "text", value: this.processReferences(section.content || "") }]
              });
            }
          });
        }
        
        // 只有当章节有内容或子节点时才添加到章节列表
        if (processedChapter.sections.length > 0) {
          processedArticle.chapters.push(processedChapter);
        }
      }
    } else {
      // 处理没有children结构的文章
      // 如果文章有content字段，将其作为引言
      if (rawArticle.content && rawArticle.content.trim() !== "") {
        processedArticle.introduction = {
          title: "引言",
          text: this.processReferences(rawArticle.content)
        };
      } 
      // 如果文章有text字段（旧格式），将其作为引言
      else if (rawArticle.text && rawArticle.text.trim() !== "") {
        processedArticle.introduction = {
          title: "引言",
          text: this.processReferences(rawArticle.text)
        };
      }
      
      // 创建一个默认章节，确保页面有内容显示
      if (!processedArticle.introduction.text && !processedArticle.content) {
        processedArticle.chapters.push({
          title: "内容",
          sections: [{
            subtitle: "",
            content: [{ type: "text", value: "暂无内容" }]
          }]
        });
      }
    }
    
    return processedArticle;
  },

  // 处理子节点中的引用链接
  processChildrenWithReferences: function(children) {
    return children.map(child => {
      const processedChild = {
        ...child,
        content: this.processReferences(child.content || ''),
        children: child.children ? this.processChildrenWithReferences(child.children) : []
      };
      return processedChild;
    });
  },

  // 处理引用链接格式
  processReferences: function(content) {
    if (!content) return content;
    
    // 匹配格式：[[数字](链接)] 或 [数字](链接)
    // 替换为显示[数字]，隐藏链接和外层方括号
    let processedContent = content.replace(/\[\[(\d+)\]\([^)]+\)\]/g, '[$1]')
                                 .replace(/\[(\d+)\]\([^)]+\)/g, '[$1]');
    
    // 处理换行符：将\n转换为<br>标签
    processedContent = processedContent.replace(/\n/g, '<br>');
    
    return processedContent;
  },

  // 切换参考文献折叠状态
  toggleReferences: function() {
    this.setData({
      referencesCollapsed: !this.data.referencesCollapsed
    });
  },

  // 导航到主页
  navigateToHome: function() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  /**
   * 初始化主题模式
   */
  initThemeMode: function() {
    const app = getApp();
    const isDarkMode = app.globalData.isDarkMode || false;
    this.setData({
      containerClass: isDarkMode ? 'dark-mode' : ''
    });
  },

  /**
   * 页面显示时同步主题模式
   */
  onShow: function() {
    this.initThemeMode();
    
    // 通知自定义导航栏更新主题
    const customNavbar = this.selectComponent('#custom-navbar');
    if (customNavbar && customNavbar.updateTheme) {
      customNavbar.updateTheme();
    }
  }

});