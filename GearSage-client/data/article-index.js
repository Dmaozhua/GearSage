const articleIndex = [
  {
    "id": 20,
    "title": "Aaron Martens：鲈钓传奇的生平与贡献",
    "author": "AImPhish",
    "publishDate": "2025-06-19",
    "previewText": "Aaron Martens，这位被誉为\"倒钓之王\"的鲈钓传奇人物，以其独特的钓鱼技巧和对鲈钓运动的卓..."
  },
  {
    "id": 18,
    "title": "鳡鱼的生物学特性、习性与路亚钓法综合研究",
    "author": "AImPhish",
    "publishDate": "2025-03-16",
    "previewText": "鳡鱼（Elopichthys bambusa）作为一种广泛分布于我国江河湖库中的凶猛肉食性鱼类，因其..."
  },
  {
    "id": 19,
    "title": "鳜鱼的分类与习性研究：从论文中的总结",
    "author": "AImPhish",
    "publishDate": "2025-03-16",
    "previewText": "鳜鱼(Siniperca chuatsi)是中国特产的一种食用淡水鱼，因其肉质细嫩、味道鲜美、营养丰..."
  },
  {
    "id": 14,
    "title": "鱼类听觉系统与声音对鱼类的影响：路亚钓法中声音假饵的诱鱼作用研究",
    "author": "AImPhish",
    "publishDate": "2025-03-15",
    "previewText": "钓鱼作为一种古老而广泛的活动，其技术方法和理论体系一直在不断发展和完善。路亚钓法作为一种模仿猎食行为..."
  },
  {
    "id": 15,
    "title": "鱼类视觉系统与饵料颜色选择：从科学到实践的全面解析",
    "author": "AImPhish",
    "publishDate": "2025-03-15",
    "previewText": "钓鱼是一项融合了科学与艺术的活动，而饵料颜色选择是其中关键的一环。长期以来，关于鱼类能否看见颜色以及..."
  },
  {
    "id": 16,
    "title": "鱼类对水中震动的感知及其对路亚钓鱼的影响研究",
    "author": "AImPhish",
    "publishDate": "2025-03-15",
    "previewText": "鱼类作为水生生物，具有独特的感知系统，能够感知水中的各种变化，包括水流、震动等物理刺激。这种感知能力..."
  },
  {
    "id": 17,
    "title": "翘嘴红鳍鲌生态习性与路亚钓法全解析",
    "author": "AImPhish",
    "publishDate": "2025-03-15",
    "previewText": "翘嘴，学名为红鳍鲌(Culter erythropterus Basilewsky)，是鲤形目鲤科鲌..."
  },
  {
    "id": 11,
    "title": "路亚钓鱼的全面解析：历史、发展、技术特点与优势",
    "author": "AImPhish",
    "publishDate": "2025-02-22",
    "previewText": "路亚钓鱼是一种源自西方的钓鱼方式，以其独特的技术特点和钓法风格在全球范围内广受欢迎。本报告将对路亚钓..."
  },
  {
    "id": 12,
    "title": "鱼探器在路亚钓法中的应用与影响：技术原理、功能及争议",
    "author": "AImPhish",
    "publishDate": "2025-02-22",
    "previewText": "鱼探器（Fish Finder）作为一种声纳工具，已成为现代钓鱼技术的重要组成部分。它通过声纳原理帮..."
  },
  {
    "id": 13,
    "title": "路亚钓法中的VIB：历史、分类、操作手法与使用心得",
    "author": "AImPhish",
    "publishDate": "2025-02-22",
    "previewText": "路亚钓法作为一种模仿弱小生物引发大鱼攻击的钓鱼方法，起源于欧美地区，约有一百多年的历史。在这众多的路..."
  },
  {
    "id": 8,
    "title": "路亚钓场、黑坑、管理场与练杆坑钓鱼技巧综合指南",
    "author": "AImPhish",
    "publishDate": "2025-02-20",
    "previewText": "钓鱼是一项集技巧、耐心和对鱼类习性理解于一体的休闲活动。在不同的钓鱼场所，如路亚钓场、黑坑、管理场和..."
  },
  {
    "id": 9,
    "title": "大口黑鲈（淡水鲈鱼）自然习性研究报告",
    "author": "AImPhish",
    "publishDate": "2025-02-20",
    "previewText": "大口黑鲈（Micropterus salmoides），又称加州鲈鱼、黑鲈，是一种世界性的黑鲈属游钓..."
  },
  {
    "id": 10,
    "title": "气压对鱼类及路亚钓法的影响：科学数据与实践经验",
    "author": "AImPhish",
    "publishDate": "2025-02-20",
    "previewText": "钓鱼是一项受多种环境因素影响的户外活动，其中气压作为关键气象参数，对鱼类行为和钓鱼效果具有显著影响。..."
  },
  {
    "id": 5,
    "title": "路亚钓法中的Neko钓组：历史、使用场景与技巧总结",
    "author": "AImPhish",
    "publishDate": "2025-02-18",
    "previewText": "Neko钓组是路亚钓法中一种独特的软饵钓组，近年来在中国钓鱼圈内逐渐流行开来。作为一种源自日本的精细..."
  },
  {
    "id": 6,
    "title": "德州钓组(Texas rig)全面解析：历史、使用场景、搭配技巧与操作技巧",
    "author": "AImPhish",
    "publishDate": "2025-02-18",
    "previewText": "德州钓组(Texas rig)作为路亚钓法中最基础且广泛应用的钓组之一，其在钓鱼领域的重要性不言而喻..."
  },
  {
    "id": 7,
    "title": "自由钓组(Free Rig)在路亚钓法中的历史、技巧与应用",
    "author": "AImPhish",
    "publishDate": "2025-02-18",
    "previewText": "路亚钓鱼作为一种模仿饵鱼运动的钓鱼方式，其钓组的选择与操作技巧对钓鱼成功与否至关重要。在众多钓组中，..."
  },
  {
    "id": 3,
    "title": "抽停米诺(Jerkbait)在路亚钓法中的使用时机、选择建议与技巧全解析",
    "author": "AImPhish",
    "publishDate": "2025-02-16",
    "previewText": "路亚钓法作为一种模仿自然饵鱼的钓鱼方式，其中抽停米诺(Jerkbait)是备受钓手青睐的假饵之一。抽..."
  },
  {
    "id": 4,
    "title": "路亚倒钓钓组使用技巧与心得",
    "author": "AImPhish",
    "publishDate": "2025-02-16",
    "previewText": "倒钓钓组（英文：Drop Shot Rig）是路亚钓法中一种极为重要的钓组，以其独特的钓法和高效的钓..."
  },
  {
    "id": 1,
    "title": "春季路亚鲈鱼技巧与找鱼方式全解析",
    "author": "AImPhish",
    "publishDate": "2025-02-15",
    "previewText": "春季是路亚鲈鱼的黄金季节，尤其是对于淡水鲈鱼（大口鲈、大口黑鲈）来说，这一时期鲈鱼的活性高，觅食积极..."
  },
  {
    "id": 2,
    "title": "路亚钓鱼中复合亮片的种类、使用方法和技巧",
    "author": "AImPhish",
    "publishDate": "2025-02-15",
    "previewText": "复合亮片是路亚钓鱼中极为重要的一种拟饵，因其高效、经济、使用简单而受到钓友们的广泛喜爱。复合亮片是一..."
  }
];

module.exports = articleIndex;
