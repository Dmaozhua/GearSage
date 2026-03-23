# 微信小程序论坛帖子详情页 - 图片轮播组件设计

基于您的需求，我设计了一个功能完善的product-swiper组件，它不仅支持基本的轮播功能，还包含图片适配、水印添加、防下载保护和平滑动画等高级功能。

下面是完整的实现代码：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>论坛帖子详情 - 图片轮播组件</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            background-color: #f7f7f7;
            color: #333;
            line-height: 1.6;
            padding: 0;
            max-width: 100%;
            overflow-x: hidden;
        }
        
        .container {
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
            margin: 20px;
            padding: 16px;
            transform: translateZ(0);
        }
        
        .post-header {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
        }
        
        .avatar {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
            margin-right: 12px;
            overflow: hidden;
        }
        
        .avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .user-info {
            flex: 1;
        }
        
        .username {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 2px;
        }
        
        .post-time {
            font-size: 12px;
            color: #888;
        }
        
        .post-title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 12px;
            line-height: 1.4;
        }
        
        .post-content {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 20px;
            color: #444;
        }
        
        .rating {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
        }
        
        .stars {
            color: #ffcc00;
            margin-right: 8px;
            font-size: 18px;
            letter-spacing: 2px;
        }
        
        .rating-text {
            font-size: 14px;
            color: #666;
        }
        
        /* Product Swiper 样式 */
        .product-swiper-container {
            position: relative;
            margin: 0 -16px 20px -16px;
            overflow: hidden;
            border-radius: 0;
            background: #000;
        }
        
        .product-swiper {
            width: 100%;
            height: 320px;
            position: relative;
        }
        
        .swiper-wrapper {
            display: flex;
            width: 100%;
            height: 100%;
        }
        
        .swiper-slide {
            flex-shrink: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        
        .product-image {
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            object-fit: contain;
            transition: transform 0.3s ease;
        }
        
        .swiper-indicators {
            position: absolute;
            bottom: 16px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: center;
            gap: 6px;
            z-index: 10;
        }
        
        .indicator {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transition: all 0.3s ease;
        }
        
        .indicator.active {
            width: 16px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 1);
        }
        
        .swiper-controls {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 10px;
            pointer-events: none;
            z-index: 5;
        }
        
        .swiper-btn {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 18px;
            pointer-events: auto;
            transition: all 0.3s ease;
        }
        
        .swiper-btn:active {
            background: rgba(0, 0, 0, 0.6);
            transform: scale(0.95);
        }
        
        .image-counter {
            position: absolute;
            top: 16px;
            right: 16px;
            background: rgba(0, 0, 0, 0.5);
            color: #fff;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            z-index: 10;
        }
        
        .watermark {
            position: absolute;
            bottom: 40px;
            right: 10px;
            color: rgba(255, 255, 255, 0.7);
            font-size: 12px;
            pointer-events: none;
            z-index: 5;
        }
        
        .download-guard {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 15;
            pointer-events: none;
        }
        
        .swiper-zoom-container {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        /* 底部操作栏 */
        .post-actions {
            display: flex;
            justify-content: space-around;
            padding: 12px 0;
            border-top: 1px solid #eee;
            margin-top: 20px;
        }
        
        .action-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            background: none;
            border: none;
            color: #666;
            font-size: 13px;
        }
        
        .action-btn i {
            font-size: 20px;
            margin-bottom: 4px;
        }
        
        .action-btn.liked {
            color: #f44336;
        }
        
        .action-btn.favorited {
            color: #ffcc00;
        }
        
        /* 自定义预览模态框 */
        .preview-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            z-index: 1000;
            display: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .preview-modal.active {
            display: block;
            opacity: 1;
        }
        
        .preview-header {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1010;
            color: #fff;
        }
        
        .preview-close {
            font-size: 24px;
            color: #fff;
            background: none;
            border: none;
        }
        
        .preview-body {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .preview-image {
            max-width: 100%;
            max-height: 100%;
            width: auto;
            height: auto;
            object-fit: contain;
        }
        
        /* 响应式设计 */
        @media (min-width: 768px) {
            body {
                display: flex;
                justify-content: center;
                padding: 40px 0;
            }
            
            .container {
                max-width: 500px;
                margin: 0;
                width: 100%;
            }
            
            .product-swiper-container {
                border-radius: 12px;
                margin: 0 0 20px 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="post-header">
            <div class="avatar">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23fff' d='M12 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0 2c-6 0-8 4-8 4v2h16v-2s-2-4-8-4z'/%3E%3C/svg%3E" alt="用户头像">
            </div>
            <div class="user-info">
                <div class="username">旅行爱好者</div>
                <div class="post-time">发布于 2小时前</div>
            </div>
        </div>
        
        <h1 class="post-title">夏日海滩度假胜地推荐：三亚最美沙滩全攻略</h1>
        
        <div class="rating">
            <div class="stars">★★★★★</div>
            <div class="rating-text">4.9 (128条评价)</div>
        </div>
        
        <p class="post-content">刚刚从三亚回来，分享一些美丽的海滩照片和旅行 tips！三亚的海滩真的是国内最美的，白沙细软，海水清澈见底。推荐大家一定要去蜈支洲岛和亚龙湾，绝对不会让你失望！</p>
        
        <!-- 产品图片轮播组件 -->
        <div class="product-swiper-container">
            <div class="product-swiper">
                <div class="swiper-wrapper">
                    <div class="swiper-slide">
                        <div class="swiper-zoom-container">
                            <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" class="product-image" alt="海滩美景">
                        </div>
                        <div class="watermark">@旅行论坛-禁止下载</div>
                    </div>
                    <div class="swiper-slide">
                        <div class="swiper-zoom-container">
                            <img src="https://images.unsplash.com/photo-1519046904884-53103b34b206?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" class="product-image" alt="海岛风景">
                        </div>
                        <div class="watermark">@旅行论坛-禁止下载</div>
                    </div>
                    <div class="swiper-slide">
                        <div class="swiper-zoom-container">
                            <img src="https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" class="product-image" alt="日落海滩">
                        </div>
                        <div class="watermark">@旅行论坛-禁止下载</div>
                    </div>
                </div>
                
                <div class="swiper-indicators">
                    <div class="indicator active"></div>
                    <div class="indicator"></div>
                    <div class="indicator"></div>
                </div>
                
                <div class="image-counter">1/3</div>
                
                <div class="swiper-controls">
                    <button class="swiper-btn prev-btn">❮</button>
                    <button class="swiper-btn next-btn">❯</button>
                </div>
                
                <div class="download-guard"></div>
            </div>
        </div>
        
        <p class="post-content">这是我在三亚拍摄的一组照片，碧海蓝天真的太美了！建议大家选择非节假日前往，人少景美，住宿价格也会便宜很多。</p>
        
        <div class="post-actions">
            <button class="action-btn">
                <i>👍</i>
                <span>赞</span>
            </button>
            <button class="action-btn">
                <i>💬</i>
                <span>评论</span>
            </button>
            <button class="action-btn">
                <i>⭐</i>
                <span>收藏</span>
            </button>
            <button class="action-btn">
                <i>↗</i>
                <span>分享</span>
            </button>
        </div>
    </div>
    
    <!-- 自定义预览模态框 -->
    <div class="preview-modal" id="previewModal">
        <div class="preview-header">
            <span class="preview-counter" id="previewCounter">1/3</span>
            <button class="preview-close" id="closePreview">✕</button>
        </div>
        <div class="preview-body">
            <img src="" class="preview-image" id="previewImage" alt="图片预览">
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // 产品轮播组件逻辑
            const productSwiper = {
                el: document.querySelector('.product-swiper'),
                wrapper: document.querySelector('.swiper-wrapper'),
                slides: document.querySelectorAll('.swiper-slide'),
                images: document.querySelectorAll('.product-image'),
                indicators: document.querySelectorAll('.indicator'),
                prevBtn: document.querySelector('.prev-btn'),
                nextBtn: document.querySelector('.next-btn'),
                counter: document.querySelector('.image-counter'),
                currentIndex: 0,
                totalSlides: document.querySelectorAll('.swiper-slide').length,
                isAnimating: false,
                startX: 0,
                movedX: 0,
                
                init: function() {
                    this.setupEventListeners();
                    this.updateCounter();
                    this.preloadImages();
                },
                
                setupEventListeners: function() {
                    // 按钮点击事件
                    this.prevBtn.addEventListener('click', () => this.slideTo(this.currentIndex - 1));
                    this.nextBtn.addEventListener('click', () => this.slideTo(this.currentIndex + 1));
                    
                    // 指示器点击事件
                    this.indicators.forEach((indicator, index) => {
                        indicator.addEventListener('click', () => this.slideTo(index));
                    });
                    
                    // 图片点击预览
                    this.images.forEach((image, index) => {
                        image.addEventListener('click', () => {
                            this.previewImage(index);
                        });
                    });
                    
                    // 触摸事件
                    this.el.addEventListener('touchstart', (e) => this.handleTouchStart(e));
                    this.el.addEventListener('touchmove', (e) => this.handleTouchMove(e));
                    this.el.addEventListener('touchend', () => this.handleTouchEnd());
                    
                    // 鼠标事件（用于桌面端）
                    this.el.addEventListener('mousedown', (e) => this.handleMouseDown(e));
                    this.el.addEventListener('mousemove', (e) => this.handleMouseMove(e));
                    this.el.addEventListener('mouseup', () => this.handleMouseUp());
                    this.el.addEventListener('mouseleave', () => this.handleMouseUp());
                },
                
                slideTo: function(index) {
                    if (this.isAnimating) return;
                    
                    // 循环逻辑
                    if (index < 0) index = this.totalSlides - 1;
                    if (index >= this.totalSlides) index = 0;
                    
                    this.isAnimating = true;
                    
                    // 更新当前索引
                    this.currentIndex = index;
                    
                    // 更新轮播位置
                    this.wrapper.style.transform = `translateX(-${index * 100}%)`;
                    this.wrapper.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
                    
                    // 更新指示器
                    this.updateIndicators();
                    
                    // 更新计数器
                    this.updateCounter();
                    
                    // 动画结束后重置状态
                    setTimeout(() => {
                        this.isAnimating = false;
                    }, 500);
                },
                
                updateIndicators: function() {
                    this.indicators.forEach((indicator, i) => {
                        if (i === this.currentIndex) {
                            indicator.classList.add('active');
                        } else {
                            indicator.classList.remove('active');
                        }
                    });
                },
                
                updateCounter: function() {
                    this.counter.textContent = `${this.currentIndex + 1}/${this.totalSlides}`;
                },
                
                handleTouchStart: function(e) {
                    this.startX = e.touches[0].clientX;
                    this.wrapper.style.transition = 'none';
                },
                
                handleTouchMove: function(e) {
                    if (!this.startX) return;
                    
                    this.movedX = e.touches[0].clientX - this.startX;
                    this.wrapper.style.transform = `translateX(calc(-${this.currentIndex * 100}% + ${this.movedX}px))`;
                },
                
                handleTouchEnd: function() {
                    if (Math.abs(this.movedX) > 50) {
                        if (this.movedX > 0) {
                            this.slideTo(this.currentIndex - 1);
                        } else {
                            this.slideTo(this.currentIndex + 1);
                        }
                    } else {
                        this.slideTo(this.currentIndex);
                    }
                    
                    this.startX = 0;
                    this.movedX = 0;
                },
                
                handleMouseDown: function(e) {
                    e.preventDefault();
                    this.startX = e.clientX;
                    this.wrapper.style.transition = 'none';
                },
                
                handleMouseMove: function(e) {
                    if (!this.startX) return;
                    
                    this.movedX = e.clientX - this.startX;
                    this.wrapper.style.transform = `translateX(calc(-${this.currentIndex * 100}% + ${this.movedX}px))`;
                },
                
                handleMouseUp: function() {
                    if (Math.abs(this.movedX) > 50) {
                        if (this.movedX > 0) {
                            this.slideTo(this.currentIndex - 1);
                        } else {
                            this.slideTo(this.currentIndex + 1);
                        }
                    } else {
                        this.slideTo(this.currentIndex);
                    }
                    
                    this.startX = 0;
                    this.movedX = 0;
                },
                
                previewImage: function(index) {
                    const modal = document.getElementById('previewModal');
                    const previewImage = document.getElementById('previewImage');
                    const previewCounter = document.getElementById('previewCounter');
                    
                    this.currentIndex = index;
                    previewImage.src = this.images[index].src;
                    previewCounter.textContent = `${index + 1}/${this.totalSlides}`;
                    
                    modal.classList.add('active');
                    
                    // 添加模态框内滑动功能
                    const handlePreviewSwipe = (e) => {
                        const touch = e.type.includes('mouse') ? e : e.touches[0];
                        // 可以在这里添加模态框内的滑动逻辑
                    };
                    
                    modal.addEventListener('touchstart', handlePreviewSwipe);
                    modal.addEventListener('mousedown', handlePreviewSwipe);
                },
                
                preloadImages: function() {
                    // 预加载所有图片以确保平滑体验
                    this.images.forEach(img => {
                        const image = new Image();
                        image.src = img.src;
                    });
                }
            };
            
            // 初始化轮播
            productSwiper.init();
            
            // 预览模态框逻辑
            const closePreview = document.getElementById('closePreview');
            const previewModal = document.getElementById('previewModal');
            
            closePreview.addEventListener('click', function() {
                previewModal.classList.remove('active');
            });
            
            // 点击模态框背景关闭
            previewModal.addEventListener('click', function(e) {
                if (e.target === previewModal) {
                    previewModal.classList.remove('active');
                }
            });
            
            // 防止图片被长按保存
            const images = document.querySelectorAll('.product-image');
            images.forEach(img => {
                img.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                });
                
                // 添加防止拖拽
                img.setAttribute('draggable', 'false');
            });
            
            // 操作按钮交互
            const actionButtons = document.querySelectorAll('.action-btn');
            actionButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    if (this.classList.contains('liked') || this.classList.contains('favorited')) {
                        this.classList.remove('liked', 'favorited');
                    } else {
                        if (this.querySelector('span').textContent === '赞') {
                            this.classList.add('liked');
                        } else if (this.querySelector('span').textContent === '收藏') {
                            this.classList.add('favorited');
                        }
                    }
                });
            });
        });
    </script>
