// pages/navbar-demo/navbar-demo.js
Page({
    data: {
        statusBarHeight: 0,
        navBarHeight: 0,
        
        // 导航栏配置选项
        navbarConfigs: [
            {
                id: 1,
                title: '基础导航栏',
                config: {
                    title: '基础标题',
                    showBack: true,
                    backgroundColor: '#ffffff',
                    textColor: '#000000'
                }
            },
            {
                id: 2,
                title: '带搜索的导航栏',
                config: {
                    title: '钓友说',
                    showBack: false,
                    leftIcon: '/images/logo.svg',
                    showSearch: true,
                    searchPlaceholder: '搜索钓友体验',
                    backgroundColor: '#BDC3C7',
                    textColor: '#000000'
                }
            },
            {
                id: 3,
                title: '深色主题导航栏',
                config: {
                    title: '深色主题',
                    showBack: true,
                    rightIcon: '/images/share.png',
                    backgroundColor: '#2c3e50',
                    textColor: '#ffffff',
                    showShadow: true
                }
            },
            {
                id: 4,
                title: '渐变背景导航栏',
                config: {
                    title: '渐变效果',
                    showBack: true,
                    rightText: '设置',
                    backgroundColor: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                    textColor: '#ffffff',
                    enableAnimation: true
                }
            },
            {
                id: 5,
                title: '透明导航栏',
                config: {
                    title: '透明效果',
                    showBack: true,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    textColor: '#333333',
                    opacity: 0.9
                }
            }
        ],
        
        currentConfig: null,
        showDemo: false
    },

    onLoad: function() {
        // 获取导航栏高度信息
        const app = getApp();
        if (app.globalData.statusBarHeight && app.globalData.navBarHeight) {
            this.setData({
                statusBarHeight: app.globalData.statusBarHeight,
                navBarHeight: app.globalData.navBarHeight
            });
        }
        
        // 设置默认配置
        this.setData({
            currentConfig: this.data.navbarConfigs[0].config
        });
    },

    onShow: function() {
        // 同步自定义导航栏主题
        const customNavbar = this.selectComponent('#custom-navbar');
        if (customNavbar && customNavbar.updateTheme) {
            customNavbar.updateTheme();
        }
    },

    /**
     * 选择导航栏配置
     */
    onConfigTap: function(e) {
        const configId = e.currentTarget.dataset.id;
        const config = this.data.navbarConfigs.find(item => item.id === configId);
        
        if (config) {
            this.setData({
                currentConfig: config.config,
                showDemo: true
            });
            
            wx.vibrateShort({
                type: 'light'
            });
        }
    },

    /**
     * 关闭演示
     */
    onCloseDemo: function() {
        this.setData({
            showDemo: false
        });
    },

    /**
     * 导航栏事件处理
     */
    onNavbarBack: function() {
        wx.showToast({
            title: '返回按钮被点击',
            icon: 'none'
        });
    },

    onNavbarSearch: function() {
        wx.showToast({
            title: '搜索被点击',
            icon: 'none'
        });
    },

    onNavbarRightButton: function() {
        wx.showToast({
            title: '右侧按钮被点击',
            icon: 'none'
        });
    },

    onNavbarLeftIcon: function() {
        wx.showToast({
            title: 'Logo被点击',
            icon: 'none'
        });
    },

    onNavbarTitle: function() {
        wx.showToast({
            title: '标题被点击',
            icon: 'none'
        });
    },

    /**
     * 测试导航栏方法
     */
    onTestOpacity: function() {
        const navbar = this.selectComponent('#demo-navbar');
        if (navbar) {
            const newOpacity = Math.random() * 0.5 + 0.5; // 0.5-1.0
            navbar.setOpacity(newOpacity);
            
            wx.showToast({
                title: `透明度设置为 ${newOpacity.toFixed(2)}`,
                icon: 'none'
            });
        }
    },

    onTestShadow: function() {
        const navbar = this.selectComponent('#demo-navbar');
        if (navbar) {
            const showShadow = Math.random() > 0.5;
            navbar.toggleShadow(showShadow);
            
            wx.showToast({
                title: showShadow ? '显示阴影' : '隐藏阴影',
                icon: 'none'
            });
        }
    }
});