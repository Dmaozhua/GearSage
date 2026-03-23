// pages/articlePage/articlePage.js
Page({
  data: {
    // 导航栏相关数据
    statusBarHeight: 0,
    navBarHeight: 0,
    containerClass: '', // 夜间模式容器类名
    
    articles: [],
    loading: true,
    originalArticles: [], // 原始文章数据
    searchKeyword: "", // 搜索关键词
    showNoResults: false, // 是否显示无结果提示
    highlightedArticles: [] // 用于存储高亮处理后的文章数据
  },

  onLoad: function(options) {
    // 获取导航栏高度信息
    const app = getApp();
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight
    });
    
    // 初始化主题模式
    this.initThemeMode();
    
    // 如果传入了articleId，直接跳转到文章详情页
    if (options.articleId) {
      wx.redirectTo({
        url: `/pkgContent/articleDetail/articleDetail?articleId=${options.articleId}`
      });
      return;
    }
    
    // 显示加载状态
    this.setData({
      loading: true,
      showNoResults: false
    });
    
    // 加载文章数据
    this.loadArticles();
  },

  // 加载文章数据
  loadArticles: function() {
    try {
      // 记录开始加载时间，用于性能统计
      const startTime = Date.now();
      
      // 动态加载文章数据
      const articleData = [];
      
      // 使用微信小程序的文件系统API获取文章文件列表
      try {
        // 获取文件系统管理器实例
        const fs = wx.getFileSystemManager();
        
        // 尝试读取textData目录下的所有文件
        // 由于小程序的安全限制，我们无法直接列出目录内容
        // 所以我们使用一个足够大的范围来尝试加载文章
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
            // 将文章数据和对应的ID一起存储
            articleData.push({id: i, data: currentArticle});
            console.log(`成功加载文章: ${fileName}`);
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
            console.log(`尝试加载${fileName}：文件不存在或格式不正确`);
          }
        }
      } catch (e) {
        console.error('加载文章失败:', e);
      }
      
      // 如果没有加载到任何文章，使用默认数据
      if (articleData.length === 0) {
        console.log('未能加载任何文章，使用默认数据');
        // 文章1数据
        const article1 = {
          "title": "春季路亚鲈鱼技巧与找鱼方式全解析",
          "author": "李华",
          "publishDate": "2024-02-15",
          "content": "",
          "children": [
            {
              "title": "引言",
              "content": "春季是路亚鲈鱼的黄金季节，尤其是对于淡水鲈鱼（大口鲈、大口黑鲈）来说，这一时期鲈鱼的活性高，觅食积极，是钓获大鱼的最佳时机。本报告将全面分析春季路亚鲈鱼的技巧和找鱼方式，帮助钓友在春季钓鲈鱼时取得更好的成绩。",
              "children": []
            }
          ]
        };
        articleData.push({id: 1, data: article1});
        
        // 显示提示信息
        wx.showToast({
          title: '使用默认文章数据',
          icon: 'none',
          duration: 2000
        });
      } else {
        console.log(`成功加载了${articleData.length}篇文章`);
      }
      
      // 对文章数据进行排序（按ID或日期）
      articleData.sort((a, b) => {
        // 如果有publishDate字段，按日期排序（新的在前）
        if (a.publishDate && b.publishDate) {
          return new Date(b.publishDate) - new Date(a.publishDate);
        }
        return 0; // 保持原有顺序
      });
      
      // 处理文章数据
      const articles = articleData.map((fishingDataWithId, index) => {
        const fishingData = fishingDataWithId.data;
        const articleId = fishingDataWithId.id;
        // 检查文章格式，适配新旧两种格式
        if (fishingData.content !== undefined) {
          // 新格式使用 content 属性
          return {
            id: articleId,
            meta: {
              title: fishingData.title || "无标题",
              author: fishingData.author || "未知作者",
              publishDate: fishingData.publishDate || "未知日期"
            },
            text: fishingData.content, // 将 content 映射到 text
            children: fishingData.children || [],
            previewText: fishingData.children && fishingData.children.length > 0 ? 
                        fishingData.children[0].content.substring(0, 50) + '...' : ''
          };
        } else if (fishingData.text !== undefined) {
          // 旧格式使用 text 属性
          return {
            id: articleId,
            meta: {
              title: fishingData.title || "无标题",
              author: fishingData.author || "未知作者",
              publishDate: fishingData.publishDate || "未知日期"
            },
            text: fishingData.text,
            children: fishingData.children || [],
            previewText: fishingData.text.substring(0, 50) + '...'
          };
        } else {
          // 如果两种属性都不存在，提供默认值
          return {
            id: articleId,
            meta: {
              title: fishingData.title || "无标题",
              author: fishingData.author || "未知作者",
              publishDate: fishingData.publishDate || "未知日期"
            },
            text: "",
            children: fishingData.children || [],
            previewText: ''
          };
        }
      });
      
      // 初始化高亮文章数据（初始状态无高亮）
      const initialHighlightedArticles = articles.map(article => ({
        id: article.id,
        titleNodes: article.meta.title,
        previewNodes: article.previewText
      }));
      
      // 计算加载时间
      const loadTime = Date.now() - startTime;
      console.log(`文章加载完成，共加载${articles.length}篇文章，耗时${loadTime}ms`);
      
      this.setData({
        articles: articles,
        originalArticles: articles, // 保存原始文章列表
        loading: false,
        currentArticleIndex: 0,
        showNoResults: false,
        highlightedArticles: initialHighlightedArticles // 初始化高亮文章数据
      });
      
      // 显示加载成功提示
      if (articles.length > 0) {
        wx.showToast({
          title: `已加载${articles.length}篇文章`,
          icon: 'success',
          duration: 1500
        });
      }
    } catch (error) {
      console.error("加载文章失败:", error);
      wx.showToast({
        title: '加载文章失败',
        icon: 'none'
      });
    }
  },

  // 监听搜索框输入事件
  onSearchInput: function(e) {
    const keyword = e.detail.value.trim();
    this.setData({ searchKeyword: keyword });
    
    // 防抖处理
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    
    this.searchTimer = setTimeout(() => {
      this.filterArticles(keyword);
    }, 300);
  },
  
  // 搜索按钮点击事件
  onSearch: function() {
    this.filterArticles(this.data.searchKeyword);
  },
  
  // 高亮文本处理函数
  highlightText: function(text, keyword) {
    if (!keyword || !text) return text;
    
    // 检查关键词是否存在于文本中（不区分大小写）
    const lowerText = text.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    if (!lowerText.includes(lowerKeyword)) return text;
    
    try {
      // 创建安全的HTML字符串
      let result = '';
      let lastIndex = 0;
      const regex = new RegExp(keyword, 'gi');
      let match;
      
      // 使用正则表达式的exec方法逐个查找匹配项
      while ((match = regex.exec(text)) !== null) {
        // 添加匹配前的文本
        result += text.substring(lastIndex, match.index);
        // 添加带高亮的匹配文本
        result += `<span style="color:#1E3A8A;font-weight:bold;">${match[0]}</span>`;
        // 更新lastIndex
        lastIndex = match.index + match[0].length;
      }
      
      // 添加最后一个匹配后的文本
      result += text.substring(lastIndex);
      return result;
    } catch (e) {
      console.error('高亮处理出错:', e);
      return text; // 出错时返回原始文本
    }
  },
  
  // 过滤文章
  filterArticles: function(keyword) {
    const { articles } = this.data;
    
    if (!this.data.originalArticles || this.data.originalArticles.length === 0) {
      // 首次搜索时保存原始文章列表
      this.setData({ originalArticles: articles });
    }
    
    if (!keyword) {
      // 搜索关键词为空，显示所有文章
      this.setData({
        articles: this.data.originalArticles,
        highlightedArticles: this.data.originalArticles.map(article => ({
          id: article.id,
          titleNodes: article.meta.title,
          previewNodes: article.previewText
        })),
        showNoResults: false
      });
      return;
    }
    
    // 根据关键词过滤文章
    const filteredArticles = this.data.originalArticles.filter(article => {
      // 在标题、作者、内容中搜索关键词
      return (
        article.meta.title.toLowerCase().includes(keyword.toLowerCase()) ||
        article.meta.author.toLowerCase().includes(keyword.toLowerCase()) ||
        article.previewText.toLowerCase().includes(keyword.toLowerCase()) ||
        (article.text && article.text.toLowerCase().includes(keyword.toLowerCase()))
      );
    });
    
    // 处理高亮显示
    const highlightedArticles = filteredArticles.map(article => ({
      id: article.id,
      titleNodes: this.highlightText(article.meta.title, keyword),
      previewNodes: this.highlightText(article.previewText, keyword)
    }));
    
    // 更新数据
    this.setData({
      articles: filteredArticles,
      highlightedArticles: highlightedArticles,
      showNoResults: filteredArticles.length === 0
    });
  },
  
  // 跳转到文章详情页
  navigateToArticleDetail: function(e) {
    const articleId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pkgContent/articleDetail/articleDetail?articleId=${articleId}`
    });
  },

  // 导航到主页
  navigateToHome: function() {
    wx.switchTab({
      url: '/pages/home/home'
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