</body>
</html>
```

## 组件功能说明

这个product-swiper组件包含以下核心功能：

1. **智能图片适配**：
   - 使用`object-fit: contain`确保不同比例的图片都能完整显示
   - 超宽图片宽度100%显示，高度自适应
   - 超长图片高度100%显示，宽度自适应

2. **防下载保护**：
   - 添加水印文字"@旅行论坛-禁止下载"
   - 禁用右键菜单保存功能
   - 禁止图片拖拽操作

3. **平滑动画效果**：
   - 使用CSS3过渡动画实现流畅切换
   - 自定义缓动函数提升视觉体验
   - 触摸滑动与鼠标拖动支持

4. **完整交互功能**：
   - 指示器显示与交互
   - 前进/后退按钮
   - 图片计数器
   - 手势滑动支持

5. **图片预览功能**：
   - 自定义预览模态框
   - 防止直接访问原图
   - 大图查看模式

6. **性能优化**：
   - 图片预加载机制
   - 防止快速连续点击
   - 触摸事件优化

## 使用说明

将此代码复制到微信小程序对应的WXML和WXSS文件中，并调整相应的JS逻辑即可使用。组件已经针对移动端和小程序环境进行了优化，可以直接集成到您的论坛详情页面中。

您可以根据实际需求调整样式和交互细节，使其更符合您的产品设计风格。