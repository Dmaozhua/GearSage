export const data01 = [
    {
        _id: "post001", // 发布ID 累计增加
        type: 1, // 分类 1竿 2轮 3线 4饵 5其他
        title: "达亿瓦 20款阿尔法air", // 帖子名称
        purchaseDate: "2020-01-15", // 购入时间
        frequency: "平均每周2次", // 使用频次
        environment: ["管理场", "溪流"], // 主要使用场景（多选）
        targetFish: ["鲈鱼", "鳜鱼"], // 目标鱼种（多选）
        mainContent: "使用两年稳定性极佳，抛投距离远，操控性好，特别适合海钓使用。制动系统精准可靠，应对各种鱼种都游刃有余。手感舒适，长时间使用不会有明显疲劳感。做工精细，各部件衔接紧密，使用寿命长。无论是在淡水湖泊还是近海区域都表现出了卓越的性能。", // 详细体验
        mainImages: ["https://picsum.photos/400/300?random=1", "https://picsum.photos/400/300?random=2", "https://picsum.photos/400/300?random=3"], // 图片列表
        recommend: ["抛投十分出色", "耐久度高", "颜值在线", "持感舒适"],
        defects: ["价格偏高", "重量稍重", "配件较少"], // 缺点数组
        condition: 1, // 0-待审核 1-已发布 2-已拒绝
        likes: 42, // 点赞数
        comments: 8, // 评论数
        creator: "user123", // 发布者ID
        userName: "钓鱼达人小王", // 用户名
        userAvatar: "/images/tab/路亚轮.png", // 用户头像
        userTags: ["LV8 资深钓手"], // 用户标签数组
        userTagColor: "#F6F6F6",
        createTime: "2024-05-20T10:30:00Z", // 发布日期
        createTimeFormatted: "2天前", // 格式化时间
        usageYears: 2, // 使用年限
        usageYearsText: "已使用2年", // 使用年限文本
        castingScore: 5, // 抛投分数
        durabilityScore: 6, // 耐用分数
        costScore: 7, // 性价比分数
        overallScore: 6, // 综合评分
        price: 2999, // 价格
        viewCount: 256, // 浏览量
        isLiked: false, // 是否已点赞
        usageDuration: "2年", // 使用时长
        usageFrequency: "每周2-3次", // 使用频率
        usageEnvironment: "淡水湖泊、溪流", // 使用环境
        description: "使用两年稳定性极佳，抛投距离远，操控性好，特别适合海钓使用。" // 简短描述
    },
    {
        _id: "post002",
        type: 2,
        title: "禧玛诺 XCV+ 路亚轮",
        purchaseDate: "2021-03-20",
        frequency: "平均每周3次",
        environment: ["淡水湖泊", "河流"],
        targetFish: ["鲈鱼", "翘嘴"],
        mainContent: "使用这款路亚轮已经3年了，整体性能非常稳定，轻便耐用，抛投性好，特别适合淡水钓鱼。制动系统顺滑，手感极佳，是一款性价比很高的产品。",
        mainImages: ["https://picsum.photos/400/300?random=4", "https://picsum.photos/400/300?random=5"],
        recommend: ["轻便耐用", "抛投性好", "制动顺滑", "性价比高"],
        defects: ["线杯容量偏小", "配色单一"],
        condition: 1,
        likes: 89,
        comments: 12,
        creator: "user456",
        userName: "钓鱼达人",
        userAvatar: "/images/tab/路亚轮 (1).png",
        userTags: ["专业钓手"],
        userTagColor: "#E8F4FD",
        createTime: "2024-05-18T14:20:00Z",
        createTimeFormatted: "4天前",
        usageYears: 3,
        usageYearsText: "已使用3年",
        castingScore: 8,
        durabilityScore: 9,
        costScore: 9,
        overallScore: 8.7,
        price: 1899,
        viewCount: 189,
        isLiked: false,
        usageDuration: "3年",
        usageFrequency: "每周3次",
        usageEnvironment: "淡水湖泊",
        description: "使用3年了，整体性能非常稳定，轻便耐用，抛投性好。"
    },
    {
        _id: "post003",
        type: 1,
        title: "美人鱼 碳素路亚竿 2.1米",
        purchaseDate: "2023-08-10",
        frequency: "平均每周1次",
        environment: ["海钓", "矶钓"],
        targetFish: ["海鲈", "石斑鱼"],
        mainContent: "这根路亚竿手感非常好，调性适中，既有足够的硬度应对大鱼，又有良好的韧性保护细线。做工精细，涂装漂亮，是一根值得推荐的好竿。",
        mainImages: ["https://picsum.photos/400/300?random=6", "https://picsum.photos/400/300?random=7"],
        recommend: ["手感极佳", "调性适中", "做工精细", "涂装漂亮"],
        defects: ["价格较高", "重量偏重"],
        condition: 1,
        likes: 156,
        comments: 23,
        creator: "user789",
        userName: "老钓手王",
        userAvatar: "/images/tab/钓鱼.png",
        userTags: ["资深钓手"],
        userTagColor: "#FFF2E8",
        createTime: "2024-05-15T09:15:00Z",
        createTimeFormatted: "1周前",
        usageYears: 0.8,
        usageYearsText: "已使用8个月",
        castingScore: 9,
        durabilityScore: 8,
        costScore: 6,
        overallScore: 7.7,
        price: 4599,
        viewCount: 312,
        isLiked: true,
        usageDuration: "8个月",
        usageFrequency: "每周1次",
        usageEnvironment: "海钓场",
        description: "手感非常好，调性适中，既有足够的硬度又有良好的韧性。"
    }
];