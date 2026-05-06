const meta = {
  "generatedAt": "2026-05-06T17:17:00+08:00",
  "totalTerms": 276,
  "explainedTerms": 276
};

const JACKALL_GROUP = "jackall_rod_import";
const JACKALL_BRAND = "jackall";
const SHIMANO_GROUP = "shimano_rod_import";
const ARK_GROUP = "ark_rod_import";
const NORIES_GROUP = "nories_rod_import";
const DSTYLE_GROUP = "dstyle_rod_import";
const EVERGREEN_GROUP = "evergreen_rod_import";
const OLYMPIC_GROUP = "olympic_rod_import";
const ABU_GROUP = "abu_rod_import";
const MEGABASS_GROUP = "megabass_rod_import";

function evergreenSource(url) {
  return {
    "group": EVERGREEN_GROUP,
    "url": url
  };
}

function megabassSource(url) {
  return {
    "group": MEGABASS_GROUP,
    "url": url
  };
}

const techGlossary = {
  "ROCS™": {
    "text": "ROCS™ (Robotically Optimized Casting System) guide train for maximized casting distance with lighter lures",
    "text_simple": "机器人优化导环排列，重点提升轻量饵的出线顺畅度和抛投距离。",
    "sources": [
      {
        "group": "abu_rod_import",
        "url": "https://www.abugarcia.com/collections/rods/products/vendetta-casting-rod"
      },
      {
        "group": "abu_rod_import",
        "url": "https://www.abugarcia.com/collections/rods/products/veritas-casting-rod"
      }
    ],
    "groups": [
      "abu_rod_import"
    ]
  },
  "Powerlux® 100": {
    "text": "Powerlux® 100 delivers a 15% stronger* and 5% lighter** rod, while remaining lightweight and well balanced",
    "text_simple": "Powerlux 100 树脂系统用于减重并提升竿身强度，适合追求轻量、平衡和耐冲击的泛用竿。",
    "sources": [
      {
        "group": "abu_rod_import",
        "url": "https://www.abugarcia.com/collections/rods/products/veritas-casting-rod"
      },
      {
        "group": "abu_rod_import",
        "url": "https://www.abugarcia.com/collections/rods/products/veritas-bfs-spinning-rod"
      }
    ],
    "groups": [
      "abu_rod_import"
    ]
  },
  "Powerlux® 200": {
    "text": "36-ton graphite with Powerlux™ 200 resin technology for ultra-light thin blanks with superior impact and fracture resistance",
    "text_simple": "Powerlux 200 树脂技术用于更薄、更轻的竿胚，同时提高抗冲击和抗断裂能力。",
    "sources": [
      {
        "group": "abu_rod_import",
        "url": "https://www.abugarcia.com/collections/rods/products/veritas-tournament-casting-rod"
      },
      {
        "group": "abu_rod_import",
        "url": "https://www.abugarcia.com/collections/rods/products/beast-casting-rod"
      }
    ],
    "groups": [
      "abu_rod_import"
    ]
  },
  "Powerlux® 500": {
    "text": "Featuring exclusive Powerlux™ 500 resin technology for ultra-light thin blanks with superior impact and fracture resistance",
    "text_simple": "Powerlux 500 面向更高阶轻量竿胚，强调轻薄、强韧和高负载下的抗冲击表现。",
    "sources": [
      {
        "group": "abu_rod_import",
        "url": "https://www.abugarcia.com/collections/rods/products/fantasista-x-casting-rod"
      },
      {
        "group": "abu_rod_import",
        "url": "https://www.abugarcia.com/collections/rods/products/fantasista-x-spinning-rod"
      }
    ],
    "groups": [
      "abu_rod_import"
    ]
  },
  "Powerlux® 1000": {
    "text": "Powerlux® 1000 delivers Abu Garcia’s lightest and most sensitive rod ever",
    "text_simple": "Powerlux 1000 是 Abu Garcia 最高阶轻量高感竿胚树脂系统，核心是减重、灵敏度和强度兼顾。",
    "sources": [
      {
        "group": "abu_rod_import",
        "url": "https://www.abugarcia.com/collections/rods/products/zenon-casting-rod"
      },
      {
        "group": "abu_rod_import",
        "url": "https://www.abugarcia.com/collections/rods/products/zenon-spinning-rod"
      }
    ],
    "groups": [
      "abu_rod_import"
    ]
  },
  "IntraCarbon™": {
    "text": "IntraCarbon™ technology provides a lightweight barrier to improve durability without adding weight",
    "text_simple": "在不明显增加重量的前提下给竿身增加保护层，提升耐用性和抗负载能力。",
    "sources": [
      {
        "group": "abu_rod_import",
        "url": "https://www.abugarcia.com/collections/rods/products/vendetta-spinning-rod-v1"
      },
      {
        "group": "abu_rod_import",
        "url": "https://www.abugarcia.com/collections/rods/products/vendetta-casting-rod-v1"
      }
    ],
    "groups": [
      "abu_rod_import"
    ]
  },
  "CCRS™": {
    "text": "CCRS™ (Carbon Constructed Reel Seat)",
    "text_simple": "碳构造轮座，目标是减重、提升握持贴合度，并让竿身震动更直接传到手上。",
    "sources": [
      {
        "group": "abu_rod_import",
        "url": "https://www.abugarcia.com/collections/rods/products/vendetta-spinning-rod-v1"
      },
      {
        "group": "abu_rod_import",
        "url": "https://www.abugarcia.com/collections/rods/products/vendetta-casting-rod-v1"
      }
    ],
    "groups": [
      "abu_rod_import"
    ]
  },
  "2 piece ferrule locking mechanism": {
    "text": "2 piece ferrule locking mechanism for easy secure 2 pc design on select models",
    "text_simple": "两节型号使用的接节锁定结构，让多节大饵竿装配更牢，发力时接合处更稳定。",
    "sources": [
      {
        "group": "abu_rod_import",
        "url": "https://www.abugarcia.com/collections/rods/products/beast-casting-rod"
      }
    ],
    "groups": [
      "abu_rod_import"
    ]
  },
  "X45フルシールド": {
    "text": "X45フルシールド（＝X45コブラシールド）",
    "text_simple": "通过交叉碳布抑制竿身扭转，让抛投、扬竿和控鱼时力量传递更稳定。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/dehighro-grandee-spec/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "エアセンサーシート": {
    "text": "軽量化・高強度・高感度を実現するカーボンファイバー入り「エアセンサーシート」。",
    "text_simple": "碳纤维增强轮座，重点是减重、提高强度和手感反馈。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/dehighro-grandee-spec/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "SVFカーボン": {
    "text": "SVFカーボン",
    "text_simple": "高密度低树脂碳布思路，追求更轻、更强和更清晰的竿身反馈。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/dehighro-grandee-spec/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "ステンレスSICガイド": {
    "text": "ガイドはステンレスSIC使用。",
    "text_simple": "不锈钢框架 SiC 导环，兼顾耐用性和顺滑出线。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/dehighro-grandee-spec/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "グルーブドセンターグリップ": {
    "text": "溝加工を施した「グルーブドセンターグリップ」を採用。指の滑りを防止し、適度なホールド感を維持することができる。",
    "text_simple": "握把中央做沟槽处理，手指定位更稳，长时间操作不容易滑手。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/dehighro-grandee-spec/"
      },
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/dehighro/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "ショートコルクグリップ": {
    "text": "スピニングモデルには青木がこだわりぬいたショートコルクグリップを採用。より繊細な操作が可能に。",
    "text_simple": "直柄短软木握把，减少干扰，让轻量精细操作更灵活。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/dehighro-grandee-spec/"
      },
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/dehighro/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "コンパクトEVAリアグリップ": {
    "text": "コンパクトEVAリアグリップを採用。エンドプレートにはモデル名の刻印を配した。",
    "text_simple": "短后握把降低拖赘感，适合频繁抛投、抖动和精细控饵。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/dehighro-grandee-spec/"
      },
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/dehighro/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "Low Modulusカーボン": {
    "text": "しなやかさと粘りを兼ね備えた低弾性カーボン“Low Modulus”を採用。",
    "text_simple": "低弹性碳素材让竿身更柔顺有粘性，适合中层游动和移动饵的跟随。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/dehighro-grandee-spec/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "異なる弾性率カーボン": {
    "text": "異なる弾性率のカーボンと最新素材を組み合わせることで、機種ごとに最適なテーパーデザインを実現した。",
    "text_simple": "按型号混合不同弹性的碳素材，让每个子型号获得对应技法需要的调性。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/dehighro/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "チタンSICガイド": {
    "text": "ガイドはチタンSIC使用。※EXTREME SPECはTORZITE仕様。",
    "text_simple": "钛框 SiC 导环更轻，能降低竿梢负担并提升控线灵敏度。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/dehighro/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "フォアグリップデザイン": {
    "text": "全ての無駄を排除したフォアグリップデザイン。操作性の向上、軽量化を可能にした。",
    "text_simple": "精简前握把，减少多余重量，让手部操作和竿身反馈更直接。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/dehighro/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "フィネススイミング向けガイドセッティング": {
    "text": "ラインスラッグを出しながらシェイクをしやすいテーパーとガイドセッティングを追求することで、最高のフィネススイミングロッドに仕上げた。",
    "text_simple": "导环配置服务于松线抖动和中层游动，让细线轻饵更容易保持滚动姿态。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/dehighro/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "ハイクオリティカーボン": {
    "text": "ハイクオリティカーボンと中弾性ロングソリッドの極上なまでの操作感で軽量ルアーを意のままに飛ばし、操り、掛ける。",
    "text_simple": "高品质碳素材提升轻量饵的抛投、操控和刺鱼反馈。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/dehighro/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "中弾性ロングソリッド": {
    "text": "ハイクオリティカーボンと中弾性ロングソリッドの極上なまでの操作感で軽量ルアーを意のままに飛ばし、操り、掛ける。",
    "text_simple": "中弹性长实心竿稍更容易加载轻量饵，也能保留轻咬和底部变化反馈。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/dehighro/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "TORZITEガイド": {
    "text": "ガイドはチタンSIC使用。※EXTREME SPECはTORZITE仕様。",
    "text_simple": "EXTREME SPEC 使用 Torzite 导环，重点是轻量化和更顺滑的细线出线。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/dehighro/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "XULソリッドティップ": {
    "text": "XULソリッドを採用する事で水中の違和感さえも把握。",
    "text_simple": "超轻量级实心竿稍放大细微信号，适合极轻饵和短促咬口判断。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/dehighro/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "ナノマテリアル配合BLUE TREKブランクス": {
    "text": "ナノマテリアル配合のBLUE TREKブランクスを採用する事で不意なビッグフィッシュでも逃さない粘りを実現しました。",
    "text_simple": "BLUE TREK 的纳米材料竿身强调韧性和后段支撑，遇到大鱼也更能稳住。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek-saber-series/"
      },
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek-2/"
      },
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek-10th-anniversary-model/"
      },
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "SABER SERIES EVAグリップ": {
    "text": "SABER SERIESはEVAのグリップ採用",
    "text_simple": "SABER 系列专用 EVA 握把，偏向重负载操作和稳定握持。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek-saber-series/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "セパレートグリップ": {
    "text": "セパレートグリップ採用モデルにはブランクスに【DSTYLE】のプリント入り。",
    "text_simple": "分体握把减轻后段重量，抛投和竿尖操作更利落。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek-saber-series/"
      },
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek-2/"
      },
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "圧縮コルクグリップ": {
    "text": "リアグリップにはビックサイズに対応の圧縮コルクグリップ。",
    "text_simple": "后握把使用压缩软木，面对大鱼和大负载扬竿时更抗压耐用。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek-saber-series/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "太めフロロ/PE対応ガイドセッティング": {
    "text": "ガイドセッティングは太めのフロロカーボンラインやPEを想定したセッティング。",
    "text_simple": "导环按较粗氟碳线和 PE 线使用设计，出线和控线更稳定。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek-saber-series/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "ソリッドティップ": {
    "text": "ソリッドティップを搭載する事でより軽量ルアーを繊細に扱えるようになり、ショートバイトでもバスを逃しません。",
    "text_simple": "实心竿稍更容易加载轻饵，也能降低短咬脱口概率。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek-2/"
      },
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "2ピース構造": {
    "text": "『自分らしいフィッシングライフを支える２ピースモデル。』",
    "text_simple": "两节结构提升携带和收纳便利，同时保留正常实战长度。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek-2/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "EVAグリップ": {
    "text": "2ピースモデルはEVAのグリップ採用",
    "text_simple": "EVA 握把耐用、好维护，适合高频出勤和多场景携带。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek-2/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "ジョイントマーカー": {
    "text": "ジョイント部分はガイドを真っすぐに継ぐようにマーカーを設置",
    "text_simple": "接节定位标记帮助导环快速对正，减少两节竿装配偏差。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek-2/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "ULパワーソリッドティップ": {
    "text": "ULパワーのソリッドティップでバイトを乗せ、Lパワーのバットで魚を制する。",
    "text_simple": "UL 实心竿稍负责吃口和轻饵，L 级后段负责控鱼。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek-2/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "PE対応DSTYLEオリジナルガイドセッティング": {
    "text": "ガイドセッティングは近年のPEラインでの使用も考慮したDSTYLEオリジナルセッティング。",
    "text_simple": "DSTYLE 原厂 PE 对应导环配置，细 PE 出线和控线更不容易乱。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek-2/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "ミドスト/ボトスト向けガイドセッティング": {
    "text": "ジグヘッドやダウンショットをシェイクしやすいテーパーとガイドセッティングを追求することで、よりミドスト、ボトストの操作性能を高めました。",
    "text_simple": "为中层泳姿和底层游动抖线设计，重点是松线控制和连续滚动动作。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek-2/"
      },
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "MLパワーソリッドティップ": {
    "text": "MLパワーソリッドティップを採用することでライトリグ全般から表層系プラグ、i字系、虫系など幅広く対応。",
    "text_simple": "ML 实心竿稍兼顾轻钓组和表层小硬饵，远投后仍保留操作反馈。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek-2/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "PEライン仕様ガイド": {
    "text": "ガイドもPEライン仕様の専用セッティング。",
    "text_simple": "导环按 PE 线出线设计，远投和抖线时更稳定。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek-2/"
      },
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "高弾性ブランクス": {
    "text": "オリジナルモデルからより高弾性ブランクスに変更",
    "text_simple": "竿身比原版更高弹，操作回弹和轻饵反馈更直接。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek-10th-anniversary-model/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "チタンSiCガイド": {
    "text": "ガイド：チタン、Sic",
    "text_simple": "钛框 SiC 导环，降低前端重量并保持顺滑耐磨。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek-10th-anniversary-model/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "カラースレッド": {
    "text": "",
    "text_simple": "装饰绕线配色，用来形成周年款外观识别，不直接改变竿身调性。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek-10th-anniversary-model/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "ULソリッドティップ": {
    "text": "ULソリッドティップを搭載でショートバイトや僅かなボトムの変化を感知。",
    "text_simple": "UL 实心竿稍能放大短咬和细微底部变化，适合轻量钓组。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek-10th-anniversary-model/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "ミドスト/PE対応ガイドセッティング": {
    "text": "ガイドセッティングはミドストとPEを想定した仕様。",
    "text_simple": "导环按中层泳姿和 PE 线使用设计，利于松线抖动和长距离控线。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "Hパワーソリッドティップ": {
    "text": "軽量ルアーの扱いやすさと食わせと強さを実現する為に搭載したHパワーのソリッドティップ。",
    "text_simple": "H power 实心竿稍兼顾轻饵入口和重障碍控鱼强度。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "PE対応ガイドセッティング": {
    "text": "ガイドもPE対応セッティング。",
    "text_simple": "PE 对应导环配置，适合强力精细、远投和覆盖区控线。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "Lパワーソリッドティップ": {
    "text": "Lパワーソリッドティップを採用することでライトリグ全般から表層系プラグ、i字系、虫系など幅広く対応。",
    "text_simple": "L power 实心竿稍覆盖轻钓组、表层小硬饵、I 字和虫系等轻量路线。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "フルグラスブランク": {
    "text": "グラス１００％のフルグラスブランク採用のファストムービングモデル。",
    "text_simple": "全玻纤竿身追求柔顺跟随，硬饵咬口更容易吃进去。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "ストレートグリップ": {
    "text": "ストレートグリップモデル。",
    "text_simple": "直握把提升卷饵和移动饵连续操作时的握持稳定性。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "BLUE TREK独自配合低弾性カーボンブランクス": {
    "text": "BLUE TREK独自配合の低弾性カーボンブランクス採用のファーストムービングモデル。",
    "text_simple": "BLUE TREK 自有低弹性碳竿身，让小型硬饵抛投、搜索和咬口追随更舒服。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "LDBガイド": {
    "text": "ティップセクションは糸絡みを考慮しLDBガイドを採用。",
    "text_simple": "竿稍段采用 LDB 导环，重点减少 PE 或松线操作时的缠线。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "パワーフィネスSPグリップ": {
    "text": "グリップデザインもシェイク疲れを軽減するべくパワーフィネスSP仕様。",
    "text_simple": "强力精细专用握把，降低长时间抖竿和覆盖区操作的疲劳。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "ヘビーアクションソリッドティップ": {
    "text": "ヘビーアクションのソリッドティップ。",
    "text_simple": "重强度实心竿稍，把覆盖区钓组的入口性和重障碍控鱼结合起来。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "オールWフットガイド": {
    "text": "ロッド剛性感とタフネスを追求したオールＷフットガイド仕様。",
    "text_simple": "全双脚导环提升导环固定强度，适合大饵、重负载和强力控鱼。",
    "sources": [
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek/"
      }
    ],
    "groups": [
      "dstyle_rod_import"
    ]
  },
  "富士工業社製SiCガイドリング": {
    "text": "全機種全ガイドに放熱性・スベリ・硬度に優れた富士工業社製SiCガイドリングを採用しています。",
    "text_simple": "导环内环更顺滑耐磨，出线更稳定。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/revoltage-rod/revoltage2023/"
      },
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/revoltage-rod/revoltage-2pcs/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "トレカ®T1100G": {
    "text": "高強度素材トレカ®T1100Gを適材適所に採用。ロッド全体のトルクが向上したことで、巻く・掛ける・寄せるを高次元で行う事が可能です。\nEVERGREEN: 『トレカ®T1100G』＆『ナノアロイ®技術』 ナノレベル（10億分の1）で繊維構造を緻密にコントロールする焼成技術により高強度と高弾性率化を両立し、30トンを頂点に弾性率が高くなるほど強度が低下するというカーボン繊維の力学特性マップ（下図）を塗り替えた画期的素材『トレカ®T1100G』と、革新的テクノロジーをベースに引張強度と耐衝撃性を両立したマトリクス樹脂技術『ナノアロイ®技術』。",
    "text_simple": "高强度碳纤维，提升竿身强度、韧性和控鱼稳定性。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/revoltage-rod/revoltage2023/"
      },
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/revoltage-rod/revoltage-2pcs/"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc63mhrTg40x.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSuperSteedGtR.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraGt.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBlackRavenExtremeRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/news_html/toraycat1100g_nanoalloy.php"
      }
    ],
    "groups": [
      "jackall",
      "evergreen_rod_import"
    ]
  },
  "グリップジョイント構造": {
    "text": "長尺スペックにはグリップジョイント構造採用。採用機種：C67MH+・C68MH・C69L+BF・C610M・C71H-ST・C73H・C711H・S68MH+・S69UL+・S78ML+",
    "text_simple": "长尺型号采用握把接节，兼顾长度和收纳。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/revoltage-rod/revoltage2023/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "UD Glass": {
    "text": "C62L-GCとC66ML-GCは、ユニディレクション(単一方向)からなるガラス繊維素材(UD Glass)とカーボン素材を合わせて成形したグラスコンポジットモデルです。",
    "text_simple": "玻纤和碳纤组合，保留柔顺追随并减轻迟钝感。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/revoltage-rod/revoltage2023/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "グラスコンポジットブランク": {
    "text": "C62L-GCとC66ML-GCは、ユニディレクション(単一方向)からなるガラス繊維素材(UD Glass)とカーボン素材を合わせて成形したグラスコンポジットモデルです。グラスコンポジットブランク採用のファストムービングモデル。",
    "text_simple": "竿身更柔顺，硬饵咬口更不容易弹开。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/revoltage-rod/revoltage2023/"
      },
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/bpm/bpm-1pc/"
      },
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/bpm/bpm-2pc-model/"
      },
      {
        "group": "dstyle_rod_import",
        "url": "https://dstyle-lure.co.jp/products/blue-trek/"
      }
    ],
    "groups": [
      "jackall",
      "dstyle_rod_import"
    ]
  },
  "トレカ®M40X": {
    "text": "高圧縮強度・高弾性率素材 トレカ®M40Xを適材適所に採用。特に感度を要求されるメソッドに特化した機種に採用し、高感度・軽量化及び操作性の向上を実現しました。\nEVERGREEN: 『トレカ®M40X』＆『ナノアロイ®技術』 技術難易度が高く、大きな課題とされる繊維強度と高弾性率の両立を極限まで追求し、高弾性率（40t）を保持したまま繊維強度を約30％向上させたトレカ最新カーボン素材。革新的なマトリクス樹脂技術『ナノアロイ®技術』と組み合わせることで、従来の40tカーボンプリプレグと比較して引張強度・圧縮強度・耐衝撃性が大幅に向上、理想的な剛性設計が可能となり製品の軽量化にも貢献。",
    "text_simple": "高弹高强度碳纤维，用在需要轻量、高感度和操作响应的型号。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/revoltage-rod/revoltage2023/"
      },
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/revoltage-rod/revoltage-2pcs/"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc63mhrTg40x.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBlackRavenExtremeRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Gt3rsC71mhTg40x.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Tkss611mhTg40x.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Nims86lEx.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/news_html/toraycam40x.php"
      }
    ],
    "groups": [
      "jackall",
      "evergreen_rod_import"
    ]
  },
  "30tカーボンソリッドティップ": {
    "text": "30tカーボンソリッドティップを採用。高い感度と操作性を実現し、小さなあたりも感知しこちらから掛けに行く攻撃的なセッティングです。",
    "text_simple": "竿稍更敏感，小口和轻量操作更容易判断。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/revoltage-rod/revoltage2023/"
      },
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/revoltage-rod/revoltage-2pcs/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "スパイラルガイドセッティング": {
    "text": "約120°に設定されたスパイラルガイドセッティングがアクション時にガイド位置を真下方向に近づけ、操作時の違和感を排除。さらにPEラインの糸絡みを極限まで抑制します。",
    "text_simple": "导环绕到下方，PE 操作时更不容易缠线。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/revoltage-rod/revoltage2023/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "ロングソリッドティップ": {
    "text": "ロングソリッドを採用することでシェイク中のバイトでも魚に違和感を与えることなく食い込みます。",
    "text_simple": "长实心竿稍更容易让鱼吃进去，轻咬更稳。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/revoltage-rod/revoltage2023/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "Kガイド": {
    "text": "固定概念に囚われることなく、軽さと糸抜けのトータルバランスを吟味しKガイドとLYガイドを適材適所に採用。\nNORIES: KガイドをメインにトップガイドがMNST。PEライン使用にも対応。\nEVERGREEN: ■ ガイドシステム 小口径でスリムな最新Kガイドをオリジナルセッティング（FujiチタンフレームSiCリングガイド）。一気にチョークし一直線状にラインを放出させることで、飛距離アップを実現しました。",
    "text_simple": "K 导环配置降低缠线风险，让 PE 或较细线出线更稳定。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/revoltage-rod/revoltage2023/"
      },
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/revoltage-rod/revoltage-2pcs/"
      },
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-ltt/"
      },
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-hard-bait-special/"
      },
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-jungle/"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/ThePhalanx.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Hfac511mhst.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Hfac66mst.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Hfac67mhst.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Hfac70hst.html"
      }
    ],
    "groups": [
      "jackall",
      "nories_rod_import",
      "evergreen_rod_import"
    ]
  },
  "LYガイド": {
    "text": "固定概念に囚われることなく、軽さと糸抜けのトータルバランスを吟味しKガイドとLYガイドを適材適所に採用。",
    "text_simple": "和 K 导环组合，兼顾轻量和出线平衡。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/revoltage-rod/revoltage2023/"
      },
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/revoltage-rod/revoltage-2pcs/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "全ガイドKガイド": {
    "text": "全ガイドKガイド機種:S510SUL-ST・S68MH＋",
    "text_simple": "全导环采用 K 导环，PE 出线更省心。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/revoltage-rod/revoltage2023/"
      },
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/revoltage-rod/revoltage-2pcs/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "ショートソリッドティップ": {
    "text": "ティップセクションはバイトを感知した直後の初期掛かりを確実に決めるショートソリッド仕様のエクストラウルトラライトクラス。",
    "text_simple": "短实心竿稍更利于微小咬口后的初期挂鱼。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/revoltage-rod/revoltage2023/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "大径トップ〜第4ガイド": {
    "text": "【S69UL＋】のみに採用。竿先にルアーの重みを乗せやすく軽量ルアーをキャストし易く、PEラインとの相性も抜群です。水面でのピクピクメソッドにおいても竿先が自発的に揺れる為「シェイク疲れ」を起こしにくい設計です。",
    "text_simple": "前段导环更大，轻饵抛投和 PE 控线更顺。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/revoltage-rod/revoltage2023/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "ダブルロックシステム": {
    "text": "【S78ML＋】のみ、スクリューロックにダブルロックシステムを採用しています。大型のフィッシュイーターとのファイトを想定し、ファイト中の予期せぬ緩みを防ぐ仕様です。",
    "text_simple": "轮座锁紧更稳，搏鱼时不易松。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/revoltage-rod/revoltage2023/"
      },
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/revoltage-rod/revoltage-2pcs/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "富士工業製アルコナイトガイド": {
    "text": "ガイドは感度と強度を両立した富士工業製アルコナイトガイド 、トップはSiCを標準装備。世界基準の安心のクオリティです。",
    "text_simple": "导环兼顾强度和感度，日常使用更稳定。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/bpm/bpm-1pc/"
      },
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/bpm/bpm-2pc-model/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "SiCトップガイド": {
    "text": "トップはSiCを標準装備。",
    "text_simple": "竿尖导环更顺滑耐磨，出线更稳。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/bpm/bpm-1pc/"
      },
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/bpm/bpm-2pc-model/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "Fujiガイド": {
    "text": "ガイドは感度と強度を両立した富士工業製ガイドを使用。世界基準の安心のクオリティです。",
    "text_simple": "导环质量稳定，感度和强度更均衡。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/bpm/bpm_g2/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "1&ハーフ設計": {
    "text": "ロッドのアクションと携行性の良さを重視したワン&ハーフ設計を採用。公共交通機関を利用した釣行でもストレスを感じさせません。",
    "text_simple": "兼顾一节竿动作和两节竿便携。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/bpm/bpm_g2/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "Fuji TVSリールシート": {
    "text": "スピニングモデルにはFuji TVS（アップロック仕様）を採用し、リールを含めたパーミングのし易さが、キャスト時の安定したアキュラシー(精度)と操作性の向上をもたらします。",
    "text_simple": "直柄握持更贴手，抛投和控饵更稳。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/bpm/bpm_g2/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "カーボンソリッドティップ": {
    "text": "張りのあるカーボンソリッドティップは僅かな水の抵抗を感じ易く、操作中のルアーが水中の何処を通っているのかをイメージするのに重要な役割を果たします。\nEVERGREEN: 激戦区対応ソリッドティップモデル。",
    "text_simple": "碳实心竿稍提升轻量钓组的咬口识别和精细操作能力。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/bpm/bpm_g2/"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc63mhrTg40x.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc66mrStSpg.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc67mhfStss.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStingraySuperShake.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStingraySuperShakeB.html"
      }
    ],
    "groups": [
      "jackall",
      "evergreen_rod_import"
    ]
  },
  "Fuji ECSリールシート": {
    "text": "リールシートはベイトキャスティングモデルにFuji ECSを採用し、リールを含めたパーミングのし易さが、キャスト時の安定したアキュラシー(精度)と操作性の向上をもたらします。\nEVERGREEN: ■ リールシートデザイン 軽量コンパクトなブランクタッチFuji ECSリールシートを採用。精悍なブラックポリッシュのカラーリング。",
    "text_simple": "卷线器座影响握持贴合、重量和手部感度传递。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/bpm/bpm_g2/"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc63mhrTg40x.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSuperSteedGtR.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraGt.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBlackRavenExtremeRs.html"
      }
    ],
    "groups": [
      "jackall",
      "evergreen_rod_import"
    ]
  },
  "Fuji製オールダブルフットガイド": {
    "text": "PEラインの絡みを抑える、Fuji製のオールダブルフットガイドを最適化したセッティングです。",
    "text_simple": "导环支撑更强，PE 线更不容易缠。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/nazzy-choice/nazzy-choice-cacaoblack/"
      },
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/nazzy-choice/nazzychoice_2020/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "ステンレスフレームSiCトップガイド": {
    "text": "トップガイドはステンレスフレーム/SiCガイドを採用。",
    "text_simple": "竿尖导环更顺滑，PE 和尼龙出线更稳。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/nazzy-choice/nazzy-choice-cacaoblack/"
      },
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/nazzy-choice/nazzychoice_2020/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "ステンレスフレームアルコナイトガイド": {
    "text": "トップガイド以外はステンレスフレーム/アルコナイトガイドを採用。",
    "text_simple": "导环强度和耐用性更稳定。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/nazzy-choice/nazzy-choice-cacaoblack/"
      },
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/nazzy-choice/nazzychoice_2020/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "グラスコンポジットティップ": {
    "text": "ルアーアクションのポテンシャルを最大限に引き出し、ナマズのバイトをしっかり乗せるグラスコンポジットティップを搭載。",
    "text_simple": "竿稍更柔，鲶鱼咬口更容易吃进去。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/nazzy-choice/nazzy-choice-cacaoblack/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "グラスコンポジット素材": {
    "text": "しなやかで正確なキャストを繰り出すグラスコンポジット素材を採用。ナマズのバイトを弾かずにフッキングに持ち込むと共に、ファイトではロッドの曲がりで一気にナマズを寄せ付けます。",
    "text_simple": "玻纤复合素材更柔顺，鲶鱼咬口不容易弹开。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/nazzy-choice/nazzychoice_2020/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "並継構造": {
    "text": "接合部の強化やパワーをスムースに伝達できる並継ぎ構造を採用。",
    "text_simple": "接节更稳，发力传递更顺。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/nazzy-choice/nazzy-choice-cacaoblack/"
      },
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/nazzy-choice/nazzychoice_2020/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "PMNST6トップガイド": {
    "text": "トップガイドはガイド径が大きく、糸抜けも良いPMNST6を採用。",
    "text_simple": "竿尖导环口径更大，出线更顺。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/nazzy-choice/nazzy-choice-cacaoblack/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "スパイラルガイド": {
    "text": "特にPEラインを使用した際にライントラブルを軽減します。",
    "text_simple": "PE 线更不容易缠，夜间控线更省心。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/nazzy-choice/nazzy-choice-sg/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "蓄光スレッド": {
    "text": "ティップ側のガイドには蓄光スレッドを巻くことで、より優れた視認性を確保しました。",
    "text_simple": "竿尖导环更容易看清，夜钓更方便。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/nazzy-choice/nazzy-choice-sg/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "グラスコンポジットブランクス": {
    "text": "しなやかで正確なキャストを繰り出すグラスコンポジット。ロッドの曲がりで一気にナマズを寄せ付けます。",
    "text_simple": "竿身更柔顺，抛投和鲶鱼控鱼更稳定。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/nazzy-choice/nazzy-choice-sg/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "ソフトティップ": {
    "text": "よりソフトなティップを搭載する事によって、ルアーのポテンシャル（ルアーの動き）を最大限に引き出します。",
    "text_simple": "竿稍更软，顶部水面饵动作更容易做出来。",
    "sources": [
      {
        "group": "jackall_rod_import",
        "url": "https://www.jackall.co.jp/bass/products/rod/nazzy-choice/nazzy-choice-sg/"
      }
    ],
    "groups": [
      "jackall"
    ]
  },
  "ANTI LOCK JOINT": {
    "text": "ANTI LOCK JOINT 是抑制接节部分露出太多的特殊构造，竿身后端部能在靠近手的位置停止的构造。（在矶· 抄柄中采用）",
    "text_simple": "接节外露更少，抄柄收放和持握更顺。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/saltwater/others/a075f00003e2g17qaa.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "CARBONSHELL GRIP": {
    "text": "颠覆现有常识的轻量高感度中空碳纤维握把\n渔轮座握把部分将碳布进行中空构造后的次时代握把构造。从竿梢部感受到的振动和传达性大幅提升，这个轻量高感度握把颠覆了至今为止的常识。",
    "text_simple": "中空碳纤维握把更轻更敏感，水下反馈更直接。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/bass/bass/a071000002nx8zyaaz_p.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "CI4+": {
    "text": "在SHIMANO技术的CI4 基础上再度进化的CI4+ 材质。相比以往的树脂材质，具有更轻量强度更高的特点。",
    "text_simple": "渔轮座等部件更轻、更有强度，长时间操作负担更低。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/bass/trout/a075f00004awdnkqa1.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "DURAMESH PROTECTOR": {
    "text": "减少破损概率并防止抄柄损伤的特殊强化构造\n能够保护易受力的#1部位，这个技术在最外层施加特殊保护素材，防止伤口和破损。并且，内部有一根采用特殊素材的极粗线，万一第一节破损也能让你将重要的目标鱼和抄网回收。",
    "text_simple": "强化易受力部位，降低抄柄损伤和断裂风险。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/saltwater/others/a075f00003e2g17qaa.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "Dyna Balance设计": {
    "text": "让竿身能够感受假饵振动并引起共振的设计。不仅依靠人类的感知，更将鱼竿的运动数值化分析，从而创造出具有理想弯曲度的鱼竿调性。（在淡水路亚竿中采用）",
    "text_simple": "通过竿身动态分析优化弯曲，让控饵振动和竿身反馈更协调。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/bass/bass/a071000002nx8zyaaz_p.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "EXCITETOP": {
    "text": "竿梢采用特殊设计，传递给钓友眼睛能看到、手部能够感觉到的中鱼感受，实现了前所未有的高感度，并且大幅改善抛竿时的入水感。",
    "text_simple": "竿梢反馈更清晰，咬口能看得到也更容易传到手上。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/bass/bass/a075f00003xhfb5qam.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "G-CLOTH PROTECTOR": {
    "text": "结节处是集中承受负担的部分，G-CLOTH PROTECTOR能有效减少损伤的风险，在玉口部进行了强化。",
    "text_simple": "强化接节玉口，减少多节竿接合处受损。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/bass/bass/a075f00003cx3i1qak.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "HI-POWER X": {
    "text": "有效减少抛投、搏鱼时鱼竿的扭曲和晃动。在SPIRAL X 结构外层或普通纵横交织碳布的最外层之上卷上X形碳布。根据这一特性，尽可能使鱼竿的弯曲方向与钓友的意图一致，充分发挥出鱼竿具备的能力。",
    "text_simple": "抑制抛投和搏鱼时的扭曲，让竿身发力方向更稳定。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/bass/trout/a075f00004awdnkqa1.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "HI-POWER X FULLSOLID": {
    "text": "纤细且弯曲性优秀的全实心竿梢，采用抑制晃动的强化构造，竿身部分利用X包裹碳布加强，有效抑制了歪扭问题。一般的实心竿梢会有少许的歪扭问题也能有效抑制，实现更舒适的操控手感。",
    "text_simple": "全实心竿梢更稳，细腻弯曲同时减少晃动。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/saltwater/jigging/a075f000041qg4lqac.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "HI-POWER X SOLID": {
    "text": "对竿梢柔软的实心部分采用极细碳布进行强化。不损失实心竿梢的诱鱼性及柔软度的前提下，抑制多余晃动和力传输的损失。使抛投精度、操作性、感度得到全面提高。",
    "text_simple": "强化实心竿梢，保留柔软度同时提升抛投精度、操作和感度。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/bass/bass/a075f00003yfzrsqam.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "HIGH RESPONSE SOLID": {
    "text": "先调子的竿梢设计。小型软胶假饵的操作性更强，感受到中鱼后能够立刻刺鱼的高灵敏度设计，对应积极进攻的钓法。",
    "text_simple": "竿梢响应更快，小软饵操作和主动刺鱼更直接。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/bass/bass/a075f000048lz1kqae.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "LENGTH SWITCH SYSTEM": {
    "text": "仅更换部件就可以快速改变鱼竿全长，应对不同钓法和钓场的长度，让你作钓范围更广泛。",
    "text_simple": "通过更换部件改变竿长，适应不同钓场距离和操作方式。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/bass/bass/a075f000048l0loqaq.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "MULTI PIECE ULTIMATE BLANKS DESIGN": {
    "text": "提升鱼竿刚性的构造，考虑重量因素，在重要部位采用并发挥效果，维持强度的同时实现轻量化，是用于多节竿的适材适所设计。",
    "text_simple": "多节竿按部位配置结构，兼顾轻量、强度和便携。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/bass/bass/a075f00003cx3i1qak.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "MUSCLE CARBON": {
    "text": "比普通碳布有更高的碳纤维密度，借由大量减少树脂含量，提升碳纤维含量并减少间隙。",
    "text_simple": "提高碳纤维密度、减少树脂比例，让竿身更扎实。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/bass/bass/a075f000032zh6lqae.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "NANO PITCH": {
    "text": "竿身在碳布包裹过程中采用细宽度碳布包裹的制法。这样让鱼竿竿身更能够承受均一压力，在弯曲时弧度更好，大幅提升了鱼竿的强度，纤细的编织法让外部设计看上去更高级。",
    "text_simple": "细宽度碳布包裹让受力更均匀，竿身强度和弯曲连续性更好。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/bass/bass/a071000002nx8zyaaz_p.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "SCREW LOCK JOINT": {
    "text": "提升接节部的固定力、兼顾易拆性的特殊加工规格。在接节时拧紧两节即可提升固定力，拆的时候也能易拆节。（海水竿采用）",
    "text_simple": "接节锁定更牢，海水竿高负荷操作时更不易松动。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/saltwater/casting/a075f000048ltljqau.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "SOFTUBE TOP": {
    "text": "在特殊设计的轻量高感度空心竿梢中追加了柔韧性。受力时能够展现顺畅弯曲度。",
    "text_simple": "空心竿梢加入柔韧性，轻量操控时弯曲更顺。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/bass/trout/a075f000047jjufqaa.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "SPIRAL X": {
    "text": "从根本提升鱼竿性能，克服了歪扭和变形的问题。\n［SPIRAL X］是鱼竿碳纤维的内层和外层将碳布由逆斜向密编织的三层构造，内外斜向编织能够保持鱼竿轻量并且实现高强度和防歪扭的性能。无论是抛投还是搏鱼时能更好施展瞬间爆发力，保持整体轻量并提升上鱼能力的SHIMANO自创鱼竿基本构造。",
    "text_simple": "三层斜向碳布结构抑制扭曲，提升抛投和控鱼稳定性。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/bass/bass/a075f00004dex0bqah.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "SPIRAL X CORE": {
    "text": "采用高强度素材后再次进化的鱼竿主要构造。\nSHIMANO自创设计・制造方法并追求着鱼竿抗弯扭、抗晃动、抗破坏、以及各方向抵抗强度。鱼竿高性能所依靠的是SHIMANO的编织技术「SPIRAL X」，搭配东丽公司技术的高强度切割碳布，实现了更高层次的高强度化。抗歪扭强度和抗压强度是普通鱼竿构造的1.4倍和2.5倍。和「SPIRAL X」对比，实现了抗歪扭强度提升约10%，抗压强度提升了约15%。*以上数据为禧玛诺产品对比，内部测试所得。",
    "text_simple": "比 SPIRAL X 更高强度的核心结构，抗扭、抗压和竿身稳定性更强。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/bass/trout/a075f00004awdnkqa1.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "TAFTEC": {
    "text": "重新设计制作方法并配合挑选素材，以此打造出比以往竿梢更为强韧的碳纤维实心竿梢。与TAFTECα相比，竿梢更具张力和灵敏度。",
    "text_simple": "实心竿梢更强韧、更有张力，兼顾灵敏度。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/bass/bass/a075f00003cps6eqav_p.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "TAFTECα": {
    "text": "在TAFTEC 竿梢的基础上减少了张力，并缩小竿梢的直径而强度维持不变, 做到了柔软纤细的实心竿梢。",
    "text_simple": "更细更柔的实心竿梢，轻口和精细操作更容易表现。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/bass/bass/a075f00003cps6eqav_p.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "TAFTEC∞": {
    "text": "新开发的TAFTEC∞和公司以往实心竿梢对比弯曲强度提升3 倍、弯曲量提升5 倍，凌驾于TAFTECα的高强度实心竿梢。",
    "text_simple": "高强度实心竿梢，弯曲强度和弯曲量明显提升。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/bass/bass/a075f00003xhfb5qam.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "UBD": {
    "text": "从100种以上的材料中选取合适材质，在竿梢和握把等部位的中层部位分别使用的卷上碳布的新结构。去掉竿身多余部分，造就目的明确的卓越竿身。是强度和力量俱全的轻量化新构造。",
    "text_simple": "按竿身不同部位配置材料，去掉多余重量并保留强度和力量。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/bass/bass/a075f00003xhfb5qam.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "X SEAT": {
    "text": "发挥出鱼竿性能，适材适所的制造技术。\n专注于鱼竿竿身制造，目标是发挥出其最大性能，能够回应钓友思想的是最重要的一环。随着时间的推移，理想的握把也在不断的变化，SHIMANO以无压力钓鱼作为目标、追求“易握手感”，形成了崭新的思想。\n※1702R-2、1703R-2、1704R-2、1785RS-2、17114R-2",
    "text_simple": "握把和轮座按持握压力优化，减少疲劳并提升操控稳定性。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/bass/bass/a075f0000316qzcqae_p.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "X 导环": {
    "text": "SHIMANO自创导环[X导环]，进一步发挥出鱼竿的性能。\n根据鱼竿制造商观点所诞生的[X导环] 是能够将竿身具备的潜在能力120%发挥而诞生的。融合了抛投性能的高次元SHIMANO高性能导环。",
    "text_simple": "Shimano 自有导环，提升出线、抛投和竿身性能释放。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/bass/trout/a075f00004awdnkqa1.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "全碳纤维一体成型握把": {
    "text": "不使用EVA或软木，打破常识的高感度握把。\n全碳纤维一体成型握把是将渔轮座后方端至握把采用中空构造并一体成型的握把构造。去除多余构造和妨碍因素，让竿梢位置的振动能更好传递，颠覆传统的超感度握把。",
    "text_simple": "握把整体中空碳纤维化，振动传递更直接，感度更高。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/bass/trout/a075f00004awdnkqa1.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "碳纤维一体成型握把": {
    "text": "中空构造改变了感度基准，衍生出了更轻和更高感度的握把。\n握把后端采用中空构造并一体成型的握把构造，开启了轻量且高感度鱼竿的历史，和以往的鱼竿相比拥有更高感度和更轻重量。",
    "text_simple": "后握把中空一体成型，减重同时提升竿梢振动传递。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/bass/bass/a075f00003xhf90qae.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "竿梢更换系统": {
    "text": "仅更换了竿梢就让鱼竿拥有不同特性，根据作钓需求使用需要的竿梢，让你作钓范围更广泛。",
    "text_simple": "更换竿梢即可改变竿子特性，适应更多钓法。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/saltwater/others/a075f000048lxxcqae.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "融合握把技术": {
    "text": "在追求感度的一体成型碳纤维握把基础上，融合了不同素材，保持了了碳纤维素材的高感度也兼顾了耐久性，新的握把成形技术。",
    "text_simple": "在碳纤维高感度基础上融合不同材料，兼顾耐久和反馈。",
    "sources": [
      {
        "group": "shimano_rod_import",
        "url": "https://fish.shimano.com/zh-CN/product/rod/bass/bass/a075f00003xhf90qae.html"
      }
    ],
    "groups": [
      "shimano_rod_import"
    ]
  },
  "ARK HPCR (High Pressure Carbon Fiber Rolling) technology": {
    "text": "The top of line un-sanded rod blank is made of 46T HM carbon-fiber enhanced with carbon nano tube in between the carbon-fiber layers and constructed by our ARK high pressure carbon-fiber rolling technology.",
    "text_simple": "ARK 的高压碳纤维卷制工艺，用来提升竿胚轻量、强度和敏感度。",
    "sources": [
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/ark-reinforcer-series-casting-rod"
      },
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/ark-invoker-limited-edition-casting-rod"
      },
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/invoker-w-series"
      }
    ],
    "groups": [
      "ark_rod_import"
    ]
  },
  "carbon nano tube reinforcement": {
    "text": "Built using unsanded, 40T HM carbon fiber blanks, the ARK Invoker Limited Edition Casting Rods feature nano tube reinforcements throughout each layer of carbon fiber, and are constructed using ARK's HPCR (High Pressure Carbon Fiber Rolling) technology to deliver a lightweight, yet incredibly tough design.",
    "text_simple": "在碳纤维层间加入纳米管强化，提升竿胚强度、韧性和反馈。",
    "sources": [
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/ark-invoker-limited-edition-casting-rod"
      },
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/ark-reinforcer-series-casting-rod"
      },
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/ark-essence-series-casting-rod"
      }
    ],
    "groups": [
      "ark_rod_import"
    ]
  },
  "Fuji PTS/TVS reel seat": {
    "text": "It also come with Fuji PTS/TVS reel seat with soft touch layer, Titanium guides, portugal AAAA grade cork handle and lifetime warranty.",
    "text_simple": "Fuji PTS/TVS 轮座带软触涂层，握持贴手，控竿更稳定。",
    "sources": [
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/ark-reinforcer-series-casting-rod"
      },
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/ark-reinforcer-series-spinning-rod"
      }
    ],
    "groups": [
      "ark_rod_import"
    ]
  },
  "Fuji K concept Alconite guides": {
    "text": "Features: -40T HM carbon fiber blank with nano tube -Unsanded blank with ARK HPCR technology -Logo throughout the whole blank -Fuji K concept alconite guides -AAA full cork handle -Newly designed custom reel seat -Lifetime warranty -Limited edition rod sleeve",
    "text_simple": "Fuji K 概念导环搭配 Alconite 环，减少缠线并兼顾顺滑出线。",
    "sources": [
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/ark-invoker-limited-edition-casting-rod"
      }
    ],
    "groups": [
      "ark_rod_import"
    ]
  },
  "Multi-Direction Multi-Layer technology": {
    "text": "The revamped Sniper II Series rods boast a completely redesigned 40T HM carbon fiber blank, engineered with our Multi-Direction Multi-Layer technology for enhanced strength and sensitivity.",
    "text_simple": "多方向多层竿胚结构，重点提升竿身强度和信号传递。",
    "sources": [
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/sniper-ii"
      },
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/sniper-ii-series-spinning-rod"
      },
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/2024-tharp-series-casting-rod"
      }
    ],
    "groups": [
      "ark_rod_import"
    ]
  },
  "ARK Stainless Steel Tangle-Free Guides": {
    "text": "Equipped with ARK Stainless Steel Tangle-Free Guides and NanoForce™ Rings, these rods offer unparalleled performance- 56% lighter, 38% thinner, and 65% stronger than standard ceramic rings.",
    "text_simple": "ARK 不锈钢防缠导环，减少出线缠绕并提升导环耐用性。",
    "sources": [
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/sniper-ii"
      },
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/sniper-ii-series-spinning-rod"
      },
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/commander-series-casting-rod"
      }
    ],
    "groups": [
      "ark_rod_import"
    ]
  },
  "NanoForce Rings": {
    "text": "Equipped with ARK Stainless Steel Tangle-Free Guides and NanoForce™ Rings, these rods offer unparalleled performance- 56% lighter, 38% thinner, and 65% stronger than standard ceramic rings.",
    "text_simple": "NanoForce 导环环件更轻、更薄、更强，兼顾出线顺滑和感度反馈。",
    "sources": [
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/sniper-ii"
      },
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/gravity-bfs-series"
      },
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/invoker-w-series"
      }
    ],
    "groups": [
      "ark_rod_import"
    ]
  },
  "ARK Titanium Tangle-Free Guides": {
    "text": "Outfitted with ARK Titanium Tangle-Free Guides and NanoForce™ Rings, these guides redefine performance- 56% lighter, 38% thinner, and 65% stronger than standard ceramic rings.",
    "text_simple": "钛框防缠导环更轻，适合轻量竿保持灵敏和抛投顺畅。",
    "sources": [
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/gravity-bfs-series"
      }
    ],
    "groups": [
      "ark_rod_import"
    ]
  },
  "Fuji K concept guides": {
    "text": "AAA grade full cork handle, Fuji K-concept tangle-free guides with Fazlite rings, ARK designed reel seat and 5-Year limited warranty.",
    "text_simple": "Fuji K 概念防缠导环，降低缠线概率，提升抛投出线稳定性。",
    "sources": [
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/ark-essence-series-casting-rod"
      },
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/ark-essence-series-spinning-rod"
      },
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/invoker-tour-series-casting-rod"
      }
    ],
    "groups": [
      "ark_rod_import"
    ]
  },
  "FazLite rings": {
    "text": "Built with high-quality components throughout, the Ark Genesis Series 2pc Casting Rods are fitted with Fuji K concept guides with FazLite inserts for seamless line management and unmatched dependability.",
    "text_simple": "FazLite 环件帮助线组顺畅通过导环，提升出线管理和耐用性。",
    "sources": [
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/ark-essence-series-casting-rod"
      },
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/ark-essence-series-spinning-rod"
      }
    ],
    "groups": [
      "ark_rod_import"
    ]
  },
  "ARK Tangle-Free Guides": {
    "text": "Outfitted with ARK Tangle-Free Guides featuring NanoForce Rings, this rod enhances casting performance and durability while preventing line tangles.",
    "text_simple": "ARK 防缠导环用于减少抛投和控线时的线缠绕。",
    "sources": [
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/invoker-w-series"
      },
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/wes-logan-series-spinning-rod"
      },
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/invoker-tour-series-spinning-rod"
      }
    ],
    "groups": [
      "ark_rod_import"
    ]
  },
  "Team ARK reel seat": {
    "text": "New designed Team ARK reel seat. ARK Tangle Free Guides with NanoForce™ Ring.",
    "text_simple": "Team ARK 轮座是 ARK 自家轮座配置，强调握持和控竿稳定。",
    "sources": [
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/wes-logan-series-spinning-rod"
      },
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/wes-logan-signature-series-rod"
      },
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/invoker-tour-series-spinning-rod"
      }
    ],
    "groups": [
      "ark_rod_import"
    ]
  },
  "Black Coated Stainless Micro Guides System With Zirconium Inserts": {
    "text": "Japanese Toray 40T modulus carbon-fiber with our unique MDML Technology for a lighter, stronger, more sensitive blank. 2. New designed Team ARK reel seat. 3.Black Coated Stainless Micro Guides System With Zirconium Inserts.",
    "text_simple": "黑色涂层不锈钢微导环搭配锆石环，强调轻量、出线控制和耐磨。",
    "sources": [
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/lancer-tour-series-spinning-rod"
      },
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/lancer-tour-series-casting-rod"
      }
    ],
    "groups": [
      "ark_rod_import"
    ]
  },
  "A-Ring technology": {
    "text": "Outfitted with ARK Stainless Steel Tangle-Free Guides and A-Ring technology, they deliver exceptional durability and effortless handling of all types of fishing lines.",
    "text_simple": "A-Ring 导环技术强调耐用和不同线种的顺畅出线。",
    "sources": [
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/cobb-series-spinning-rod"
      },
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/cobb-series-casting-rod"
      }
    ],
    "groups": [
      "ark_rod_import"
    ]
  },
  "High-Visibility Strike Indicator": {
    "text": "High-Visibility Strike Indicator* detects even the slightest bites beneath the ice!",
    "text_simple": "高可视咬口指示设计，冰钓时更容易观察轻微咬口。",
    "sources": [
      {
        "group": "ark_rod_import",
        "url": "https://arkrods.com/collections/rods/products/catalyzer-series-ice-rod"
      }
    ],
    "groups": [
      "ark_rod_import"
    ]
  },
  "富士工業製WBCバランサー": {
    "text": "富士工業製WBCバランサーとバランスウエイト3/8oz.2枚を標準装備。使うルアーによってキャスティングバランスを即座に調整可能。",
    "text_simple": "尾端配重可以按用饵调整抛投平衡，长时间抛投更稳。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-ltt/"
      },
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-hard-bait-special/"
      },
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-jungle/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "富士工業製PTSリールシート": {
    "text": "富士工業製PTSリールシートを、キャスティング時の手首の自由度と安定性を重視してセッティング。",
    "text_simple": "PTS 轮座强调抛投时手腕活动空间和握持稳定性。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-ltt/"
      },
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-hard-bait-special/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "バリアブルテーパー": {
    "text": "狙う距離に応じて曲がりの深さを変えるバリアブルテーパー。今まで困難だったキャストを普通に決める。",
    "text_simple": "竿身会随抛投距离和发力改变弯曲深度，硬饵抛投更容易控准。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-hard-bait-special/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "ストラクチャーNXSブランク": {
    "text": "トルクフルなロードランナーブランクをベースに、ソフトルアー性能に特化させたストラクチャーNXSブランク。",
    "text_simple": "以 Road Runner 竿坯为基础，针对软饵操作强化张力、感度和控饵反馈。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-structure-nxs/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "富士工業製チタンフレームトルザイトガイド": {
    "text": "軽さと感度を最重視し全機種が富士工業製チタンフレームトルザイトガイドを採用。",
    "text_simple": "钛框 Torzite 导环更轻，能降低前端负担并提升竿身反馈。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-structure-nxs/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "KTガイド": {
    "text": "ベイトキャスティングはバット部にLRV、ベリーから先はKTを使用。スピニングはバット部にKL、ベリーから先はKTを使用。\nEVERGREEN: ■ ガイドシステム バット～ベリー部はLRVガイド、ティップ部はKTガイド、トップはMNガイドを採用。ガイドへの糸絡みを大きく低減するセッティング。フレームは高強度かつ軽量なチタン製、リングは高信頼性を誇るSiC-Sを採用（トップのみSiC-J）。",
    "text_simple": "该技术用于对应型号的竿坯、导环或握把配置，影响重量、感度、出线和控鱼稳定性。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-structure-nxs/"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheUtSpin.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/ThePowerShaker68ml.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/ThePowerShaker611m.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSolidSensor61.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Pcsc66lPlus.html"
      }
    ],
    "groups": [
      "nories_rod_import",
      "evergreen_rod_import"
    ]
  },
  "富士工業製GMステンレスフレームSiC-Sガイド": {
    "text": "ガイドはウエイトバランスまでも考慮したノリーズオリジナルセッティングで富士工業製GMステンレスフレームSiC-Sガイドを採用。",
    "text_simple": "GM 不锈钢框 SiC-S 导环用于硬饵竿，兼顾强度、耐用和整竿配重。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-hard-bait-special/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "LGSTトップガイド": {
    "text": "KガイドをメインにトップガイドがLGST。PEライン使用にも対応。",
    "text_simple": "竿尖采用 LGST 顶环，配合 K 导环提升 PE 出线稳定性。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-hard-bait-special/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "富士工業製ステンレスフレームSICガイド": {
    "text": "ウエイトバランスまでも考慮したノリーズオリジナルセッティングで富士工業製ステンレスフレームSICガイドを採用。",
    "text_simple": "不锈钢框 SiC 导环强调耐用、顺滑和整竿配重平衡。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-ltt/"
      },
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-jungle/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "MNSTトップガイド": {
    "text": "KガイドをメインにトップガイドがMNST。PEライン使用にも対応。",
    "text_simple": "竿尖采用 MNST 顶环，配合 K 导环让 PE 出线更稳定。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-ltt/"
      },
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-jungle/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "LRVガイド": {
    "text": "ベイトキャスティングはバット部にLRV、ベリーから先はKTを使用したノリーズオリジナルの中口径セッティング。\nEVERGREEN: ■ ガイドシステム バット～ティップ部はLRVガイド、トップはKGガイドを採用。ガイドへの糸絡みを大きく低減するセッティング。フレームは高強度かつ軽量なチタン製、リングは高信頼性を誇るSiC-Sを採用（トップのみSiC-J）。",
    "text_simple": "该技术用于对应型号的竿坯、导环或握把配置，影响重量、感度、出线和控鱼稳定性。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-structure-nxs/"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Prej5082.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Prej5083.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Prej5084.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Pslj6031.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Pslj60315.html"
      }
    ],
    "groups": [
      "nories_rod_import",
      "evergreen_rod_import"
    ]
  },
  "富士工業製ECSリールシート": {
    "text": "ブランクタッチ可能で握り込みの小さな富士工業製ECSリールシートを採用。",
    "text_simple": "ECS 轮座更容易触碰竿坯，底操和软饵反馈更直接。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-structure-nxs/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "KLガイド": {
    "text": "スピニングはバット部にKL、ベリーから先はKTを使用しアイテムによって最適化したセッティング。PEライン使用にも対応。",
    "text_simple": "直柄竿底部使用 KL 导环，帮助 PE 出线和控线更稳定。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-structure-nxs/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "富士工業製VSSシート": {
    "text": "スピニングは人差し指や親指の乗る位置をカーボンパイプとした富士工業製VSSシートを採用。",
    "text_simple": "VSS 轮座配合碳管触点，直柄操作时更利于感度传递。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-structure-nxs/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "グラスコンポジット（-Gc）": {
    "text": "グラスコンポジット（-Gc）アイテム。メインブランクはグラス、ベリーからバットにカーボンをコンポジットするデザイン。",
    "text_simple": "玻纤主竿身配合碳纤中后段，保留硬饵追随性并增加支撑。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-hard-bait-special/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "バキューム": {
    "text": "ロードランナーラインナップのグラスブランク「バキューム」の称号が、今再び甦ります。",
    "text_simple": "Vacuum 是 Nories 对 Gc 玻纤复合硬饵竿的竿坯路线命名。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-hard-bait-special/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "富士工業製VSSリールシート": {
    "text": "握りの自由度が高い富士工業製 VSSリールシートに、オリジナル形状のEVAフロントショートグリップ。",
    "text_simple": "VSS 轮座让直柄握持更自由，抛投和控饵切换更顺手。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-hard-bait-special/"
      },
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-jungle/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "テレスコピック": {
    "text": "Piece 2(telescopic)",
    "text_simple": "伸缩式结构用于长尺型号，兼顾竿长和收纳。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-structure-nxs/"
      },
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-jungle/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "チタンフレームガイド": {
    "text": "ガイドはブランクパワーを活かせる軽いチタンフレームで、ティップ部はシングルフットを採用。",
    "text_simple": "钛框导环减轻前端重量，让 Gc 竿坯动作更容易释放。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-hard-bait-special/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "テレスコピックハンドル": {
    "text": "HB710LL / HB760L / HB760M:テレスコピックハンドル仕様を採用。",
    "text_simple": "伸缩握把只用于指定长尺 HBS 型号，兼顾长竿抛投和收纳。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-hard-bait-special/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "ショートカーボンソリッドティップ": {
    "text": "アイテム末尾に「St」を持つアイテムは、喰い込みとルアー操作性を両立したショートカーボンソリッドティップを採用。",
    "text_simple": "短碳实心竿稍兼顾入口追随和软饵操作，轻咬更容易表现出来。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-structure-nxs/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "シングルフットティップガイド": {
    "text": "ガイドはブランクパワーを活かせる軽いチタンフレームで、ティップ部はシングルフットを採用。",
    "text_simple": "竿稍单脚导环降低前端负担，让玻纤复合竿的弯曲和回弹更自然。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-hard-bait-special/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "富士工業製チタンフレームSiC KRコンセプトガイド": {
    "text": "富士工業製チタンフレームSicの軽量KRコンセプトガイドの組み合わせで、バイトを弾かず、しかもアキュラシーに優れたキャストを可能にしたのがSGt（シャキットグラスティップ）です。",
    "text_simple": "钛框 SiC KR 导环降低前端晃动，提升轻硬饵直柄抛投精度。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-hard-bait-special/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "SGt（シャキットグラスティップ）": {
    "text": "バイトを弾かず、しかもアキュラシーに優れたキャストを可能にしたのがSGt（シャキットグラスティップ）です。",
    "text_simple": "SGt 玻纤竿稍用于直柄硬饵，降低弹口，同时保留精准抛投。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-hard-bait-special/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "テレスコピックストッパー": {
    "text": "テレスコ収納時にバットガイドの干渉を防ぐストッパーを装備。",
    "text_simple": "伸缩收纳时防止底部导环互相干涉，减少收竿碰伤风险。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-jungle/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "富士工業製TCSリールシート": {
    "text": "ノンスリップフォアグリップと富士工業製TCSリールシートのセッティング。キャスティング時の手首の自由度と安定性を重視してセッティング。",
    "text_simple": "TCS 轮座配合防滑前握，重障碍枪柄抛投和控鱼更稳定。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-jungle/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "富士工業製チタンフレームトルザイトリング": {
    "text": "富士工業製チタンフレームトルザイトリングを採用し、KRコンセプトでガイドセット。",
    "text_simple": "钛框 Torzite 环用于 Jungle Spin，减轻导环负担并提升轻量操作感。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-jungle/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "KRコンセプト": {
    "text": "富士工業製チタンフレームトルザイトリングを採用し、KRコンセプトでガイドセット。",
    "text_simple": "KR 导环配置让直柄 PE 出线和短距离精准抛投更稳定。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-jungle/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "ステンレスフレームオールダブルフットガイド": {
    "text": "ステンレスフレームでオールダブルフットガイドを採用。",
    "text_simple": "全双脚不锈钢框导环强调强度和稳定支撑，适合卷阻硬饵。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-hard-bait-special/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "グリップジョイント": {
    "text": "HB730MH-Gc：グリップジョイントを採用。",
    "text_simple": "握把接节只用于指定长尺 Gc 型号，兼顾竿长、运输和整体弯曲。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-voice-hard-bait-special/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "アンサンドフィニッシュ": {
    "text": "ブランクはアンサンドフィニッシュを採用。\nEVERGREEN: ■ ブランクス 超軽量カーボンマテリアルを採用し、しっかりしなり、素早く戻る理想のブランクスを実現。また、軽快で振り抜けの良いキャストフィーリングをもたらす、無塗装アンサンドフィニッシュを施しました。",
    "text_simple": "竿坯不打磨/少涂装，减少多余重量并保留直接反馈。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-structure-nxs/"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheManipulator.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheMetalWhip.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheRedmeister.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheForcegrandis7Lts.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBluemeister7Lts.html"
      }
    ],
    "groups": [
      "nories_rod_import",
      "evergreen_rod_import"
    ]
  },
  "モーメントディレイブランク": {
    "text": "STN640MLS-Mdに採用する「モーメントディレイ」ブランク。ソリッドティップではなく、オールチューブラーでティップ部のみ低弾性カーボン、ベリーからバットは高弾性カーボンとする特殊製法を用いたブランク。",
    "text_simple": "Md 竿坯只用于 STN640MLS-Md，管状竿稍低弹、后段高弹，适合高速细操作和追随咬口。",
    "sources": [
      {
        "group": "nories_rod_import",
        "url": "https://nories.com/bass/road-runner-structure-nxs/"
      }
    ],
    "groups": [
      "nories_rod_import"
    ]
  },
  "ナノアロイ®技術": {
    "text": "▪ 『トレカ®T1100G』 ＆ 『ナノアロイ®技術』→ ※「トレカ®」＆「ナノアロイ®技術」は東レ（株）の登録商標です。\nEVERGREEN: 『トレカ®T1100G』＆『ナノアロイ®技術』 ナノレベル（10億分の1）で繊維構造を緻密にコントロールする焼成技術により高強度と高弾性率化を両立し、30トンを頂点に弾性率が高くなるほど強度が低下するというカーボン繊維の力学特性マップ（下図）を塗り替えた画期的素材『トレカ®T1100G』と、革新的テクノロジーをベースに引張強度と耐衝撃性を両立したマトリクス樹脂技術『ナノアロイ®技術』。",
    "text_simple": "配合 T1100G 等高强度碳材的树脂技术，平衡轻量、强度和韧性。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc63mhrTg40x.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraGt.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBlackRavenExtremeRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStallionRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/news_html/toraycat1100g_nanoalloy.php"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "50トンカーボン": {
    "text": "これまでカレイドに存在しなかった新ジャンルのパワーロングロッド、それがインスピラーレ特殊部隊、グランドスタリオンGT-X。 限界を超えてもさらにしなって受け止める「強さ（パワー）」を始め、超遠距離でもフックをガツンと貫通させる瞬発的な「硬さ（キレ）」、さらには8フィートクラスのエキストラヘビーアクションにはこれまで存在しなかった絶対的な「軽さ（操作感）」という相反する要素を三位一体化。",
    "text_simple": "50トンカーボン表示该型号竿坯使用的碳布等级，用于调整轻量、硬挺度和回弹。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc63mhrTg40x.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheRapidGunnerRsr.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheRapidGunnerHd.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheGrandStallionGtX.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Hfac65m.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "30トンカーボン": {
    "text": "■ ブランク メインクロス「高樹脂タイプ24トンカーボン」→ ベリーセクション「通常タイプ24トンカーボン」→ バットセクション「30トンカーボン」となだらかに張りが増す構成。 キャスト、ハングオフ操作、フッキング～ファイト等のあらゆる負荷に対するスムーズな追従性と安心感のある剛性を実現。",
    "text_simple": "30トンカーボン表示该型号竿坯使用的碳布等级，用于调整轻量、硬挺度和回弹。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc63mhrTg40x.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheGrandCobraRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc66mrStSpg.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheGrandCobraLimited.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Tkss63ulZz.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "超高弾性カーボン": {
    "text": "■ ブランク 高強度・高弾性率炭素繊維 『トレカ®「T1100G」』に『ナノアロイ®技術』 を適用した33トンカーボンと50トン超高弾性カーボンのハイブリッド＆ローテーパー設計。強くてパワフルなだけでなく、軽くてシャープ、高感度で抜群の操作性を併せ持つ。",
    "text_simple": "高弹性碳素材让竿身反应更快，控饵和底感反馈更清晰。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc63mhrTg40x.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBlackRavenExtremeRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheRapidGunnerRsr.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheRapidGunnerHd.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSuperStallionGt.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "高弾性カーボン": {
    "text": "■ グリップデザイン（フォア） 高弾性カーボンブランクスの特性を損なわず、さらなる張り、剛性感、高感度化を際立てるメタル製ワインディングチェック＋メタル製ナット。",
    "text_simple": "高弹性碳素材让竿身反应更快，控饵和底感反馈更清晰。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc63mhrTg40x.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBlackRavenExtremeRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc70mfSxf.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Igtc71mfSxf.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSuperStallionGt.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "4軸補強": {
    "text": "※ 当製品の生産は終了いたしました。 中弾性カーボンにソリッドコンボ さらに4軸補強で締めあげた軽～中量級ユーティリティスペシャル。",
    "text_simple": "多轴碳布补强用于抑制竿身扭转，提升抛投、抽动和控鱼稳定性。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc63mhrTg40x.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBlackRavenExtremeRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc70mfSxf.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc70mhrSxf.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/GtrC70mhrSxf.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "チューブラー構造": {
    "text": "20年の時空を超えたフルチューブラー革命。 最新技術で進化を遂げ蘇る、テムジン流 究極操作系・超高弾性シャフト。",
    "text_simple": "管状竿坯/竿稍保留更直接的回弹和操控响应。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc63mhrTg40x.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStingraySuperShake.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStingraySuperShakeB.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBeastinger.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Tkss76ulxmLtd.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "チタンフレーム・トルザイトリング・シングルフットガイド": {
    "text": "■ ガイドシステム ●ティップ～ベリーセクション（トップ～#6ガイド） 感度と軽快感かつ実戦強度を追及し、ティップ部には最軽量の小口径トルザイトリング・チタンフレーム・シングルフットガイドを、ベリーセクションにはトルザイトリング・チタンフレーム強化シングルフットガイドをセッティング。 ●バットセクション（#7～8ガイド） ダブルフットタイプ最新最軽量のチタンフレームLKWガイド（トルザイトリング）を採用。さらなる頑強さとシャープな軽快感を両立。",
    "text_simple": "TorZite 导环更轻、内径利用率高，有利于减重、出线和感度。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc63mhrTg40x.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBlackRavenExtremeRs.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "チタンフレーム・トルザイトリングLKWガイド": {
    "text": "■ ガイドシステム ●ティップ～ベリーセクション（トップ～#6ガイド） 感度と軽快感かつ実戦強度を追及し、ティップ部には最軽量の小口径トルザイトリング・チタンフレーム・シングルフットガイドを、ベリーセクションにはトルザイトリング・チタンフレーム強化シングルフットガイドをセッティング。 ●バットセクション（#7～8ガイド） ダブルフットタイプ最新最軽量のチタンフレームLKWガイド（トルザイトリング）を採用。さらなる頑強さとシャープな軽快感を両立。",
    "text_simple": "TorZite 导环更轻、内径利用率高，有利于减重、出线和感度。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc63mhrTg40x.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/news_html/inspirare_aurora.php"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/news_html/inspirare_aurora71mh.php"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "AAAシャンパンコルク": {
    "text": "GT3RS-C71MH-TG40X スーパースタリオンGT3RS 打撃系の張り詰めた硬さと柔術系の粘り強さを理想的なバランスで両立。 唯一無二の高弾性ハイテーパー・ヘビー級バーサタイル。",
    "text_simple": "高等级香槟软木握把，提升握持质感和重量控制。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc63mhrTg40x.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSuperSteedGtR.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBlackRavenExtremeRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStallionRs.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "ブランクタッチ方式": {
    "text": "【リールシート】 高感度ブランクタッチ方式、細身でコンパクトなECS（16サイズ）。パーミングのしやすさと手首の自由度を確保。\nEVERGREEN: スリムタイプのブランクタッチ式リールシートを採用したことも軽量化に大きく貢献しており、そのうえグリップが細身で握りやすいことから手首の自由度が増し、キャスト精度の向上に一役買っている。",
    "text_simple": "手部更接近竿坯，轻咬、底感和震动传递更直接。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc63mhrTg40x.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSuperSteedGtR.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraGt.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBlackRavenExtremeRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/special/concept_inspirare.php"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "超極薄カーボンプリプレグ": {
    "text": "■ ブランクス 高レジンカーボン×ローテーパー。カーボンロッドとは思えない「しなやかさ」と「粘り」、さらに、グラスロッドにはない「キレ」と「適度な張り」を併せ持つ。 一般的な釣竿に使われるカーボンプリプレグ（カーボンシート）の約1/3の厚さという特殊な超極薄カーボンプリプレグを採用し、その特殊なシートを通常シートの約3倍の回数巻き付けた超多層構造。ブランクス断面の肉厚が均一化されることでブランクスの潜在能力を100％使うことが可能に。 ▼ブランクスの詳しい情報は▼ スーパースティードGT-R 開発ストーリー",
    "text_simple": "该技术用于对应型号的竿坯、导环或握把配置，影响重量、感度、出线和控鱼稳定性。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSuperSteedGtR.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "高レジンカーボン": {
    "text": "■ ブランクス 高レジンカーボン×ローテーパー。カーボンロッドとは思えない「しなやかさ」と「粘り」、さらに、グラスロッドにはない「キレ」と「適度な張り」を併せ持つ。 一般的な釣竿に使われるカーボンプリプレグ（カーボンシート）の約1/3の厚さという特殊な超極薄カーボンプリプレグを採用し、その特殊なシートを通常シートの約3倍の回数巻き付けた超多層構造。ブランクス断面の肉厚が均一化されることでブランクスの潜在能力を100％使うことが可能に。 ▼ブランクスの詳しい情報は▼ スーパースティードGT-R 開発ストーリー",
    "text_simple": "高树脂碳素材带来更湿润的弯曲手感，降低过硬过弹的突兀感。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSuperSteedGtR.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheAerial.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSuperAerial.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "4軸カーボン": {
    "text": "【フォア】 高感度4軸カーボンを採用したリールシートナット。シンプルかつ軽量なフォアグリップレスデザイン。",
    "text_simple": "多轴碳布补强用于抑制竿身扭转，提升抛投、抽动和控鱼稳定性。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSuperSteedGtR.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraGt.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBlackRavenExtremeRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStallionRs.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "ステンレスフレーム・ダブルフット・SiCリングガイド": {
    "text": "■ ガイドシステム 強度重視のFujiステンレスフレームSiCリングダブルフットガイドをダブルラッピング。",
    "text_simple": "SiC 导环耐磨顺滑，适合长时间出线和较高负载使用。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSuperSteedGtR.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraGt.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheTechnicalAction.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheManipulator.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheRedmeister.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "トルザイトリングガイド": {
    "text": "持ち感はしなやかで一瞬柔らかくすら感じますが、実際のパワーはスティングレイ66をはるかに上回ります。また、トルザイトリングガイドシステムを新採用。強度を維持しながらさらなる軽量化を成し遂げました。",
    "text_simple": "TorZite 导环更轻、内径利用率高，有利于减重、出线和感度。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSuperSteedGtR.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc611xxxhrSxf.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc70mhrSxf.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/GtrC70mhrSxf.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSuperStallionGt2rs.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "33トンカーボン": {
    "text": "■ ブランク 高強度・高弾性率炭素繊維 『トレカ®「T1100G」』に『ナノアロイ®技術』 を適用した33トンカーボンと50トン超高弾性カーボンのハイブリッド＆ローテーパー設計。強くてパワフルなだけでなく、軽くてシャープ、高感度で抜群の操作性を併せ持つ。",
    "text_simple": "33トンカーボン表示该型号竿坯使用的碳布等级，用于调整轻量、硬挺度和回弹。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraGt.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStallionRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStallionGt.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSuperStallionGt.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "24トンカーボン": {
    "text": "■ ブランク 中低弾性24トンカーボンをメインクロスに、バットからベリーまでの広範囲に高強度高弾性「トレカ®T1100G」を配置、さらにバットを高弾性40トンカーボン＆高密度クワトロウーブンクロスで補強したハイバランス設計。",
    "text_simple": "24トンカーボン表示该型号竿坯使用的碳布等级，用于调整轻量、硬挺度和回弹。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraGt.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBlackRavenExtremeRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStallionRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStallionGt.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "高強度・高弾性率炭素繊維": {
    "text": "高強度・高弾性率炭素繊維『トレカ®「T1100G」』 についての詳しい説明はコチラ\nEVERGREEN: カーボン製造の最大手メーカーである東レ株式会社から、これまで技術難度が高いとされた高強度と高弾性率化の両立を実現したカーボン（炭素）繊維が発表された。20年に一度の画期的素材と謳われる『トレカ®「T1100G」』である。",
    "text_simple": "高强度高弹性碳纤维，兼顾硬挺响应和受力强度。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraGt.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStallionRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStallionGt.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc610mhrf.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/special/concept_grandcobra.php"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "中弾性カーボン": {
    "text": "※ 当製品の生産は終了いたしました。 中弾性カーボンにソリッドコンボ さらに4軸補強で締めあげた軽～中量級ユーティリティスペシャル。",
    "text_simple": "中弹性碳素材让竿身保留韧性和负载感，适合更宽容的操作。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraGt.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBlackRavenExtremeRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStallionRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStallionGt.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "4軸製法": {
    "text": "■ ブランクス ブランク全体のしなりでパワーを生み出すために、あえて4軸製法を採用せず、中低弾性カーボンをメイン素材に用いた細身のローテーパーブランク全身を肉厚に設計。",
    "text_simple": "多轴碳布补强用于抑制竿身扭转，提升抛投、抽动和控鱼稳定性。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraGt.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStallionRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStallionGt.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraDg66m.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "4軸カーボンスリーブナット": {
    "text": "フォアグリップ フォアグリップを排除 し、さらなる軽量化を実現。先鋭的なデザインのワインディングチェックに加え、最小限の4軸カーボンスリーブナットは軽量化・高感度化に大きく貢献。",
    "text_simple": "多轴碳布补强用于抑制竿身扭转，提升抛投、抽动和控鱼稳定性。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStallionRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheGrandCobraRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStingraySuperShake.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStingraySuperShakeB.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "チタンフレーム・トルザイトリング・ダブルフットガイド": {
    "text": "クセのない美しいベンドカーブを持ち、圧倒的に幅広いルアーウエイトレシオを持つ肉厚ローテーパーバーサタイルロッドの代表機種「コブラ」が、陸っぱりでのタフユースを考慮したGTシリーズにラインアップ。 ブランクスはトーナメントでの使用を前提に開発されたインスピラーレ・コブラRSリミテッドとまったく同一で、高強度・高弾性率カーボン「トレカ®T1100G 」と、ムチのようなしなりを生み出す24トンカーボンでハイブリッド構成し、シャープさと粘り、軽量性とタフさを両立したハイパフォーマンスタイプを採用。",
    "text_simple": "TorZite 导环更轻、内径利用率高，有利于减重、出线和感度。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraGt.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "40トンカーボン": {
    "text": "■ ブランク 中低弾性24トンカーボンをメインクロスに、バットからベリーまでの広範囲に高強度高弾性「トレカ®T1100G」を配置、さらにバットを高弾性40トンカーボン＆高密度クワトロウーブンクロスで補強したハイバランス設計。",
    "text_simple": "40トンカーボン表示该型号竿坯使用的碳布等级，用于调整轻量、硬挺度和回弹。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBlackRavenExtremeRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc70mfSxf.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Igtc71mfSxf.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheRapidGunnerRsr.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheRapidGunnerHd.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "LKWガイド・SiCリング": {
    "text": "■ ガイドシステム 強度を重視したステンレスダブルフットフレームながらクラス最軽量のLKWガイド（SiCリング）を採用。",
    "text_simple": "SiC 导环耐磨顺滑，适合长时间出线和较高负载使用。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBlackRavenExtremeRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc611xxxhrSxf.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc70mfSxf.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc70mhrSxf.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/GtrC70mhrSxf.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "オールトルザイトリング": {
    "text": "■ ガイドシステム 「超軽量でティップがブレない」「表面が滑らかでノイズが少ない」、チタンフレーム・トルザイトリングを全ガイドに採用。また各ガイドスレッドの巻き量、コーティング量を極力抑え、徹底的な高感度軽量化を実現しました。",
    "text_simple": "该技术用于对应型号的竿坯、导环或握把配置，影响重量、感度、出线和控鱼稳定性。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStallionRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Hfac511mhst.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Hfac66mst.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Psmc66lMlst.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Psmc68ulMlst.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "カレイド・スーパークワトロクロス": {
    "text": "ブランクス 低レジンピュアカーボンをメイン素材に採用。元ガイドから下のバット部分に、斜め補強の密度が高くより大きなパワーを発揮する ±30°カレイド・スーパークワトロクロス製法 を採用。\nEVERGREEN: 『トレカ®「T1100G」』の特性を打ち消すことなく、その優位性をより発揮させるために、全身をカレイドスーパークワトロクロスで補強しネジレを抑制。ネジレにくさはロッドのパワーロス減少につながり、ひいてはビッグベイトのキャスト精度やフッキングパワーの向上に貢献する。",
    "text_simple": "Kaleido 系列的多轴补强，重点抑制扭转和竿身晃动。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheGrandCobraRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheGrandCobraGt.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSuperStallionGt.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheGrandStallionGtX.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStingraySuperShake.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/special/concept_grandcobra.php"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "オールダブルフットガイド": {
    "text": "GT3RS-C71MH-TG40X スーパースタリオンGT3RS 打撃系の張り詰めた硬さと柔術系の粘り強さを理想的なバランスで両立。 唯一無二の高弾性ハイテーパー・ヘビー級バーサタイル。\nEVERGREEN: 用途・目的に合わせ一部機種にオールダブルフットガイド採用。対超ビッグフィッシュやビッグベイトを扱う場合、あるいはオカッパリでのハードな使用等を考慮して、意図的にセミマイクロ・オールダブルガイドを採用した例外機種も一部存在する。",
    "text_simple": "双脚导环提升导环支撑强度，适合更高负载或强力控鱼。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheGrandCobraRs.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheGrandCobraGt.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheRapidGunnerRsr.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheRapidGunnerHd.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSuperStallionGt.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/special/concept_inspirare.php"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "Fuji TCSリールシート": {
    "text": "■ グリップデザイン（リールシート） 側面の面積が広く、握り込んだ際に手のひらに沿う遊びが少ない形状のFuji TCSリールシートを採用。肉厚ロングブランクスのパワーを手元でしっかり支え、特に重量級の巻き物におけるキャストやリトリーブ、操作時の手元のブレを抑えるための選択。",
    "text_simple": "卷线器座影响握持贴合、重量和手部感度传递。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc611xxxhrSxf.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc70mhrSxf.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/GtrC70mhrSxf.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "SiC-S": {
    "text": "■ ガイドシステム 抜群の信頼性を誇るチタンフレーム・SiC-Sリングガイド採用。",
    "text_simple": "该技术用于对应型号的竿坯、导环或握把配置，影响重量、感度、出线和控鱼稳定性。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Gt3rsC71mhTg40x.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Prej5082.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Prej5083.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Prej5084.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Pslj6031.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "低弾性カーボン": {
    "text": "正確かつ快適なクランキングを約束する 超低弾性カーボンのクランクベイトスペシャル。",
    "text_simple": "低弹性碳素材让竿身更柔顺，抛投和咬口追随更宽容。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Irsc66mrStSpg.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraDg66m.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraDg66mB.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Tkss63ulZz.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Tkss76ulxmLtd.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "低レジンピュアカーボン": {
    "text": "ブランクス 低レジンピュアカーボンをメイン素材に採用。元ガイドから下のバット部分に、斜め補強の密度が高くより大きなパワーを発揮する ±30°カレイド・スーパークワトロクロス製法 を採用。",
    "text_simple": "低树脂碳素材减少多余重量，让竿身更清脆、更有张力。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStingraySuperShake.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStingraySuperShakeB.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBlackRaven.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBlackRavenB.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSuperCougar.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "セミマイクロKガイド": {
    "text": "シャープなブランクとライン遊びの少ないセミマイクロガイドセッティングの完成度の高い組み合わせで、ボトムの地形や底質、カバーの状況を感じ分けることができます。",
    "text_simple": "K 导环配置降低缠线风险，让 PE 或较细线出线更稳定。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStingraySuperShake.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStingraySuperShakeB.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBlackRaven.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBlackRavenB.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStallionDg69mh.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "チタンフレームSiCガイド": {
    "text": "■ ガイドシステム 超軽量小口径ガイドにより感度・操作性が飛躍的に向上するマイクロガイドセッティング。 （FujiチタンフレームSiCリングガイド）",
    "text_simple": "SiC 导环耐磨顺滑，适合长时间出线和较高负载使用。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStingraySuperShake.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStingraySuperShakeB.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraDg66m.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheCobraDg66mB.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBlackRaven.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "±45°オリジナル4軸クロス": {
    "text": "トップから元ガイドまでの部分に±45°オリジナル4軸クロスを、元ガイドから下のバット部分には斜め補強の密度が濃くより大きなパワーを発揮する±30°狭角オリジナル4軸クロスで完全武装。最新4軸理論と工法の恩恵を受け、さらなる高性能ロッドへと進化しています。",
    "text_simple": "多轴碳布补强用于抑制竿身扭转，提升抛投、抽动和控鱼稳定性。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSuperCougar.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSuperCougarB.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheEgoist.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheEgoistB.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "±30°狭角オリジナル4軸クロス": {
    "text": "トップから元ガイドまでの部分に±45°オリジナル4軸クロスを、元ガイドから下のバット部分には斜め補強の密度が濃くより大きなパワーを発揮する±30°狭角オリジナル4軸クロスで完全武装。最新4軸理論と工法の恩恵を受け、さらなる高性能ロッドへと進化しています。",
    "text_simple": "多轴碳布补强用于抑制竿身扭转，提升抛投、抽动和控鱼稳定性。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSuperCougar.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSuperCougarB.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheEgoist.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheEgoistB.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "オールチューブラー設計": {
    "text": "■ ブランク ［主な使用素材］ 高強度・高弾性率炭素繊維『トレカ®T1100G』＆『ナノアロイ®技術』を適用したカーボンプリプレグをティップからバットまでの全身に採用。さらに、超細身のローテーパー・オールチューブラー設計。「張り」「強度」「軽快さ」「しなやかさ」を融合。",
    "text_simple": "管状竿坯/竿稍保留更直接的回弹和操控响应。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Tkss63ulZz.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Ocss65l.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSmoothTorque.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "完全ブランクスルー構造": {
    "text": "■ 完全ブランクスルー構造 トップからリアグリップのエンドまで一切継ぎ目がない完全ブランクスルー構造を採用。類まれな伝達性能はもとより、ファイト時には無駄なく全体を使ったやり取りが可能に。予想外の大物にもしなやかかつパワフルに対応します。",
    "text_simple": "竿坯贯通到握把末端，力量和震动传递更连续。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Tkss63ulZz.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Tkss63lZz.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Tkss67xm.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Prej5082.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Prej5083.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "ZIGZAGガイドシステム": {
    "text": "トレカ®T1100G全身採用 × ジグザグガイドシステム搭載。 圧倒的感度のウルトラマッハシェイカー。\nEVERGREEN: さらに、このロッドには象徴的な新構造が搭載されている。それは青木氏が考案した『ZIGZAGガイドシステム』である。その名のとおり、ティップセクションガイドを左右ジグザグに配置しており、搭載個数も非常に多い。ラインからのボトム変化やバスのバイト信号を同時多発的にブランクスに増幅伝達するギリギリの角度にセットしている。",
    "text_simple": "ZIGZAG 导环系统通过特殊导环角度增强线接触和感度反馈。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Tkss63ulZz.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Tkss63lZz.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/news_html/delgesu_story.php"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "オールチタンフレーム・オールトルザイトリングガイド": {
    "text": "■ ガイドシステム オールチタンフレーム・オールトルザイトリング採用。",
    "text_simple": "TorZite 导环更轻、内径利用率高，有利于减重、出线和感度。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Tkss63ulZz.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Tkss63lZz.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Tkss67xm.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "Fuji IPSリールシート": {
    "text": "■ リールシートデザイン 精悍なブラック塗装に仕上げたFuji IPSリールシートを採用。",
    "text_simple": "卷线器座影响握持贴合、重量和手部感度传递。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBeastinger.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSuperFinesse.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSightEagle.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheMightyFinesse.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSightHawk.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "カーボンパイプ": {
    "text": "30周年記念モデル限定ロゴマーク ワインディングチェック部の4軸カーボンパイプとグリップエンドプレートにエバーグリーン30周年記念ロゴマークをデザイン。",
    "text_simple": "碳管/碳套件用于减重和加强握把区域的整体感。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Tkss611mhTg40x.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Ocss65ml.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheAerial.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSuperAerial.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "高品位スピゴットジョイント": {
    "text": "■ ジョイント ジョイント部は、面で接する高品位スピゴットジョイントを採用。ティップに伝わる信号をロス無く手元へと伝達。",
    "text_simple": "高品质插节接合，兼顾多节收纳、顺畅弯曲和力量传递。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Tkss76ulxmLtd.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSuperMagnum.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcc68ml.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcc610m.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcc611mh.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "Fuji チタンフレーム・トルザイトリングKガイド": {
    "text": "■ ガイドシステム PEライン、あるいは太めのフロロカーボンラインによるパワーフィネスに対応する最適なサイズのFuji・Kガイド（トルザイトリング・チタンフレーム）をオリジナルセッティング。 ラインすべりが良く、軽量ながらガイド内径をより大きく確保できる極薄超軽量トルザイトリングは、キャスティングパフォーマンスを最大化すると同時に操作性＆感度の向上にも貢献します。",
    "text_simple": "TorZite 导环更轻、内径利用率高，有利于减重、出线和感度。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSpinSerpent.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBushSerpent.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheKingSerpent.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "Fuji VSS16リールシート": {
    "text": "TKSS-66MHST ブッシュサーペント 劇的な軽さとは裏腹な圧倒的リフティングパワー。 併せ持つズバ抜けたキャスト能力でカバーフィッシングが激変する。 スピニングタックルとPEラインでカバーを攻めるスタイル、パワーフィネスの代名詞として時代を築いた元祖パワーフィネスロッド、テムジン・スピンコブラのコンセプトを受け継ぎ、さらなる進化を遂げたセルペンティ・ブッシュサーペント。 劇的な軽さとは裏腹な圧倒的パワーに加え、ズバ抜けたキャスト能力を手に入れた最新鋭パワーフィネスロッドがカバーフィッシングを激変させます。",
    "text_simple": "卷线器座影响握持贴合、重量和手部感度传递。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSpinSerpent.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBushSerpent.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheKingSerpent.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "ウーブンクロス補強": {
    "text": "■ ブランク 極端な曲がりを避け力や振動をスムーズに伝える、しなやかで力強いローテーパー厚巻き設計。ベリーからティップにかけては無塗装アンサンドフィニッシュによるブレを抑えたシャープなフィーリング、バットセクションはウーブンクロス補強で粘り強くパワフルに。優れたキャスト性能に始まり、操作する・感じる・掛ける・獲るという一連の動作に高いパフォーマンスを発揮します。",
    "text_simple": "多轴碳布补强用于抑制竿身扭转，提升抛投、抽动和控鱼稳定性。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Ocsc67m.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheWarrior.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSmoothTorque.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheFortuneBlue.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Nims86lEx.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "10トンカーボン": {
    "text": "OCSC-68ML ファイアソード 正確かつ快適なクランキングを約束する 超低弾性カーボンのクランクベイトスペシャル。 オライオンシリーズの中でクランクベイト（トレブルフック搭載のハードベイト）に最適な1本を選ぶなら…… ラウンド、フラットサイド、シャッド等のクランクベイトで、シャロー～ミドルレンジを巻く釣りに要求されるあらゆる性能をバランス良く詰め込んだファイアソードがその答え。 巻き物ロッド必須の「吸い込みが良い」「バラシを防ぐ」能力を持つだけでなく、クランクベイトを「正確に」「快適に」扱うことができるロッドである。",
    "text_simple": "10トンカーボン表示该型号竿坯使用的碳布等级，用于调整轻量、硬挺度和回弹。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Ocsc68ml.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "グラスコンポジット": {
    "text": "グリップ内ブランクス 若干の遊びを持たせるために、あえてグラス素材を採用したグリップ内ブランクス。シェイキング時の手首へのキックバックを抑えたまろやかなフィーリングを実現。身体への負担を軽減し気持ち良く長時間シェイクするためのこだわり。",
    "text_simple": "玻纤复合让竿身更柔顺，硬饵咬口更不容易弹开。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Ocsc68ml.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Ocsc68m.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheOcelot.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheServal.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheLeopard.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "ダブルフットKガイド": {
    "text": "■ ガイドシステム 耐久性を重視した肉厚ステンレスフレームのダブルフットKガイドをオリジナルセッティング。",
    "text_simple": "K 导环配置降低缠线风险，让 PE 或较细线出线更稳定。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Ocsc711xx.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheActaeonMagnumEx.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheOcelot.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheServal.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheLeopard.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "オールダブルフットKガイド": {
    "text": "■ ガイドシステム ハードな使用に耐える高強度FujiオールステンレスフレームSiCリング・オールダブルフットKガイドを装着。",
    "text_simple": "K 导环配置降低缠线风险，让 PE 或较细线出线更稳定。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Ocsc711xx.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheActaeonMagnumEx.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "オールステンレスフレームSiCリング": {
    "text": "■ ガイドシステム ハードな使用に耐える高強度FujiオールステンレスフレームSiCリング・オールダブルフットKガイドを装着。",
    "text_simple": "该技术用于对应型号的竿坯、导环或握把配置，影响重量、感度、出线和控鱼稳定性。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Ocsc711xx.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheActaeonMagnumEx.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Pcss56l.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Pcss65lPlus.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSmoothTorque.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "EGスーパーバスシート・スリム": {
    "text": "■ グリップデザイン（リールシート） グリッピング性能や操作性、感度を重視し、細身で軽量なブランクタッチ方式のFuji ECSリールシート（17サイズ）を採用。 ※リールシート変更について 従来採用しておりました「EGスーパーバスシート・スリム」の生産終了に伴い、2025年8月出荷分より「Fuji ECSリールシート（17サイズ）」に変更いたしました。",
    "text_simple": "Evergreen 低轮廓卷线器座，强调贴手握持和操作稳定性。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Ocsc711xx.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheEgAction.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheTechnicalAction.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheManipulator.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheAirregius.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "チタンフレームSiCリングKガイド": {
    "text": "■ ガイドシステム すべてのガイドにチタンフレームSiCリングKガイドを採用。 ガイド数：8個（トップガイド含む） パワーのあるブランクスながら、キャスト時のロッドのしなりと操作時のラインスラックを生み出しやすいように、ティップセクションにはやや大きめの口径のガイドをセッティング。",
    "text_simple": "SiC 导环耐磨顺滑，适合长时间出线和较高负载使用。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Ocss65l.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Ocss65ml.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Ocss69h.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Ocss60ulSt.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Ocss63ulSt.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "ヘラクレスクロス製法": {
    "text": "■ ブランクス あえて低めの弾性率のカーボンマテリアルを採用したことで、軽量ルアーでもしっかり竿に乗せることができ、快適なキャストフィールを実現。バット部分はタテヨコ2方向、さらに斜め2方向、合わせて4方向にカーボン繊維をプラスしたヘラクレスクロス製法でしっかりと補強。タテ方向の曲げ剛性、ヨコ方向の圧縮剛性に斜めにクロスさせたねじれ剛性をプラスすることで、全方向に均一な強度を持つブランクスが完成。",
    "text_simple": "多轴碳布补强用于抑制竿身扭转，提升抛投、抽动和控鱼稳定性。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheEgAction.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheTechnicalAction.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheWallacea.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheManipulator.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheAirregius.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "ステンレスフレームSiCガイド": {
    "text": "■ ガイドシステム FujiステンレスフレームSiCリングガイドを採用。",
    "text_simple": "SiC 导环耐磨顺滑，适合长时间出线和较高负载使用。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheEgAction.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheWallacea.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheEgMoving.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheEgSwimming.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheAerial.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "Fuji ACSリールシート": {
    "text": "■ リールシートデザイン メイントリガー、セカンドトリガーなどグリッピングサポートを向上させたオフセットデザインのブランクタッチ方式Fuji ACSリールシートを採用。",
    "text_simple": "卷线器座影响握持贴合、重量和手部感度传递。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheWallacea.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheMetalWhip.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Sparkshot.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheOcelot.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheServal.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "4軸ヘラクレスクロス": {
    "text": "■ オリジナル・スパイラルガイドセッティング 4軸ヘラクレスクロス製法のバットパワーを最大限活かすため、バットセクションのガイド、リール側から手前2つを上向きに配置したオリジナル・スパイラルガイドセッティング。",
    "text_simple": "多轴碳布补强用于抑制竿身扭转，提升抛投、抽动和控鱼稳定性。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheMetalWhip.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheHeracles7.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheActaeon.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheStrikeMaster77.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheActaeonMagnumEx.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "Fuji チタンフレームSiCリング・ダブルフットガイド": {
    "text": "■ ガイドシステム 強度と耐久性を重視したFujiチタンフレームSiCリングダブルフットガイドをオリジナルセッティング。",
    "text_simple": "SiC 导环耐磨顺滑，适合长时间出线和较高负载使用。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheHeracles.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheForcegrandis7.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBluemeister7.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheHeracles7.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheActaeon.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "4軸クロス": {
    "text": "■ ブランク キャスト性を重視した、クセのない美しいベントカーブを描くオールチューブラー。ティップはキャスト性、フッキング性、感度すべてを考慮し、適度な張りを備えながらも繊細さを失わない絶妙な設計。バットは元ガイドまで4軸クロスで補強しリフティングパワーを高めました。",
    "text_simple": "多轴碳布补强用于抑制竿身扭转，提升抛投、抽动和控鱼稳定性。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBlackRegius.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcc68ml.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcc610m.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcc611mh.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcc71mh.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "LGトップガイド": {
    "text": "■ ガイドシステム ブランクの持つ特性を活かし、軽快な操作性をもたらすセミマイクロKガイドセッティング。トップガイドはコンパクトで糸がらみの少ないLGトップガイドを採用。軽量化にこだわったスレッドレス仕様で段差を取る処理を施しています。",
    "text_simple": "轻量顶导环降低竿稍负担，减少缠线并提升竿稍反应。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheUtSpin.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSolidSensor61.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcc68ml.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcc610m.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcc611mh.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "MNガイド": {
    "text": "■ ガイドシステム バット～ティップ部はLRVガイド、トップはMNガイドを採用。ガイドへの糸絡みを大きく低減するセッティング。フレームは高強度かつ軽量なチタン製、リングは高信頼性を誇るSiC-Sを採用（トップのみSiC-J）。",
    "text_simple": "该技术用于对应型号的竿坯、导环或握把配置，影响重量、感度、出线和控鱼稳定性。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/ThePowerShaker68ml.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/ThePowerShaker611m.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Prej5082.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Prej5083.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Prej5084.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "Fuji VSSリールシート": {
    "text": "■ リールシートデザイン 精悍なブラック塗装に仕上げたFuji VSSリールシートを採用。操作性重視のダウンロック仕様。",
    "text_simple": "卷线器座影响握持贴合、重量和手部感度传递。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/ThePowerShaker68ml.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/ThePowerShaker611m.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSmoothTorque.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheFortuneBlue.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcs611l.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "Fuji ステンレスフレームSiCリング・シングルフットKガイド": {
    "text": "■ ガイドシステム 全ガイドにSiCリング・ステンレスフレーム・シングルフットのFuji Kガイドを採用。ガイドフットによるベンドカーブへの干渉を最小限に抑え、ブランク本来の性能を引き出すセッティング。",
    "text_simple": "SiC 导环耐磨顺滑，适合长时间出线和较高负载使用。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Hfac65m.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Hfac66ml.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "チタンフレーム・シングルフット・トルザイトリング": {
    "text": "■ ガイドシステム ティップ側はチタンフレーム・シングルフット・トルザイトリング、バット側はステンフレーム・ハイフット・SiCリング。シャープな振り抜けを実感できる、バランスに優れたセッティング。",
    "text_simple": "单脚导环减轻竿身负担，让竿稍和中前段动作更轻快。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheWarrior.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheTempest.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheTyrant.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheExplorer.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheDriftMaster.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "ECSリールシート": {
    "text": "■ リールシートデザイン 巻き物に多用される体高のある丸型ベイトリールをセットしてもパーミングしやすい形状のECSリールシート（17サイズ）。 ・しっかり握り込める体高の低さとヘビールアー使用時に力の入れやすいある程度の太さを併せ持ちます。",
    "text_simple": "卷线器座影响握持贴合、重量和手部感度传递。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheWildShooter.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSharpShooter.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheDigger.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "ステンレス強化シングルフットフレームSiCリング": {
    "text": "PCSC-71M+ シャープシューター ビッグプラグをも許容範囲に収めるスーパーバーサタイルなスイミングジグスペシャル。 巻き物の中でも波動の弱い部類にカテゴライズされるルアー、スイミングジグを精密に扱うために磨き上げられたロッド、シャープシューター。 バイトチャンスを作り、フッキングにまで持ち込む……スイミングジグの釣りで難しいとされるこの一連の流れを高確率で成功させるために。",
    "text_simple": "单脚导环减轻竿身负担，让竿稍和中前段动作更轻快。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSharpShooter.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheDigger.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "ステンレスダブルフットフレームSiCリング": {
    "text": "PCSC-71M+ シャープシューター ビッグプラグをも許容範囲に収めるスーパーバーサタイルなスイミングジグスペシャル。 巻き物の中でも波動の弱い部類にカテゴライズされるルアー、スイミングジグを精密に扱うために磨き上げられたロッド、シャープシューター。 バイトチャンスを作り、フッキングにまで持ち込む……スイミングジグの釣りで難しいとされるこの一連の流れを高確率で成功させるために。",
    "text_simple": "双脚导环提升导环支撑强度，适合更高负载或强力控鱼。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSharpShooter.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheDigger.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "ステンレスフレームSiCリングKガイド": {
    "text": "■ ガイドシステム ライントラブルを軽減するKガイドをオリジナルセッティング。高強度ステンレスフレーム、SiCリングを採用。",
    "text_simple": "SiC 导环耐磨顺滑，适合长时间出线和较高负载使用。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Pcss56l.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Pcss65lPlus.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Pspj603l15.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Pspj603l.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Pspj603l5.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "カーボンスリーブ・フォアグリップ": {
    "text": "■ フォアグリップ ●肉厚でトルクフルなブランクに対し、操作時に人差し指を添えて支えるためのEVA＋カーボンスリーブ・フォアグリップ。点（指の先）ではなく面（指の腹）が接地するため余計な力を入れずにしっかりと支えることができます。",
    "text_simple": "碳管/碳套件用于减重和加强握把区域的整体感。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSmoothTorque.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "ステンレスフレーム・ハイフット・SiCリング": {
    "text": "■ ガイドシステム ティップ側はチタンフレーム・シングルフット・トルザイトリング、バット側はステンフレーム・ハイフット・SiCリング。シャープな振り抜けを実感できる、バランスに優れたセッティング。",
    "text_simple": "该技术用于对应型号的竿坯、导环或握把配置，影响重量、感度、出线和控鱼稳定性。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheFortuneBlue.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "低レジン素材": {
    "text": "CLCC-68ML ベイトフィネス、ライトプラッギングを広範囲にカバー。 しなやかでブレの無いファストテーパー・ミディアムライトパワーのブランク。 ブランクに対するラインの遊びが少ない超軽量セミマイクロガイドセッティングで優れた感度をもたらし、またショートグリップとの相乗効果で軽快な操作性を持つライトゲームスペシャル。 ベイトフィネスからライトプラッギングまで、スピニングとベイトキャスティングの境界を幅広くカバーする一本です。",
    "text_simple": "低树脂碳素材减少多余重量，让竿身更清脆、更有张力。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcc68ml.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcc610m.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcc611mh.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcc71mh.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcc71h.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "スレッドレス仕様": {
    "text": "■ ジョイント ジョイント部は、面で接する高品位スピゴットジョイントを採用。ティップに伝わる信号をロスなく手元へと伝達します。口部分は補強テープのみのリジッドなスレッドレス仕様。",
    "text_simple": "减少导环绑线和涂装重量，让竿稍反应更轻快。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcc68ml.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcc610m.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcc611mh.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcs611l.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcs70ml.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "スピニングセミマイクロKガイド": {
    "text": "■ ガイドシステム 元ガイドに小口径でスリムなハイフットKガイドをセットし、美しいチョークコントロールで放出されたラインをティップの小口径Kガイドに送り込む、感度と操作性に優れたスピニングセミマイクロKガイドセッティング。トップガイドはコンパクトで糸がらみの少ないLGトップガイドを採用。軽量化にこだわったスレッドレス仕様で段差を取る処理を施しています。",
    "text_simple": "K 导环配置降低缠线风险，让 PE 或较细线出线更稳定。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcs611l.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcs70ml.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "ハイフットKガイド": {
    "text": "■ ガイドシステム 元ガイドに小口径でスリムなハイフットKガイドをセットし、美しいチョークコントロールで放出されたラインをティップの小口径Kガイドに送り込む、感度と操作性に優れたスピニングセミマイクロKガイドセッティング。トップガイドはコンパクトで糸がらみの少ないLGトップガイドを採用。軽量化にこだわったスレッドレス仕様で段差を取る処理を施しています。",
    "text_simple": "K 导环配置降低缠线风险，让 PE 或较细线出线更稳定。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcs611l.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcs70ml.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "Fuji ステンレスフレームKガイド": {
    "text": "■ ガイドシステム ライントラブルが少なく、シングルフットでよりアクションの妨げになりにくいFujiステンレスフレーム Kガイドをオリジナルセッティング。",
    "text_simple": "K 导环配置降低缠线风险，让 PE 或较细线出线更稳定。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcs75m.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Clcs77mh.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSlackjerk88.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSlackjerk92.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheRazorjerk86.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "RVガイド": {
    "text": "■ ガイドシステム バット～ティップ部はLRVガイド、トップはKGガイドを採用。ガイドへの糸絡みを大きく低減するセッティング。フレームは高強度かつ軽量なチタン製、リングは高信頼性を誇るSiC-Sを採用（トップのみSiC-J）。",
    "text_simple": "该技术用于对应型号的竿坯、导环或握把配置，影响重量、感度、出线和控鱼稳定性。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Prej5082.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Prej5083.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Prej5084.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Pslj6031.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Pslj60315.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "SiC-J": {
    "text": "■ ガイドシステム バット～ティップ部はLRVガイド、トップはKGガイドを採用。ガイドへの糸絡みを大きく低減するセッティング。フレームは高強度かつ軽量なチタン製、リングは高信頼性を誇るSiC-Sを採用（トップのみSiC-J）。",
    "text_simple": "该技术用于对应型号的竿坯、导环或握把配置，影响重量、感度、出线和控鱼稳定性。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Prej5082.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Prej5083.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Prej5084.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Pslj6031.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Pslj60315.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "Fuji T-DPS22": {
    "text": "■ リールシートデザイン 太めのリールシートFuji T-DPS22は、ムダな力をかけることなく手のひらに乗せるだけでシャクることができるため、ブランクスから伝わるシグナルをロスなく感じ取ることができます。",
    "text_simple": "该技术用于对应型号的竿坯、导环或握把配置，影响重量、感度、出线和控鱼稳定性。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Prej5082.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Prej5083.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Prej5084.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Pslj6031.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Pslj60315.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "エバーグリーンオリジナルアーバー": {
    "text": "■ オリジナルアーバー ブランクとリールシートの隙間を埋めるスペーサーにエバーグリーンオリジナルアーバーを採用。超軽量、超高感度素材で底質や潮の変化、魚の気配に至るまで「感じ取る」性能が大幅に向上。",
    "text_simple": "Evergreen 自有轻量垫圈/填隙结构，提升握把处感度传递。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Prej5082.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Prej5083.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Prej5084.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Pslj6031.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Pslj60315.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "チタンKガイド": {
    "text": "■ ガイドシステム トップガイドはあえてスレッドを巻かず段差を取る処理のみの仕様。ティップからバットにかけては糸絡みしにくいチタンKガイドのスリムなハイフット仕様。また、トルザイトリングを採用することでさらなる軽量化、ブレ抑制、高感度を実現。あえて小口径化せず内径を広げることで、あとひと伸びの飛距離のアドバンテージを約束します。（トップガイドのみSiCリング）",
    "text_simple": "K 导环配置降低缠线风险，让 PE 或较细线出线更稳定。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheWhipjerk73.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheLashjerk75.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Nims77sl.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheTechnimaster82.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Nims86sl.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "チタンLGトップ": {
    "text": "■ ガイドシステム トップガイドには超軽量で糸絡みしにくいチタンLGトップを採用。あえてスレッドを巻かず段差を取る処理のみの仕様。ティップからバットにかけては糸絡みしにくいチタンKガイドのスリムなハイフット仕様。また、全ガイドにトルザイトリングを採用することでさらなる軽量化、ブレ抑制、高感度を実現。あえて小口径化せず内径を広げることで、あとひと伸びの飛距離のアドバンテージを約束します。",
    "text_simple": "轻量顶导环降低竿稍负担，减少缠线并提升竿稍反应。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSlackKing110.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheResponseMaster80.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheRockyHantsman.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheMarksman.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "カーボンパイプスペーサー": {
    "text": "■ リールシートデザイン 精悍なブラックポリッシュに塗装されたハイフィットタイプのFuji IPSリールシートを採用。カーボンパイプスペーサーを取り付け、しっかり握りこめて段差の少ない設計。",
    "text_simple": "碳管/碳套件用于减重和加强握把区域的整体感。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSlackjerk88.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheSlackjerk92.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheRazorjerk86.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheRazorjerk90.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheMagnumjerk710.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "チタンフレームLNガイド": {
    "text": "■ ガイドシステム 強度に優れるオールダブルフットガイドを採用。中でも軽量でフレキシブル性の高いチタンフレームLNガイドをチョイス。ブランクの性能を極力妨げずにパワーフィッシングで必要な強度を確保します。",
    "text_simple": "该技术用于对应型号的竿坯、导环或握把配置，影响重量、感度、出线和控鱼稳定性。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheGranFury.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheGranSword.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "Fuji チタンフレーム・トルザイトリングガイド": {
    "text": "■ ガイドシステム ラインが絡みにくいKガイドをオリジナルセッティング。一気にチョークし一直線状にラインを放出させるライン収束効果で飛距離がアップ。Fujiチタンフレームトルザイトリングガイドを採用。（トップガイドのみSiCリング）",
    "text_simple": "TorZite 导环更轻、内径利用率高，有利于减重、出线和感度。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Zags87lmlr.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Zags87mmh.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Zags91ull.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheWideAttacker92.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Zags96lPlusR.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "46トンカーボン": {
    "text": "■ ブランク とりわけショートバイトやボトムの質感を「ビリビリ」と掌に伝達する反響感度に優れたフルチューブラー構造を採用。 感度・操作性を損なうことなく、瞬間的なフックセット能力、魚の頭をコントロールするファイト性能、爆発的な飛距離を叩き出すロングキャスト性能を実現するため、ティップ～センターには高強度・高弾性率炭素繊維『トレカ®T1100G』に『ナノアロイ®技術』を適用した33トンカーボンをメイン素材としてふんだんに使用し、自重を超軽量に仕上げながらも反発力をさらに強化。",
    "text_simple": "46トンカーボン表示该型号竿坯使用的碳布等级，用于调整轻量、硬挺度和回弹。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheMightyHuntsman.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/Amss510.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "チタンKGトップ": {
    "text": "■ ガイドシステム トルザイトリングを全ガイドに採用。「超軽量でティップがブレない」「表面が滑らかでノイズが少ない」という機能で、更なる軽量化・感度アップを実現します。トップガイドには超軽量で糸絡みしにくいチタンKGトップを採用し、あえてスレッドを巻かず段差を取る処理のみの仕様。ティップからバットにかけては糸絡みしにくいチタンKガイドのスリムなハイフット仕様。さらに各ガイドスレッドの巻き量、コーティング量を極力抑え、徹底的な高感度軽量化を実現。",
    "text_simple": "轻量顶导环降低竿稍负担，减少缠线并提升竿稍反应。",
    "sources": [
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/ThePetitPricker.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheBbHitman.html"
      },
      {
        "group": "evergreen_rod_import",
        "url": "https://www.evergreen-fishing.com/goods_list/TheRockyDagger.html"
      }
    ],
    "groups": [
      "evergreen_rod_import"
    ]
  },
  "HONEYCOMB HEAD LOCKING SYSTEM": {
    "text": "",
    "text_simple": "蜂巢式头部锁紧结构，用来提高轮座前端固定刚性，让卷线器和竿胚连接更稳。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/asl7117x/"),
      megabassSource("https://www.megabass.co.jp/site/products/arms_sl_asl6402x/"),
      megabassSource("https://www.megabass.co.jp/site/products/asl7005x/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "LEVEL FIT CENTER BALANCING SYSTEM": {
    "text": "",
    "text_simple": "中轴平衡调校思路，减少持竿时的头重感，让连续抛投和操作更省力。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/asl7117x/"),
      megabassSource("https://www.megabass.co.jp/site/products/arms_sl_asl6402x/"),
      megabassSource("https://www.megabass.co.jp/site/products/asl7005x/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "ITO WOVEN GRAPHITE GUIDE STAGE": {
    "text": "ITO WOVENグラファイトガイドステージ ITO アーティフィカル・カスタムスレッドラッピング Fuji TORZITEガイドリング＋TITANIUMフレームARMSセッティング ITO WOVEN GRAPHITE GUIDE STAGE ITO ARTIFICAL CUSTOM THREAD WRAPPING Fuji TORZITE GUIDE RING＋TITANIUM FRAME ARMS SETTING",
    "text_simple": "导环脚位的织纹碳纤维支撑层，强化导环安装区域，减少局部受力和扭动。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/asl7117x/"),
      megabassSource("https://www.megabass.co.jp/site/products/arms_sl_asl6402x/"),
      megabassSource("https://www.megabass.co.jp/site/products/asl7005x/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "ITO ARTIFICIAL CUSTOM THREAD WRAPPING": {
    "text": "ITO WOVENグラファイトガイドステージ ITO アーティフィカル・カスタムスレッドラッピング Fuji TORZITEガイドリング＋TITANIUMフレームARMSセッティング ITO WOVEN GRAPHITE GUIDE STAGE ITO ARTIFICAL CUSTOM THREAD WRAPPING Fuji TORZITE GUIDE RING＋TITANIUM FRAME ARMS SETTING",
    "text_simple": "ITO 定制导环绑线工艺，通过更精细的缠线控制保护导脚并减少多余重量。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/asl7117x/"),
      megabassSource("https://www.megabass.co.jp/site/products/arms_sl_asl6402x/"),
      megabassSource("https://www.megabass.co.jp/site/products/asl7005x/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "Fuji TORZITE GUIDE RING＋TITANIUM FRAME ARMS SETTING": {
    "text": "ITO WOVENグラファイトガイドステージ ITO アーティフィカル・カスタムスレッドラッピング Fuji TORZITEガイドリング＋TITANIUMフレームARMSセッティング ITO WOVEN GRAPHITE GUIDE STAGE ITO ARTIFICAL CUSTOM THREAD WRAPPING Fuji TORZITE GUIDE RING＋TITANIUM FRAME ARMS SETTING",
    "text_simple": "Fuji Torzite 环配钛框导环，降低出线摩擦和导环重量，利于远投、轻快回弹和高灵敏反馈。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/asl7117x/"),
      megabassSource("https://www.megabass.co.jp/site/products/arms_sl_asl6402x/"),
      megabassSource("https://www.megabass.co.jp/site/products/asl7005x/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "TOP GUIDE THREAD": {
    "text": "",
    "text_simple": "顶导环绑线处理，保护竿梢导环脚位，减少高频抛投和控饵时的松动风险。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/asl7117x/"),
      megabassSource("https://www.megabass.co.jp/site/products/arms_sl_asl6402x/"),
      megabassSource("https://www.megabass.co.jp/site/products/asl7005x/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "ITO CARBON HANDLE": {
    "text": "",
    "text_simple": "ITO 碳纤维手柄，减轻后握重量并提升握持时的直接感，适合需要快速操控的型号。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/asl7117x/"),
      megabassSource("https://www.megabass.co.jp/site/products/arms_sl_asl6402x/"),
      megabassSource("https://www.megabass.co.jp/site/products/asl7005x/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "CARBON FIBER ERGONOMICS GRIP": {
    "text": "",
    "text_simple": "碳纤维人体工学握把，兼顾轻量、刚性和掌心贴合度，提升操作时的直连感。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/asl6401xs/"),
      megabassSource("https://www.megabass.co.jp/site/products/asl6702xs/"),
      megabassSource("https://www.megabass.co.jp/site/products/asl7003xs/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "SUPERLEGGERA FINGER TOUCH TIP DOWN BALANCER": {
    "text": "",
    "text_simple": "指触式竿梢下压平衡器，用来微调前后重量分布，降低长时间持竿的疲劳。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/asl6401xs/"),
      megabassSource("https://www.megabass.co.jp/site/products/asl6702xs/"),
      megabassSource("https://www.megabass.co.jp/site/products/asl7003xs/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "EVOLUZION MX40 SUPER-TITANIUM HYBRID SHAFT": {
    "text": "艶やかなブランクスカラーが内包する異次元のテクノロジー、それはまさに現代の「妖刀」というべきもの。超低レジン性・高弾性カーボングラファイトファイバーMX40と形状記憶特性を持つスーパーチタン製マイクロファイバーを高密度コンポジット。高荷重域で使うキャストやルアーコントロール、ファイト時には一段とタメが効く、強靭な粘り腰を発揮。 一方で、低荷重域によるリグの操作や、わずかにラインを張りながらルアーアクションや水中状況を把握する、「聴きの場面」では、ハイテンションカーボンロッドを凌ぐ、解像度が高い鮮明な感度特性を発揮。新次元のフィッシングパフォーマンスは、攻撃メソッドを広域化、多彩な攻めを快適に具現化します。",
    "text_simple": "MX40 高弹碳纤维与超钛微纤维复合竿胚，在高负载下保留韧性，同时保持清晰的水下反馈。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/evoluzion_mx40_f5half-68ti/"),
      megabassSource("https://www.megabass.co.jp/site/products/evoluzion_mx40_sp_f1-63tix-s/"),
      megabassSource("https://www.megabass.co.jp/site/products/evoluzion_mx40_sp_f3half-73tix-s/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "EVOLUZION HEAD LOCKING SYSTEM（PAT.）": {
    "text": "伊東由樹デザインによる、最新のHTI（ヒューマンタックルインターフェイス）から編み出したＮＥＷヘッドロッキングシステム。「使い心地」と「高強度特性」、「振動伝達性」の３要素を追求した独自の多軸構造を無垢の高強度アルミブロックから一体切削で造形。リール装着時、ブランクシャフトの支軸剛性を高め、Evoluzionロッドを直感的に操作するためのスペシャルファンクションです",
    "text_simple": "Evoluzion 铝切削头部锁紧系统，提升轮座区域支撑刚性和振动传递效率。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/evoluzion_mx40_f5half-68ti/"),
      megabassSource("https://www.megabass.co.jp/site/products/evoluzion_mx40_sp_f1-63tix-s/"),
      megabassSource("https://www.megabass.co.jp/site/products/evoluzion_mx40_sp_f3half-73tix-s/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "IFPS : ITO FULL PALMING SEAT（D.PAT.P）": {
    "text": "１フィンガーのみならず、２フィンガー、或いはフルパーミングでリールを握り込むなど、多彩かつ全方位で自然にフィットするグリッピングを実現させるITO製エルゴノミックリールシート。フード部にまで及ぶフィッティングの一体感を極限まで追求し、ブランクタッチによるグリッピングなど、あらゆる握りスタイルにおいて、低負荷時から高負荷時に至るまで、ロッド保持の安定性と操作性を格段に向上させています。ＨＴＩ（ヒューマンタックルインターフェイス）による人間工学から編み出したITO独自のエルゴノミックデザインです。",
    "text_simple": "ITO 全掌握持轮座，适合一指、两指到全掌握持切换，增强操竿稳定性和贴手感。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/evoluzion_mx40_f1half-66ti/"),
      megabassSource("https://www.megabass.co.jp/site/products/evoluzion_mx40_f2half-68ti/"),
      megabassSource("https://www.megabass.co.jp/site/products/evoluzion_mx40_f2-63tix/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "EVOLUZION ORIGINAL TIGHT THREADING FUJI TITANIUM FRAME SiC-S GUIDE ITO-SETTING": {
    "text": "THREAD COLOR ■BASE-1 : VERDE SCURO TOSCANA ■PINLINE : MARRONE METALIZARD ■BASE-2 : BRITISH ARMY KHAKI ■OUTER TRIM : STREAM GALAXY 各モデルが専用設計となるEvoluzionアイテム。各モデル専用にセットアップされるTITANIUMガイドについて、各ガイドフットに必要最小限の長さとなる使用量で最大限プロテクトする匠の最軽量スレッドワークは、熟練のメガバス・クラフツマンチームならではのスペシャルアートワーク。高品位かつ軽量で屈強なガイドスレッディングです。",
    "text_simple": "Evoluzion 专用 Fuji 钛框 SiC-S 导环与紧密绑线设定，减轻导环区重量并保持竿身弯曲顺畅。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/evoluzion_mx40_f5half-68ti/"),
      megabassSource("https://www.megabass.co.jp/site/products/evoluzion_mx40_sp_f1-63tix-s/"),
      megabassSource("https://www.megabass.co.jp/site/products/evoluzion_mx40_sp_f3half-73tix-s/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "ITO ENGINEERING SLANT BRIDGE（PAT.）": {
    "text": "複雑なマンメイドストラクチャーの奥の奥へ、アンダーハンドショット、バックハンドショットなど、フリーに動かせる手首の可動域を拡大。あらゆる体勢からフルアングル・ワンハンドキャストを可能とする、無垢の高強度アルミブロックから一体切削されたITO製のダウンフレームバランサー。左右側面で非対称となる、直径が異なる軽め穴が連立するデザイン。ティップセクションのライトフィールバランシングとキャストモーションの高速化に寄与します。モンスターの突進をシングルハンドでアームロックしてファイトするなど、エクステンショングリップとしても機能する、スポーツエルゴノミックデザインのスペシャルパーツです。",
    "text_simple": "ITO 斜桥式平衡/延长握把结构，帮助单手低弹道抛投、反手抛投和高负载控鱼。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/evoluzion_mx40_sp_f1-63tix-s/"),
      megabassSource("https://www.megabass.co.jp/site/products/evoluzion_mx40_sp_f3half-73tix-s/"),
      megabassSource("https://www.megabass.co.jp/site/products/evoluzion_mx40_f2-63tix/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "IES(ITO ERGONOMIC-CONTACT SEAT)（D.PAT.P）": {
    "text": "リールシートブリッジのファストバックしたハンプが手のひらの奥深くフィット。力を入れずとも自然なパーミング保持をもたらし、スピニングリールを用いる様々な動作において快適な握り心地をストレスフリーで実現。 エアリーなフォルムによって露出するブランクスに直接タッチすることができ、ディープスポットのフィネスゲームなどで求められる繊細なアタリの感知性を高めています。 The fast-back design of the reel seat bridge fits deep in the palm of the hand, providing increased contact points to improve feel and control in spinning applications. The IES’s sweeping, tapered fore-grip allows direct contact with the exposed blank, enhancing the kind of delicate bite-detection that is required in deep finesse fishing.",
    "text_simple": "ITO 纺车轮人体工学接触轮座，让手掌更深贴合并直接触碰竿胚，提升精细咬口感知。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/orochi_x10_sp_f0half_st-62xts/"),
      megabassSource("https://www.megabass.co.jp/site/products/orochi_x10_sp_f3half-70xts/"),
      megabassSource("https://www.megabass.co.jp/site/products/orochi_x10_sp_f3st-611xts/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "IAS(ITO ENGINEERING AIRY-FIT ERGONOMIC SEAT)（D.PAT.P）": {
    "text": "搭載リールとロッドブランクのみを握り込む、伊東由樹デザインによる新たなグリッピングエルゴノミクスが完成。トッププロのあらゆるフィッシング動作を解析して生まれたフォーミングは、一見するとエアリーで独特な分断形状ですが、様々な動作で必要とされるロッドホールドに必要な支持面のみが残存。必要最小限の部位による、リールとブランクスを自然なフォームで直接握り込む直感的なパーミングと圧倒的な軽量化を実現。１フィンガー、２フィンガー、３フィンガー、フルグリッピングに至るまで、多様なロッド保持スタイルに対応しながら、「シャフトの感知」、「操作のダイレクタビリティ」、「快適な操作性」を追求した、純競技仕様のエルゴノミックリールシートです。 Hand-carved by Yuki Ito, the IAS reel seat took shape through careful analysis of the reel-palming grips of top professionals. A study in ergonomic minimalism, the forming process leaves only the necessary tactile surfaces to support intuitive grip and feel. This lightweight, reductionist approach results in a pure competition-spec reel seat that embodies confident operability.",
    "text_simple": "轻量分体式人体工学轮座，保留必要支撑面，让手掌、卷线器和竿胚形成更直接的接触。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/orochi_x10_f2half_st-67xt/"),
      megabassSource("https://www.megabass.co.jp/site/products/orochi_x10_f5half-69xt/"),
      megabassSource("https://www.megabass.co.jp/site/products/orochi_x10_f4-68xt/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "Solid Tip": {
    "text": "KIRISAME COMPETITION is an extreme finesse model developed for the ultra-tough tournaments of Japan. The solid tip, made with Megabass' latest construction method, is sensitive to the most delicate bites, enabling ultra-precise rod work and improved hookup ratios. From the tip, the blank seamlessly transitions to finish with a high-torque butt section that delivers F2 level power. Integrating these disparate elements into a single shaft, X10 enables a truly unique angling experience. This is a finesse spinning model that takes pride in bringing the subtle details of no-sinker rigs, neko rigs, dropshots and small plugs to brilliant life.",
    "text_simple": "实心竿梢，能放大轻咬和细微触底信号，同时给鱼更自然的入口缓冲。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/orochi_x10_sp_f0half_st-62xts/"),
      megabassSource("https://www.megabass.co.jp/site/products/orochi_x10_sp_f3st-611xts/"),
      megabassSource("https://www.megabass.co.jp/site/products/orochi_x10_sp_f3st-611xts_2p/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "DNA-SLX Graphite System": {
    "text": "単繊維の超軽量マイクロカーボンファイバーを緻密なスクエア状に高密度レイヤード。張りと高い潰れ強度を実現するとともに、圧倒的なリフティングパワーを生むトルク（粘り）をもたらす「高伸度」特性を発揮。さらにこのＳＬＸ（スクエアードレイヤードクロス）チューブラーを２重螺旋構造できっちりと締め上げていくＤＮＡカーボンアシストによって、屈強なネジレ剛性を発揮。海のビッグフィッシュを最速でランディングするためのメガバス独自の新世代シャフトコンストラクションです。 DNA carbon shaft reinforced with SLX (Square Layer Cross) double-helix construction exhibits formidable torsional rigidity. Single strands of super-lightweight micro carbon fibers are layered into a high-density “x” pattern. This blank combines tension and elasticity—along with high fracture resistance—to create the torque required for overwhelming lifting power and control. Designed originally to handle hard-fighting giant tuna, this is Megabass’ unique next-generation trophy shaft construction, built to dominate world-record class bass.",
    "text_simple": "DNA 碳纤维辅助与 SLX 双螺旋结构，强化抗扭和抗压能力，面向大鱼控场和高负载扬竿。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/ts79x/"),
      megabassSource("https://www.megabass.co.jp/site/products/ts78x/"),
      megabassSource("https://www.megabass.co.jp/site/products/ts77x/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "All double footed and double wrapped guide system": {
    "text": "オールダブルフット＋ダブルラッピング The guide system is all double footed and double wrapped.",
    "text_simple": "全双脚导环加双层绑线，优先提升重负载下的导环稳固性和耐用度。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/ts79x/"),
      megabassSource("https://www.megabass.co.jp/site/products/ts78x/"),
      megabassSource("https://www.megabass.co.jp/site/products/ts77x/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "Reel Seat (TCS)": {
    "text": "",
    "text_simple": "Fuji TCS 类轮座设定，提供稳定的枪柄握持和卷线器固定，适合中重型抛投使用。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/ts711x_2/"),
      megabassSource("https://www.megabass.co.jp/site/products/ts72x/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "Grip Joint System": {
    "text": "",
    "text_simple": "握把端连接结构，把便携分段集中在后握区域，尽量保留主竿胚连续弯曲感。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/ts78x/"),
      megabassSource("https://www.megabass.co.jp/site/products/ts77x/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "Grip End Balancer": {
    "text": "",
    "text_simple": "后握尾端配重/平衡件，用来修正竿身重心，改善长竿或强力竿的持握平衡。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/ts78x/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "T-DPS Reel Seat": {
    "text": "",
    "text_simple": "Fuji T-DPS 轮座，强调大尺寸卷线器的稳定安装和高负载作钓时的握持可靠性。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/ts79x/"),
      megabassSource("https://www.megabass.co.jp/site/products/ts82x/"),
      megabassSource("https://www.megabass.co.jp/site/products/ts78x-plus/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "Separate Flat Grip": {
    "text": "",
    "text_simple": "分体式扁平握把，减少多余握把材料，并让手腕操作和贴身收竿更轻快。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/ts72xs/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "5-D GRAPHITE SYSTEM": {
    "text": "プロジェクトLAIHAの実験過程で新たに確立したシャフト構造テクノロジーが、5Dグラファイトシステムです。その構造名が示す通り、５つのエレメント（タテ方向、ヨコ方向、斜角方向、伸度、弾性）にそれぞれ特化させて独自設計された５つのプリプレグ・カッティングパーツを、あたかもパズルワークのように組み合わせ、１シャフトへとプレス融合。これまでのレイヤードシステムがもたらしたプリプレグのオーバーラップ（重ね巻きによる重複）を低減化させることに成功しました。低レジン製法に加え、過剰なグラファイトレイヤーが無いため、最大のロッドパフォーマンスを最小のマテリアル使用量で実現。同質のロッドパフォーマンスを最軽量のシャフトが発揮するＮＥＷデストロイヤーが、新次元のバスロッドパフォーマンスを示します。 The blank technology newly developed through the experimental LAIHA project is the 5-D GRAPHITE SYSTEM. As the name implies, this blank construction methodology leverages five prepreg patterns to best address five elements—vertical axis, horizontal axis, oblique axis, elongation and elasticity—and combine each in a painstaking puzzle matrix to maximize the application-specific performance of every blank.",
    "text_simple": "五维石墨竿胚结构，把纵向、横向、斜向、延伸度和弹性分别设计后组合，降低重叠材料并提升整体效率。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/destroyer_p5_f4half-71x/"),
      megabassSource("https://www.megabass.co.jp/site/products/destroyer_sp_p5_f3-611xs/"),
      megabassSource("https://www.megabass.co.jp/site/products/destroyer_p5_f7-70x/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "DESTROYER HEAD LOCKING SYSTEM 3 (PAT.)": {
    "text": "プロジェクトLAIHAによる無垢のアルミブロックから削り出すヘッドロッキング構造をベースに、プロダクションロッドパーツとして最適化してデザイン。リール装着時のブランクスバットの支軸剛性アップと振動の共振性を高めるため、歴代デストロイヤーのうち最も軽量化された構造です。支軸接点をこれまでよりも、よりエンド方向へと移動させ、一層のダイレクタビリティを追求しています。 Based on the machined-aluminum head-locking structure developed in the LAIHA concept project, the new Destroyer® HEAD LOCKING SYSTEM 3 is optimized for production status. The structure is the lightest of all Destroyer® series to-date, minimizing any potential interference in blank resonance and vibration transmission through the reel, in addition to highlighting the purpose-built elegance of each rod model.",
    "text_simple": "Destroyer 第三代头部锁紧系统，以轻量铝切削结构提高轮座刚性和竿胚振动传递。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/destroyer_p5_f4half-71x/"),
      megabassSource("https://www.megabass.co.jp/site/products/destroyer_p5_f7-70x/"),
      megabassSource("https://www.megabass.co.jp/site/products/destroyer_p5_f5half-72x/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "IBCS (ITO BIONOMICS CASTING SEAT)(D.PAT)": {
    "text": "伊東由樹が13名に及ぶアングラーと2000時間を超えるフィールドテストから解析して導き出したバイオノミクスフォームでデザイン。ワンフィンガー、ツーフィンガーに留まらず、フルグリッピングに至るまで、キャスティングフォーム、リトリーブフォーム、ファイティングフォーム、左右両手のスイッチングにまで究極のフィッティングを最軽量のエルゴノミックデザインで具現化。握り込んだ際に、カーボンファイバー製グラコンポシャフトと手の平、指が直接触れるコンタクト面積を圧倒的に拡大した上で、ロッドの保持性を高めています。ブランクスと一体化する「直感性能」をアングラーのあらゆる動作時にもたらしています。極限までショートトリガー化されたデザインは、重量級ルアーのキャスト時やビッグクランクのリトリーブトルクによるロッドの保持性を維持した上で、ストレスフリーの握り心地を実現しています。 Guided by angler bionomics, the Megabass original IBCS reel seat is an achievement in angler/equipment integration, ushering in a new era of comfort, utility, and performance. Minimalistic grip contours and stable short-trigger design allow for intuitive grip transitions as the angler moves through the cycle of casting, rod work, hookset and landing. Blank contact areas are maximized to deliver precise feedback without sacrificing control.",
    "text_simple": "ITO 生物工学枪柄轮座，适配抛投、检索、搏鱼和换手动作，兼顾贴手和高负载保持。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/destroyer_p5_f4half-71x/"),
      megabassSource("https://www.megabass.co.jp/site/products/destroyer_p5_f7-70x/"),
      megabassSource("https://www.megabass.co.jp/site/products/destroyer_p5_f5half-72x/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "DESTROYER ORIGINAL TIGHT THREADING Fuji TITANIUM FRAME SiC-S GUIDE": {
    "text": "ブランニュー・デストロイヤーでは、ガイドフットの長さを最小限の長さで最大限プロテクトするスレッド（糸）使用量について、極限まで低減化。ガイドまわりのオーバーラップコートによるシャフト自重の増加をとことん抑え、シャフトのたわみが発生させる揺れ戻し、スプリングバックの収束性を早め、スムーズなロッドベンディングをもたらすこだわりのマイスターハンドラッピングです。特殊繊維を採用したNEWスレッドは、通常のスレッドよりも線径が細く、ガイドとブランクスの密着性を高め、ブランクスの曲がりによる密着強度を向上化させています。 To further reduce unnecessary weight and improve performance, the Destroyer® utilizes a smaller-diameter thread made of special fiber, which allows for tighter, more effective guide wraps. This not only minimizes the wrap area and associated epoxy to reduce weight—it minimizes any negative impact that hard epoxy guide wraps can have on the natural bend-curve of the blank. The result is a smoother, more intuitive blank with minimalistic threading for maximum strength and performance.",
    "text_simple": "Destroyer 专用 Fuji 钛框 SiC-S 导环与紧密绑线，减少导环区树脂和绑线负担，让竿胚回弹更自然。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/destroyer_p5_f4half-71x/"),
      megabassSource("https://www.megabass.co.jp/site/products/destroyer_sp_p5_f3-611xs/"),
      megabassSource("https://www.megabass.co.jp/site/products/destroyer_p5_f7-70x/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "DESTROYER ORIGINAL TIGHT THREADING Fuji TITANIUM FRAME SiC-S GUIDE&TORZITE TOP RING": {
    "text": "ブランニュー・デストロイヤーでは、ガイドフットの長さを最小限の長さで最大限プロテクトするスレッド（糸）使用量について、極限まで低減化。ガイドまわりのオーバーラップコートによるシャフト自重の増加をとことん抑え、シャフトのたわみが発生させる揺れ戻し、スプリングバックの収束性を早め、スムーズなロッドベンディングをもたらすこだわりのマイスターハンドラッピングです。特殊繊維を採用したNEWスレッドは、通常のスレッドよりも線径が細く、ガイドとブランクスの密着性を高め、ブランクスの曲がりによる密着強度を向上化させています。 To further reduce unnecessary weight and improve performance, the Destroyer® utilizes a smaller-diameter thread made of special fiber, which allows for tighter, more effective guide wraps. This not only minimizes the wrap area and associated epoxy to reduce weight—it minimizes any negative impact that hard epoxy guide wraps can have on the natural bend-curve of the blank. The result is a smoother, more intuitive blank with minimalistic threading for maximum strength and performance.",
    "text_simple": "Destroyer 紧密绑线钛框 SiC-S 导环，并在顶导环使用 Torzite 环，进一步减轻竿梢并改善出线。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/destroyer_sp_p5_f2half-77xs/"),
      megabassSource("https://www.megabass.co.jp/site/products/destroyer_p5_f5-66x/"),
      megabassSource("https://www.megabass.co.jp/site/products/destroyer_p5_f7half-711x/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "MEGABASS 3D DYNAMICS PERFORMANCE GRIP": {
    "text": "世界で最も歴史ある過酷なバストーナメント、米国Ｂ.Ａ.Ｓ.Ｓの数千時間を共に戦うエルゴノミクスから生まれた、「メガバス3Dダイナミクス・パフォーマンスグリップ」。 勝つための釣りが生み出したカタチは、過酷なトーナメントの戦場とウエイイン会場に持ち込んだ数々のハイスコアフィッシュによって現出されたカタチ。メガバスならではの美しいカーボンファイバーの造形は、使い込むほどに手に馴染み、「獲る」ためのグリッピングパフォーマンスと直感性能をもたらすリニアな操作性を発揮します。 The \"Megabass 3D Dynamics Performance Grip\" was born from the ergonomics of competing together for thousands of hours in the world's oldest and toughest bass fishing circuit, B.A.S.S. The “fishing for victory” has given birth to a shape that has emerged from the harsh tournament battlefields and the many high-score fish that have been brought into the weigh-in venue. The shape of Megabass' unique and beautiful carbon-fiber makes you feel more and more comfortable in your hand as you keep use it, and it also provides high gripping performance and the linear operability that brings intuitive performance for your fishing.",
    "text_simple": "Megabass 3D 动态握把，按比赛中的抛投、操作和控鱼姿态塑形，提升掌心贴合与操控稳定性。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/destroyer_p5_f5-70x/"),
      megabassSource("https://www.megabass.co.jp/site/products/destroyer_p5_f6-69x/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "MBCS (MEGABASS BRIDGE CONSTRUCTION SEAT)(D.PAT)": {
    "text": "日本最古のアーチ型石橋として知られる、長崎県中島川に架かる「眼鏡橋」の屈強な構造からインスピレーションを得た伊東由樹がメガバスファクトリーチームと共に最新のストロングスピニングシートを生み出しました。さらに進展させた独自のＣ型アーチ構造を持つブリッジコンストラクションでデザインされたＭＢＣＳは、ファストバックするブリッジのリブがパーミングハンドに深くフィット。シャフトの振り抜き方向を正確に保持する精度の高いプレシージョンアングルによるキャスタビリティを発揮します。多面Ｒの融合で構成された独自のカッティングデザインが、最小の体積で最大の強度を実現し、操作時にはブランクスシャフトとダイレクトに指がタッチ。エリートシリーズで戦うプロスタッフ達のフィネスフィッシングで要求される、リニアな「直感性能」を発揮します。超軽量フィネスリグのボトムタッチなど、ディープコンタクトにおける感度の解像度を高めています。 Drawing strength from the robust structure of the Megane-bashi in Nagasaki, known as Japan’s oldest arched stone bridge, Yuki Ito channeled time-tested design into the development of the MBCS spinning reel seat. Featuring a curved shape that is a marriage of structural integrity and human form, MBCS rises from the blank to fit perfectly into the palm.",
    "text_simple": "Megabass 桥式纺车轮座，C 型拱桥结构兼顾强度、轻量和竿胚直触感，适合精细操作。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/destroyer_sp_p5_f3-611xs/"),
      megabassSource("https://www.megabass.co.jp/site/products/destroyer_sp_p5_f1half-72xs/"),
      megabassSource("https://www.megabass.co.jp/site/products/destroyer_sp_p5_f2half-77xs/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "OROCHI X10 ORGANIC FIBER COMPOSITE BLANKS": {
    "text": "自然素材から採取されたセルロースミクロフィブリルを骨格とするオーガニック繊維を特殊加工、主軸素材として構成した世界初のバスロッドブランクス。このオーガニックファイバー「X10」による極めて優れた高い制振性能は、軸ブレを抑え、キャスト後にピシャリと止まり、ロッドワーク時にはラグを発生させない特性を発揮。高い操作性を生み出します。 さらに、オーガニックファイバー「X10」は、外部からの衝撃吸収性が高く、ロッドの保護性能を向上化。その上、従来カーボン素材ブランクよりも軽量化を実現。 天然由来成分、自然素材をロッドマテリアルとして高純度で使用しているため、ロッド製造時において、炭素の使用量と排出量を大幅に削減化しています。 Derived from cellulose microfibrils extracted from flax, X10 material outperforms conventional carbon fiber in several key aspects, while significantly reducing C02 emissions. Firstly, the superior vibration control of X10 organic fiber suppresses the blank's axial shake, reducing extraneous “noise” to channel key information to the angler’s hands. Secondly, X10 is highly shock-absorbent, adding a protective layer to shield the blank’s carbon fiber core from external stressors.",
    "text_simple": "X10 有机纤维复合竿胚，利用更高制振和抗冲击特性减少竿身杂震，让操作反馈更干净。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/orochi_x10_sp_f0half_st-62xts/"),
      megabassSource("https://www.megabass.co.jp/site/products/orochi_x10_sp_f3half-70xts/"),
      megabassSource("https://www.megabass.co.jp/site/products/orochi_x10_f9-710xt/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "OROCHI ALUMINUM MACHINE-CUT HOOD": {
    "text": "無垢の高強度アルミからひとつひとつマシンカット製法によって削り出される、高強度・アルミ製フード。メガバス・ロッドファクトリーによる匠の一体切削製法によって、極限まで薄肉の軽量フードを高耐久アルミマテリアルで実現。軽くて強靭、スリムなフードは、グリッピング・エルゴノミクスにも貢献。 The head-locking mechanism is machine-cut from a solid block of high-grade aluminum, delivering uncompromising strength and rigidity. Machining expertise has enabled a lightweight, high-strength design that is finished with weight-saving cutouts and shallow knurling for enhanced grip.",
    "text_simple": "Orochi 铝合金一体切削锁帽，提供高强度卷线器固定，同时通过薄壁化减轻前端重量。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/orochi_x10_sp_f0half_st-62xts/"),
      megabassSource("https://www.megabass.co.jp/site/products/orochi_x10_sp_f3half-70xts/"),
      megabassSource("https://www.megabass.co.jp/site/products/orochi_x10_f9-710xt/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "OROCHI X10 ORIGINAL TIGHT THREADING FUJI STAINLESS FRAME SiC-S GUIDE": {
    "text": "OROCHI X10のガイドフットについて最小限の長さで最大限プロテクトする匠のスレッドワークは、メガバスならではのアートワーク。細繊維による透明感あふれる美しいトルマリン・グリーンのベーススレッドに加えて、単繊維による艶めかしくも強靭なエアフォース・スクーロのスレッドを用い、高品位かつ屈強なガイドスレッディングを施しています。 The masterful thread work of the OROCHI X10 is a functional artistry unique to Megabass. Elegant tourmaline-green base threads made of fine, semi-transparent fibers are finished with lustrous and tough monofilament Air Force Scuro thread accents to create an exceedingly tight and secure guide threading.",
    "text_simple": "Orochi X10 专用 Fuji 不锈钢框 SiC-S 导环与紧密绑线，强化导脚保护并维持竿身弯曲顺畅。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/orochi_x10_sp_f0half_st-62xts/"),
      megabassSource("https://www.megabass.co.jp/site/products/orochi_x10_sp_f3half-70xts/"),
      megabassSource("https://www.megabass.co.jp/site/products/orochi_x10_f9-710xt/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "Megabass original solid tip": {
    "text": "The KIRISAME BAIT FINESSE is a long-distance finesse special. Equipped with a Megabass original solid tip, the blank exhibits the willing “give” necessary to trick finicky feeders grown wise to line tension. The X10’s taut belly section quickly converts angler energy into sure hooksets, while the X10’s organic fiber taps into a tenacious strength that can pull fighting fish away from structure. The KIRISAME is a confidence-inspiring bait finesse rod with reach and agility, enabling anglers to make long, nimble casts from the shoreline.",
    "text_simple": "Megabass 原创实心竿梢，偏向精细咬口识别和入口缓冲，适合轻量软饵与高压场景。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/orochi_x10_f2half_st-67xt/"),
      megabassSource("https://www.megabass.co.jp/site/products/orochi_x10_f2half_st-67xt_2p/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "ITS(ITO TRIGER SYSTEM ERGONOMIC CASTING SEAT)（D.PAT.）": {
    "text": "ワンフィンガー、ツーフィンガー、フルパーミングに至るキャスティングフォーム、リトリーブフォーム、ファイティングフォーム、左右持ち手を変えるスイッチングなど、パワーゲームにおける様々なグリッピングスタイルにアジャストしつつ、確実なグリッピングを要するハイパワーロッドの保持性を一段と高めます。ビッグベイトの釣りやヘヴィカバーゲームなど、パワーフィッシングに対応する快適なグリッピングエルゴノミクスを実現しています。 Built for power fishing, the sculpted design and long trigger provide overwhelming grip for big bait and heavy cover applications. Whether one or two-finger casting or utilizing a full-palm retrieve, ITS is designed to accommodate various grip styles with confidence.",
    "text_simple": "ITO 长扳机强力枪柄轮座，面向大饵和重障碍作钓，提升一指、两指和全掌握持时的稳定性。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/orochi_x10_f9-710xt/"),
      megabassSource("https://www.megabass.co.jp/site/products/orochi_x10_f7-71xt/"),
      megabassSource("https://www.megabass.co.jp/site/products/orochi_x10_f7-71xt_2p/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "LEVANTE HIGH DENSITY X-GRAPHITE SYSTEM": {
    "text": "極限まで低レジン化したレヴァンテ独自の高密度グラファイトレイヤードシステムでは、モデルごとに強靭な高強度ハイテーパー工法やレイヤーの高効率化を推進。リール装着時にロッドティップがもたらす重量感を削減しています。キャストやジャークのキレが増すシャープなシャフトアジリティとルアーコントロール時におけるダイレクタビリティを追求。 LEVANTE’s proprietary high-density layered graphite construction focuses on material efficiency and action consistency. By reducing excess resin and optimizing layer patterning for each model, the blank delivers improved balance and recovery while maintaining the durability required for daily use. The result is a responsive yet stable feel that enhances casting precision and lure control without sacrificing forgiveness.",
    "text_simple": "Levante 高密度 X 石墨结构，通过低树脂和分层优化提升竿身平衡、回弹和日常耐用性。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/f9-711lv/"),
      megabassSource("https://www.megabass.co.jp/site/products/f3-611lvs/"),
      megabassSource("https://www.megabass.co.jp/site/products/f3half-70lvs/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "LEVANTE HIGH STIFFNESS&LIGHTWEIGHT ALUMINUM MACHINE CUT HOOD": {
    "text": "メガバスロッドファクトリーの高精度技術が光る、無垢の高硬度アルミからひとつひとつ丹念に削り出されるオリジナルの軽量マシンカットフード。リールの装着性を高める高い剛性とロッドの保持・操作性に貢献する徹底した軽量化を実現しています。 Precision-machined from solid aluminum, this lightweight hood provides secure reel mounting and consistent rigidity while contributing to overall balance and durability.",
    "text_simple": "Levante 高刚性轻量铝切削锁帽，增强卷线器固定，同时控制轮座区域重量。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/f9-711lv/"),
      megabassSource("https://www.megabass.co.jp/site/products/f3-611lvs/"),
      megabassSource("https://www.megabass.co.jp/site/products/f3half-70lvs/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "ITO ENGINEERING AIRY-FIT ERGONOMIC SEAT TYPE-L（D.PAT.P）": {
    "text": "搭載リールとロッドブランクのみを直接的に握り込む、伊東由樹デザインによるミニマルなグリッピング・エルゴノミクスをITO Engineeringが具現化。エアリーで独特な分断形状は、様々な動作で必要とされるロッドホールドに必要な支持面のみを残存化させたものです。必要最小限の部位による、リールとブランクスを自然なフォームで直接握り込む直感的なグリッピングと操作性、軽量化を高い耐久性で実現しています。 LEVANTE incorporates ITO-designed ergonomic reel seats developed to support natural hand positioning and intuitive control. Minimalist contact surfaces reduce unnecessary material while preserving stability, comfort, and sensitivity.",
    "text_simple": "ITO Airy-Fit Type-L 轮座，以轻量分体支撑面提高自然握持、操控和耐用性。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/f2-66lv-4p"),
      megabassSource("https://www.megabass.co.jp/site/products/f4half-71lv-4p"),
      megabassSource("https://www.megabass.co.jp/site/products/f5-72lv-4p")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "LEVANTE ORIGINAL GUIDE SYSTEM": {
    "text": "ロッドテーパー・アクションに応じてメガバス独自のガイド配列を導き出して搭載した競技仕様のガイドシステム。感度の高い伝達性を追求しています。また、LEVANTEの圧倒的なロングキャスタビリティは、広域をスピーディーにサーチしなければならないコンペティションのシーンで存分に威力を発揮します。 THREAD COLOR ■BASE ： OLIVE DRAB ■PINLINE ： STREAM GALAXY ■OUTER TRIM ： BIANCO IMARI BLANK COLOR ■AFRICAN EBONY Matched to each rod’s taper and intended application, Megabass’s original guide layout prioritizes smooth energy transfer and feel. This system supports LEVANTE’s strong casting performance and controlled load distribution, allowing anglers to cover water efficiently while maintaining accuracy and feel. THREAD COLOR ■BASE-1 ： OLIVE DRAB ■PINLINE ： STREAM GALAXY ■OUTER TRIM ： BIANCO IMARI BLANK COLOR ■AFRICAN EBONY",
    "text_simple": "Levante 原厂导环系统，按各型号调性配置导环排列，兼顾抛投效率、控线和信号传递。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/f9-711lv/"),
      megabassSource("https://www.megabass.co.jp/site/products/f3-611lvs/"),
      megabassSource("https://www.megabass.co.jp/site/products/f3half-70lvs/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "Double-footed guides and double-wrapped guide setting": {
    "text": "MEGALATHAN is a high-power battle rod built for extreme angling applications. Developed by Project ZERO, led by Yuki Ito with direct input from U.S. tournament professionals, this formidable monster-hunter delivers world-class torque and crushing power, dominating big bait scenarios. Designed to cover the full spectrum of technical big-game applications—including oversized swimbaits; pitching, flipping, and punching into heavy cover; and magnum bait games up to 6 oz— MEGALATHAN meets the demands of tomorrow’s trophy anglers. To challenge kaiju-class targets, it is equipped with robust double-footed guides and double-wrapped for maximum durability. Despite its immense power, MEGALATHAN exhibits an exquisite rod balance that minimizes fatigue even during consecutive days of relentless big-game fishing.",
    "text_simple": "双脚导环加双层绑线设定，用在高负载型号上提升导环固定强度和耐久。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/f9-711lv/"),
      megabassSource("https://www.megabass.co.jp/site/products/f9-711lv-4p"),
      megabassSource("https://www.megabass.co.jp/site/products/f9-711lv-2p")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "VALKYRIE MULTI PIECE": {
    "text": "",
    "text_simple": "Valkyrie 多节便携结构，兼顾旅行收纳和强力作钓场景，减少移动时的携带负担。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/vkc-711xh-4/"),
      megabassSource("https://www.megabass.co.jp/site/products/vkc-66xh-3/"),
      megabassSource("https://www.megabass.co.jp/site/products/vkc-58ml-4/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "NANO MATRIX COMPOSITE SHAFT": {
    "text": "超軽量・高感度カーボンと高伸度グラスファイバーを4層にレイヤード。グラス特有の粘りにより重量級ルアーのウエイトをロッド全体で受け止め、カーボンマテリアルの驚異的な復元力でキャスティングパワーに昇華。マグナムサイズルアーを容易に振り抜ける強靭なシャフトを実現しました。また、2種類のマテリアルの相乗効果による圧倒的なパワーとトルクは、ターゲットの強烈な引きを捻じ伏せます。モンスターの暴力的な突進やエラ洗いにも柔軟に追従するグラスマテリアルは、バラシのリスクを大幅に軽減。皮一枚のフッキングでも身切れを防ぎ、高確率でランディングまで持ち込みます。数少ないチャンスを確実に掴み、価値ある一匹を獲るためのコンポジットシャフトです。 This unique multi-piece expedition series features a shaft engineered with four layers of super lightweight, high sensitivity carbon and high elasticity glass fiber. The unique resilience of glass distributes the load of heavyweight lures along the length of the rod, while the carbon material’s astonishing power supercharges casting distance and control. These features create an indominable shaft that can easily launch magnum-sized lures.",
    "text_simple": "Nano Matrix 碳纤维与玻纤复合竿胚，用玻纤韧性承受大饵负载，再借碳纤维回弹提升抛投和控鱼。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/vkc-711xh-4/"),
      megabassSource("https://www.megabass.co.jp/site/products/vkc-66xh-3/"),
      megabassSource("https://www.megabass.co.jp/site/products/vkc-58ml-4/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "All double foot stainless Fuji SiC guides": {
    "text": "",
    "text_simple": "全双脚 Fuji 不锈钢框 SiC 导环，偏重强度、耐磨和粗线高负载作钓的可靠性。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/vkc-711xh-4/"),
      megabassSource("https://www.megabass.co.jp/site/products/vkc-66xh-3/"),
      megabassSource("https://www.megabass.co.jp/site/products/vkc-58ml-4/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "BACK STOP SYSTEM": {
    "text": "",
    "text_simple": "后端防滑/止挡结构，帮助强力抛投和搏鱼时保持后握位置稳定。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/vkc-711xh-4/"),
      megabassSource("https://www.megabass.co.jp/site/products/vkc-66xh-3/"),
      megabassSource("https://www.megabass.co.jp/site/products/vkc-78h-4/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "HIGH STRENGTH HARD EVA": {
    "text": "",
    "text_simple": "高强度硬质 EVA 握把，耐磨、抗压，适合远征竿和高负载环境长期使用。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/vkc-711xh-4/"),
      megabassSource("https://www.megabass.co.jp/site/products/vkc-66xh-3/"),
      megabassSource("https://www.megabass.co.jp/site/products/vkc-78h-4/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "Small diameter #6 guides": {
    "text": "From wading to boat fishing and beyond, the versatility and control of the 78H-4 leaves past multi-piece rods in the dust. This 7’8” big bait rod gives plenty of headroom against giant targets. Having this amount of power in a mobile form factor means having a powerful weapon which you can use to continually challenge your personal records. The VKC-78H-4 can handle any lure under 120g. The incredible power counteracts heavy resistance, dramatically increasing monster encounters. The smaller diameter #6 guides compared to the VKC-711XH-4 makes it well suited for pinpoint casting of rubber jigs, heavy Texas rigs, and the fine control of bottom lures.",
    "text_simple": "#6 小口径导环设定，相比大口径导环更利于橡胶铅头钩、重德州和底操时的精准控线。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/vkc-78h-4/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "Large diameter #8 guides": {
    "text": "The best rod for shore-based distance games and wading games with the MEGADOG (130g). This long distance big plugging special can easily control 100g plus lures. The unique setup utilizing large diameter #8 guides makes for smooth contact with super thick 60lb plus leader, promising stress-free big plugging and distance games. For open water casting this universal rod can be used for all domestic lure targets. For overseas fishing, it’s perfect for 30kg class freshwater giants such as barramundi and murray cod, as well as striper, papuan bass, dorado, and mahseer. In Japan it excels against such targets as the Japanese huchen and Japanese lates. This rod combines high shaft rigidity that handles heavyweight lure casting along with flexibility that absorbs violent charges and head shaking, reducing lost bites.",
    "text_simple": "#8 大口径导环设定，适配粗前导线和重型大饵远投，减少出线阻力。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/vkc-711xh-4/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "Stainless Fuji SiC guides": {
    "text": "",
    "text_simple": "Fuji 不锈钢框 SiC 导环，兼顾耐用、顺滑出线和多环境维护成本。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/vks-88-96mh-55/"),
      megabassSource("https://www.megabass.co.jp/site/products/vks-76m-4/"),
      megabassSource("https://www.megabass.co.jp/site/products/vks-610ml-4/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "VALKYRIE MULTI PIECE & VALKYRIE EXTENSION SHAFT": {
    "text": "仕舞寸：59cm ■ VALKYRIE エクステンションシャフト 8’8”から9’6”に変更可能なエクステンションバットを装備。ウェーディングゲームからサーフ青物やショアジギングなどロングディスタンスゲームをラクラクこなす、新感覚のモバイルロッドです。 Closed Length : 59cm",
    "text_simple": "Valkyrie 多节结构配延长尾节，可切换竿长，兼顾涉水、岸投和远投机动性。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/vks-88-96mh-55/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "T3-TRIANGLE CONCEPT": {
    "text": "「TENTION（張り）」＝「TORQUE（引張強度・粘り）」＝「TORSIONAL RIGIDITY（ネジレ剛性・耐負荷強度）」の3つのT要素を3ピース・ジョイントコネクター各部位にそれぞれ特化させ、ロッドブランクストータルのパフォーマンスを引き上げるコンセプト。ファストムービングロッドと喰わせのソフトベイトロッド、テンションを重視したライトジグロッドでは、それぞれのシャフトに必要とされるT要素配列を変えて、各部位ごとに合理的にシャフトエンジニアリング。テーパーデザインによっても組み合わせを変えています。結果、1ピースロッド作成時の重複レイヤードが削減、驚異的な軽量バランスフィールを実現。 The T3 Triangle concept aims to increase the total performance of the blank by having each one of the three pieces specialize in one of the three “T” elements: TENSION, TORQUE, and TORSIONAL RIGIDITY. This logical shaft engineering allows the flexible arrangement of T elements needed to accommodate different missions, adapting to when you need a fast-moving rod, soft bait rod, or light jigging rod, etc. The arrangement also changes depending on the taper design. As a result, overlapping duplicate layers of one-piece construction are eliminated, creating an extremely lightweight, balanced feel.",
    "text_simple": "三节竿胚分别承担张力、扭矩和抗扭刚性要素，让多节竿在不同钓法中保持整体性能。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/f7-72xtz/"),
      megabassSource("https://www.megabass.co.jp/site/products/triza_f0-68xstz/"),
      megabassSource("https://www.megabass.co.jp/site/products/f1-66xstz/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "Exclusive Tip System": {
    "text": "ただいま開発中のロッドの長さを変える、トライザ「 EXTENSION シャフト」に先駆けて、まずはトライザロッドの対応メソッドをカスタマイズできる「 EXCLUSIVE ティップ」が登場！ EXCLUSIVE ティップを換装すれば、一つのモデルで対応するメソッドの幅を広げることができるのです。トライアングルパフォーマンスを発揮するトライザならではのエンジニアリングが可能とする、トライザだけのカスタマイジングをお楽しみください。 The TRIZA “Exclusive Tip” system offers two tips with different tapers to enable users to transform their rod for the adventure at hand. By exchanging the “Exclusive Tip,” one rod model can support wide-ranging applications for a truly unique travel experience. Please enjoy the customization potential unique to the TRIZA’s triangle performance!",
    "text_simple": "可替换竿梢系统，通过不同调性的竿梢扩展同一支 TRIZA 的适用钓法。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/f7-72xtz/"),
      megabassSource("https://www.megabass.co.jp/site/products/f1-66xstz/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "TRIZA carbon fiber end plate": {
    "text": "",
    "text_simple": "TRIZA 碳纤维尾端板，用于收尾保护和轻量化处理，保持旅行竿后端质感与耐用性。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/triza_f0-68xstz/"),
      megabassSource("https://www.megabass.co.jp/site/products/triza_f2-70xstz/"),
      megabassSource("https://www.megabass.co.jp/site/products/f3-72xstz/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "Butt Ferrule": {
    "text": "",
    "text_simple": "尾节插接结构，用于多节/并继连接，强调连接稳定和竿身弯曲过渡。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/f1-60xp_blanks/"),
      megabassSource("https://www.megabass.co.jp/site/products/f1-56xp_blanks/"),
      megabassSource("https://www.megabass.co.jp/site/products/f2-63xp_blanks2/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "SiC Guides": {
    "text": "",
    "text_simple": "SiC 导环环件耐磨、导热性好，能降低出线摩擦并适配 PE、氟碳等常用线材。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/f1-60xp_blanks/"),
      megabassSource("https://www.megabass.co.jp/site/products/f1-56xp_blanks/"),
      megabassSource("https://www.megabass.co.jp/site/products/f2-63xp_blanks2/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "HUNTING-ANGLE HANDLE": {
    "text": "メガバスファクトリーのエルゴノミックデータから導き出されたフォームゲージに沿って、一本一本、無垢のナチュラルウッドから入念に削り出す、HUNTSMAN™のオリジナルハンドル。熟練クラフツマンのハンドメイド工程を駆使して仕上げられます。あらゆるアングルから繰り出す正確無比なシューティングを徹底サポート。多様なグリッピングスタイルにジャストフィットします。 ※天然素材を使用している為、一つ一つ木目や色合いが異なります。予めご了承ください。 HUNTSMAN™ original handles are carefully machined one at a time from solid hardwood, following careful contours derived from ergonomic data from the Megabass Factory. The handles are then finished by hand in a painstaking process, resulting in a confidence-inspiring grip that supports pinpoint casting from all approach angles. ※The grain and color of the wood may vary due to the use of natural materials.",
    "text_simple": "Huntsman 狩猎角度手柄，按多角度精准抛投姿态削制，提升溪流短距射击式抛投的稳定性。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/ghbf511-4l/"),
      megabassSource("https://www.megabass.co.jp/site/products/ghbf53-3ul/"),
      megabassSource("https://www.megabass.co.jp/site/products/ghbf60-4l/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "HUNTSMAN™ REEL SEAT & TRIGGER": {
    "text": "無垢の高強度アルミブロックから超高精度マシンカットによって丹念に削り出されるシートパーツ群。たとえば極薄の高強度トリガーは、ヒューマンエルゴノミクスの追求から造形された無垢のナチュラルウッドハンドルと相まって、ストレスのない至極のフィッティングを実現しています。この他、数々のパーツが高強度金属から、繊細かつ美しい造形によって削り出されており、各部のパーツが高い剛性感を発揮。至宝の渓魚に挑むハンターの胸を高ぶらせます。 The ultra-thin high-strength trigger, combined with the ergonomic hardwood handle, achieves a superb, stress-free fitting that integrates distinct materials. Each carefully designed metal part is machined to the highest specifications, striving alongside the hearts of hunters as they take on the quest of sacred mountain fish.",
    "text_simple": "Huntsman 轮座与短扳机，缩短握持结构并提升贴合，方便贝イト溪流竿的快速抛投和控线。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/ghbf511-4l/"),
      megabassSource("https://www.megabass.co.jp/site/products/ghbf53-3ul/"),
      megabassSource("https://www.megabass.co.jp/site/products/ghbf60-4l/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "HUNTSMAN™ TITANIUM-SiC GUIDE SYSTEM": {
    "text": "軽量化配列を追求したNEWガイドシステム。ラインストレスの徹底した軽減化による、超・低抵抗で一段伸びる低弾道キャストと解像度を高めたシームレスなリトリーブを実現。 ガイド素材は最新の超軽量チタンフレーム、SiCマイクロガイドシステムを使用しています。 Harnessing a new guide system in pursuit of a lightweight, low-friction array, the HUNSTMAN™ enables low trajectory casts and seamless retrieves. The micro guides feature the latest ultra-lightweight titanium frame and SiC inserts, minimizing friction to push light line to its fullest potential.",
    "text_simple": "Huntsman 钛框 SiC 微导环系统，降低轻线出线阻力，改善低弹道抛投和顺滑检索。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/ghbf511-4l/"),
      megabassSource("https://www.megabass.co.jp/site/products/ghbf53-3ul/"),
      megabassSource("https://www.megabass.co.jp/site/products/ghbf60-4l/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "GREATHUNTING X-GLASS COMPOSITE SHAFT": {
    "text": "超軽量・高感度・低レジン性カーボンプリプレグと高伸度グラスファイバーを、45度θの繊維方向にて細密に積層しクロス・レイヤード。グラス特有の粘りが生み出すしなやかな追従性と、カーボン特有の瞬発的なレスポンスを高度に融合。粘りつつも操作が遅れない、適切な弾性とダイレクタビリティを両立させ、強い流れの中でも大型鱒を捻じ伏せる圧倒的なパワー＆トルクを発揮。セクションごとにあえて異なるグラス含有率を採用し、「粘り（トルク）×弾性（テンション）＝ロッドブランクス各パートの「パワー」がもたらす、「精密な操作性」と「高い運動性能」が、一本のブランクに濃縮。 極めて精巧なレイヤードを実現させた、GREATHUNTINGだけのNEWコンポジットシャフトです。",
    "text_simple": "GreatHunting X-Glass 复合竿胚，把玻纤追随性和碳纤维响应结合，适合强流中控鱼和精细操控。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/gh62-4ml-xg/"),
      megabassSource("https://www.megabass.co.jp/site/products/gh55-4ml-xg/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "GREATHUNTING ORIGINAL HUNTING GRIP": {
    "text": "",
    "text_simple": "GreatHunting 原厂狩猎握把，面向溪流和湖河场景的快速持竿、抛投和控线动作。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/gh62-4ml-xg/"),
      megabassSource("https://www.megabass.co.jp/site/products/gh55-4ml-xg/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "GREATHUNTING ORIGINAL TIGHT THREADING FUJI STAINLESS・SiC-S GUIDE": {
    "text": "",
    "text_simple": "GreatHunting 专用 Fuji 不锈钢框 SiC-S 导环与紧密绑线，兼顾轻量、耐用和小饵出线稳定。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/gh62-4ml-xg/"),
      megabassSource("https://www.megabass.co.jp/site/products/gh55-4ml-xg/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "Spigot Joint": {
    "text": "",
    "text_simple": "印笼继插接结构，让多节竿的弯曲过渡更自然，减少连接处的突兀硬点。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/gh93-2ms/"),
      megabassSource("https://www.megabass.co.jp/site/products/gh77-2mls/"),
      megabassSource("https://www.megabass.co.jp/site/products/gh84-2mls/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "High-precision Spigot Ferrule Joint System": {
    "text": "Fully parabolic blank in 5’1” flip-shot length allows for technical casts in tight spaces, and maximal enjoyment throughout the fight. Smooth-bending design allows for effortless accuracy and distance, even with light weight lures. High-precision Spigot Ferrule Joint System transfers load along the blank with a natural bend curve, virtually eliminated the flat points traditionally associated with multi-piece rods. Collapsed size of 16 inches answers backpackers’ call to challenge mountain streams at the highest level. The Extream Climber 514 is an advanced model built to target those Yamame and large Iwana navigating towards the upper basins in the farthest reaches.",
    "text_simple": "高精度印笼继系统，把负载沿竿身连续传递，尽量消除多节竿常见的连接硬点。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/gh51-4uls/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "YOLOY Protection Blanks": {
    "text": "ブランクスを激しい衝撃や傷から守り、ロッドパフォーマンスを永続的に発揮させます。",
    "text_simple": "YOLOY 竿胚保护层，增强抗刮擦和抗冲击能力，适合溪流、远征等复杂环境。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/gh93-2ms/"),
      megabassSource("https://www.megabass.co.jp/site/products/gh77-2mls/"),
      megabassSource("https://www.megabass.co.jp/site/products/gh84-2mls/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "STINGER TIP technology": {
    "text": "The KAMLOOPS STINGER is Yuki Ito’s personal model. Designed for a long distance approach in highly-pressured fields, upstream casts, and long drifts while wading, the 6’7” length allows the angler to maintain distance and cover wider areas to trigger elusive bites. With a high frame K-Guide stripper guide, the GREAT HUNTING’s original guide setting delivers the casting performance of a traditional 7’ model in a shorter frame, for increased efficiency. Tip section is equipped with STINGER TIP technology, an advance first developed for the Destroyer and Hedge Hog series to capture subtle short bites. The KAMLOOP’s blank is finished with YOLOY™ to add an additional layer of protection against scratches and damage that can occur in the wilderness.",
    "text_simple": "Stinger Tip 竿梢技术，用来捕捉短促轻咬，让小型目标或谨慎吃口更容易转化为刺鱼。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/gh67-3lss/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "High frame K-Guide stripper guide": {
    "text": "The KAMLOOPS STINGER is Yuki Ito’s personal model. Designed for a long distance approach in highly-pressured fields, upstream casts, and long drifts while wading, the 6’7” length allows the angler to maintain distance and cover wider areas to trigger elusive bites. With a high frame K-Guide stripper guide, the GREAT HUNTING’s original guide setting delivers the casting performance of a traditional 7’ model in a shorter frame, for increased efficiency. Tip section is equipped with STINGER TIP technology, an advance first developed for the Destroyer and Hedge Hog series to capture subtle short bites. The KAMLOOP’s blank is finished with YOLOY™ to add an additional layer of protection against scratches and damage that can occur in the wilderness.",
    "text_simple": "高脚 K 型起始导环，改善线圈离线和抛投出线效率，尤其适合短竿获得更长有效抛距。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/gh67-3lss/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  },
  "Stainless SiC Guide": {
    "text": "",
    "text_simple": "不锈钢框 SiC 导环，耐磨耐用，出线顺滑，适合淡水和轻型海水的长期使用。",
    "sources": [
      megabassSource("https://www.megabass.co.jp/site/products/gh93-2ms/"),
      megabassSource("https://www.megabass.co.jp/site/products/gh77-2mls/"),
      megabassSource("https://www.megabass.co.jp/site/products/gh84-2mls/")
    ],
    "groups": [
      MEGABASS_GROUP
    ]
  }
};

const OLYMPIC_SOURCES = {
  vigore: "https://olympic-co-ltd.jp/fishing/products/20-vigore/",
  veloceUx: "https://olympic-co-ltd.jp/fishing/products/21-veloce-ux/",
  superBellezza: "https://olympic-co-ltd.jp/fishing/products/18-super-bellezza/",
  bellezzaPrototype: "https://olympic-co-ltd.jp/fishing/products/26-bellezza-prototype/",
  bellezzaUx: "https://olympic-co-ltd.jp/fishing/products/24-bellezza-ux/",
  materialTechnology: "https://olympic-co-ltd.jp/fishing/material-technology/",
  reelSeat: "https://olympic-co-ltd.jp/fishing/reelseat/",
  solidTip: "https://olympic-co-ltd.jp/fishing/solidtip/"
};

const OLYMPIC_TERMS = [
  "トレカ®T1100G",
  "ナノアロイ®",
  "G-MAPS製法",
  "クワトログラファイトクロスXX",
  "チタンフレームトルザイトリングガイド",
  "KWガイド",
  "シングルフットガイド",
  "ECS16リールシート",
  "LRVガイド",
  "グリップ脱着式",
  "ECS17リールシート",
  "スーパークワトログラファイトクロス",
  "ステンレスフレームSiC-Sリング",
  "オールダブルフットKガイド",
  "VSSリールシート",
  "スピゴットフェルール（印籠継）",
  "オリジナルカーボンリールシート OP-02",
  "グラファイトクロスLV",
  "ステンレスフレームSiC-SリングKガイド",
  "ECSリールシート",
  "オールダブルフット仕様",
  "TCSリールシート",
  "フェルール（逆並継）",
  "スーパークワトログラファイトクロスLV",
  "Fuji TORZITE",
  "オリジナルシート",
  "O.S.S",
  "チタンフレームSiCトップガイド",
  "エステルライン対応ガイドセッティング",
  "ソリッドティップ",
  "トレカ®M40X",
  "ステンレスフレームSiC-Sリングガイド",
  "スリップオーバーフェルール（逆並継）",
  "オリジナルカーボンリールシート OP-01"
];

function olympicSource(url) {
  return {
    "group": OLYMPIC_GROUP,
    "url": url
  };
}

const olympicTechGlossary = {
  "トレカ®T1100G": {
    "text": "高強度と高弾性率化の両立を実現した、東レ（株）炭素繊維「トレカ®T1100G」は、次世代航空宇宙向けに開発された最高強度の33t炭素繊維です。",
    "text_simple": "高强度 33t 碳纤维，用来提升竿身强度、韧性、回弹和控鱼稳定性。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.materialTechnology),
      olympicSource(OLYMPIC_SOURCES.vigore),
      olympicSource(OLYMPIC_SOURCES.superBellezza),
      olympicSource(OLYMPIC_SOURCES.bellezzaPrototype)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "ナノアロイ®": {
    "text": "東レ（株）の「ナノアロイ®テクノロジー」は、相反し両立が困難な関係性だった樹脂の弾性率と破壊靱性について、靱性を維持しながら弾性率を向上させるという効果を実現させた革新的技術です。",
    "text_simple": "树脂层的强化技术，在保持韧性的同时提高弹性，让高强度碳布更耐冲击。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.materialTechnology),
      olympicSource(OLYMPIC_SOURCES.vigore),
      olympicSource(OLYMPIC_SOURCES.superBellezza),
      olympicSource(OLYMPIC_SOURCES.bellezzaPrototype)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "G-MAPS製法": {
    "text": "バット部には「G-MAPS製法（PAT.）」をプラスし、パワーロスを最小限に抑えつつも寄せてくれるブランクスに仕上がっています。",
    "text_simple": "强化竿身后段的制造方法，减少力量损耗，让远投、扬竿和控鱼更稳定。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.vigore),
      olympicSource(OLYMPIC_SOURCES.superBellezza),
      olympicSource(OLYMPIC_SOURCES.bellezzaPrototype)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "クワトログラファイトクロスXX": {
    "text": "バット部には「G-MAPS製法（PAT.）」・「クワトログラファイトクロスXX」を採用することでブレの無い強靭なアクションを実現。",
    "text_simple": "后段四轴补强材料，重点抑制扭转和竿身晃动，让抛投和控鱼更稳。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.vigore)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "チタンフレームトルザイトリングガイド": {
    "text": "全モデルに軽量なチタンフレームトルザイトリングガイドを採用。ロッドの持ち重りを軽減させます。",
    "text_simple": "钛框 Torzite 导环更轻，降低前端重量，提升抛投、控线和手感反馈。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.vigore),
      olympicSource(OLYMPIC_SOURCES.superBellezza),
      olympicSource(OLYMPIC_SOURCES.bellezzaPrototype)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "KWガイド": {
    "text": "71Hはフルチタンフレームトルザイトリング仕様で、バット部には感度と強度を両立するKWガイドを配置。",
    "text_simple": "底部 KW 导环用于兼顾强度和感度，适合粗线、重负载和障碍区操作。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.vigore)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "シングルフットガイド": {
    "text": "ティップ方向にはシングルフットガイドを配置することでシャープな使用感に。",
    "text_simple": "竿梢段单脚导环减轻前端负担，让竿尖动作更轻快、反馈更直接。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.vigore)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "ECS16リールシート": {
    "text": "高感度で繊細な操作が可能なECSリールシートを採用（71H、75MはECS16、76MH、77XHはECS17)。",
    "text_simple": "16 规格 ECS 轮座，枪柄握持更贴手，适合底操和硬饵操作的细微反馈。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.vigore)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "LRVガイド": {
    "text": "75M、76MHはフルチタンフレームトルザイトリング仕様で、ストリッピングガイドにはラインの収束を助け飛距離を伸ばすためのLRVガイドを配置。",
    "text_simple": "底部 LRV 导环帮助线束更快收敛，远投和出线稳定性更好。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.vigore)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "グリップ脱着式": {
    "text": "75M、76MH、77XHは持ち運びに便利なグリップ脱着式。",
    "text_simple": "握把可拆结构，主要改善长竿收纳和移动便利性。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.vigore),
      olympicSource(OLYMPIC_SOURCES.veloceUx)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "ECS17リールシート": {
    "text": "高感度で繊細な操作が可能なECSリールシートを採用（71H、75MはECS16、76MH、77XHはECS17)。",
    "text_simple": "17 规格 ECS 轮座，适合更高负荷枪柄型号，握持支撑和控鱼稳定性更强。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.vigore)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "スーパークワトログラファイトクロス": {
    "text": "精密な細ピッチで繊維を巻く構造と、各方向の繊維を高弾性化させ、運動性能が格段にパワーアップした「スーパークワトログラファイトクロス」。",
    "text_simple": "强化版四轴碳布，用来提升竿身强度、回弹和重负荷下的稳定性。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.materialTechnology),
      olympicSource(OLYMPIC_SOURCES.vigore)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "ステンレスフレームSiC-Sリング": {
    "text": "77XHは強度に優れたステンレスフレームSiC-Sリング＆オールダブルフットKガイドのヘビーデューティー仕様。",
    "text_simple": "不锈钢框 SiC-S 环更重视强度和耐用，适合大饵、粗线和高负荷使用。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.vigore)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "オールダブルフットKガイド": {
    "text": "77XHは強度に優れたステンレスフレームSiC-Sリング＆オールダブルフットKガイドのヘビーデューティー仕様。",
    "text_simple": "全双脚 K 导环提升固定强度，适合大饵和高阻力控鱼。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.vigore)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "VSSリールシート": {
    "text": "610ML、742Mには軽量・細身のVSSリールシートをアップロックで採用。",
    "text_simple": "直柄轻量细身轮座，适合精细控线、轻饵操作和长时间握持。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.vigore),
      olympicSource(OLYMPIC_SOURCES.veloceUx)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "スピゴットフェルール（印籠継）": {
    "text": "ジョイントは高精度なスピゴットフェルール(印籠継)を採用し、スムースなベンディングカーブを実現。",
    "text_simple": "印笼接节让两节竿弯曲更顺，减少接节处突兀感。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.vigore),
      olympicSource(OLYMPIC_SOURCES.superBellezza),
      olympicSource(OLYMPIC_SOURCES.bellezzaPrototype)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "オリジナルカーボンリールシート OP-02": {
    "text": "「OP-02」は、ワンフィンガーからフォーフィンガーまで、全ての握り方に高次元対応する自由度が高いグリップ形状により、ライトゲームからパワーゲームまで幅広く適応するオールラウンドモデルです。",
    "text_simple": "Olympic 自家 OP-02 碳纤维轮座，握法自由度高，兼顾轻量、刚性和感度。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.reelSeat),
      olympicSource(OLYMPIC_SOURCES.vigore)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "グラファイトクロスLV": {
    "text": "バットセクションには「グラファイトクロスLV」を採用することにより、軽量化をはかりつつ、ねじれ・つぶれ剛性を最適なフィーリングに調整。",
    "text_simple": "轻量交织碳布，用于调整后段扭转和压溃刚性，让竿身更稳、更轻。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.veloceUx),
      olympicSource(OLYMPIC_SOURCES.bellezzaUx)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "ステンレスフレームSiC-SリングKガイド": {
    "text": "全モデルにステンレスフレームSiC-SリングKガイドを採用。",
    "text_simple": "不锈钢框 SiC-S K 导环，兼顾耐用性、顺滑出线和抗缠线表现。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.veloceUx)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "ECSリールシート": {
    "text": "ベイトモデルにはECSリールシート(74XはTCSリールシート）、スピニングモデルにはVSSリールシートを採用。",
    "text_simple": "枪柄 ECS 轮座更适合贴手握持和底操反馈，硬饵、软饵切换更稳定。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.veloceUx)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "オールダブルフット仕様": {
    "text": "全モデルにステンレスフレームSiC-SリングKガイドを採用。74Xはオールダブルフット仕様。",
    "text_simple": "全双脚导环配置更重视强度，适合大饵和高负荷型号。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.veloceUx)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "TCSリールシート": {
    "text": "ベイトモデルにはECSリールシート(74XはTCSリールシート）、スピニングモデルにはVSSリールシートを採用。",
    "text_simple": "TCS 轮座用于 74X 等强力枪柄型号，握持支撑更强。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.veloceUx)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "フェルール（逆並継）": {
    "text": "2ピースモデルのジョイント部にはフェルール（逆並継）を採用。ワンピースのようなスムースなベンディングカーブを実現。",
    "text_simple": "逆并继接节让两节竿弯曲更接近一节竿，收纳和曲线兼顾。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.veloceUx)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "スーパークワトログラファイトクロスLV": {
    "text": "SUPER QUATTRO GRAPHITE CLOTH LVは最軽量4軸組布です。0°90°45°繊維の運動エネルギー効果を損なうことなく、23％の軽量化に成功。",
    "text_simple": "轻量版四轴补强碳布，兼顾扭转支撑和减重。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.materialTechnology),
      olympicSource(OLYMPIC_SOURCES.superBellezza),
      olympicSource(OLYMPIC_SOURCES.bellezzaPrototype)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "Fuji TORZITE": {
    "text": "Fuji TORZITE in Titanium Frame.",
    "text_simple": "Fuji Torzite 导环配置，核心价值是轻量、低摩擦和提升竿身前段反馈。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.superBellezza)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "オリジナルシート": {
    "text": "リールフットが傷つかないようにABSの保護リングがインサートされた細身のオリジナルシート。",
    "text_simple": "Olympic 原创轮座，保护轮脚并强调细身握持和轻量手感。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.superBellezza),
      olympicSource(OLYMPIC_SOURCES.bellezzaPrototype)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "トレカ®M40X": {
    "text": "繊維強度と弾性率の両方を極限追求した「トレカ®M40X」は、従来の40t炭素繊維と同等の弾性率を保持したまま、約25%の強度を向上しました。",
    "text_simple": "高强高弹碳纤维，在维持 40t 级弹性的同时提升强度，适合高感度和高支撑竿身。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.materialTechnology),
      olympicSource(OLYMPIC_SOURCES.bellezzaPrototype)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "O.S.S": {
    "text": "『感度』の数値化に成功。『O.S.S.』（OLYMPIC Sensitivity System）が誕生したのです。",
    "text_simple": "Olympic 的感度评估系统，用来把竿身反馈标准化并指导设计。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.materialTechnology),
      olympicSource(OLYMPIC_SOURCES.bellezzaPrototype)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "チタンフレームSiCトップガイド": {
    "text": "全モデルに軽量なチタンフレームトルザイトリングガイドを採用(トップガイドのみチタンフレームSiC)。",
    "text_simple": "顶导环使用钛框 SiC，兼顾竿尖轻量、耐磨和出线稳定。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.bellezzaPrototype)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "エステルライン対応ガイドセッティング": {
    "text": "主流となりつつあるエステルラインに対応したガイドセッティング。",
    "text_simple": "为酯线细线使用优化导环配置，减少出线干扰并提升管钓控线稳定性。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.bellezzaPrototype)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "ソリッドティップ": {
    "text": "繊細なソリッドティップが曲がり込み、フックが口に残ることで掛けることが可能に。",
    "text_simple": "实心竿稍更容易承接口轻咬口，让钩留在鱼口内，提高轻口挂鱼稳定性。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.bellezzaPrototype),
      olympicSource(OLYMPIC_SOURCES.bellezzaUx),
      olympicSource(OLYMPIC_SOURCES.solidTip)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "ステンレスフレームSiC-Sリングガイド": {
    "text": "ステンレスフレームSiC-Sリングガイドを採用。ライントラブルを最小限に抑えます。",
    "text_simple": "不锈钢框 SiC-S 导环，重点是耐用、顺滑出线和降低缠线问题。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.bellezzaUx)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "スリップオーバーフェルール（逆並継）": {
    "text": "ジョイント部はスリップオーバーフェルール（逆並継）で、まるでワンピースのような優美なベンディングカーブを描きます。",
    "text_simple": "逆并继接节让两节竿弯曲更顺，减少接节处突兀感。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.bellezzaUx)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  },
  "オリジナルカーボンリールシート OP-01": {
    "text": "「OP-01」は、手のひらの懐にフィットするラウンドバック形状により、力まずに包み込むようなホールド感を実現しました。また、大胆に肉抜きされた形状は、ブランクタッチしやすく感度アップと軽量化にも大きく貢献します。",
    "text_simple": "Olympic 自家 OP-01 碳纤维轮座，握持更贴掌，减重同时让手更容易接触竿坯反馈。",
    "sources": [
      olympicSource(OLYMPIC_SOURCES.reelSeat),
      olympicSource(OLYMPIC_SOURCES.bellezzaUx)
    ],
    "groups": [
      OLYMPIC_GROUP
    ]
  }
};

function appendUnique(target, item, keyFn) {
  if (!item) return;
  if (!target.some((current) => keyFn(current) === keyFn(item))) {
    target.push(item);
  }
}

for (const [term, entry] of Object.entries(olympicTechGlossary)) {
  if (!techGlossary[term]) {
    techGlossary[term] = entry;
    continue;
  }
  const current = techGlossary[term];
  const olympicText = entry.text ? `OLYMPIC: ${entry.text}` : "";
  if (olympicText && !String(current.text || "").includes(olympicText)) {
    current.text = current.text ? `${current.text}\n${olympicText}` : olympicText;
  }
  if (entry.text_simple) {
    current.text_simple = entry.text_simple;
  }
  current.sources = current.sources || [];
  for (const source of entry.sources || []) {
    appendUnique(current.sources, source, (value) => `${value.group}:${value.url}`);
  }
  current.groups = current.groups || [];
  for (const group of entry.groups || []) {
    appendUnique(current.groups, group, (value) => value);
  }
}

meta.generatedAt = "2026-05-06T17:20:04+08:00";
meta.totalTerms = Object.keys(techGlossary).length;
meta.explainedTerms = Object.values(techGlossary).filter((entry) => entry.text_simple).length;

const termsByBrand = {
  "abu": [
    "ROCS™",
    "Powerlux® 100",
    "Powerlux® 200",
    "Powerlux® 500",
    "Powerlux® 1000",
    "IntraCarbon™",
    "CCRS™",
    "2 piece ferrule locking mechanism"
  ],
  "jackall": [
    "富士工業社製SiCガイドリング",
    "トレカ®T1100G",
    "グリップジョイント構造",
    "UD Glass",
    "グラスコンポジットブランク",
    "トレカ®M40X",
    "30tカーボンソリッドティップ",
    "スパイラルガイドセッティング",
    "ロングソリッドティップ",
    "Kガイド",
    "LYガイド",
    "全ガイドKガイド",
    "ショートソリッドティップ",
    "大径トップ〜第4ガイド",
    "ダブルロックシステム",
    "富士工業製アルコナイトガイド",
    "SiCトップガイド",
    "Fujiガイド",
    "1&ハーフ設計",
    "Fuji TVSリールシート",
    "カーボンソリッドティップ",
    "Fuji ECSリールシート",
    "Fuji製オールダブルフットガイド",
    "ステンレスフレームSiCトップガイド",
    "ステンレスフレームアルコナイトガイド",
    "グラスコンポジットティップ",
    "並継構造",
    "PMNST6トップガイド",
    "グラスコンポジット素材",
    "スパイラルガイド",
    "蓄光スレッド",
    "グラスコンポジットブランクス",
    "ソフトティップ"
  ],
  "shimano": [
    "ANTI LOCK JOINT",
    "CARBONSHELL GRIP",
    "CI4+",
    "DURAMESH PROTECTOR",
    "Dyna Balance设计",
    "EXCITETOP",
    "G-CLOTH PROTECTOR",
    "HI-POWER X",
    "HI-POWER X FULLSOLID",
    "HI-POWER X SOLID",
    "HIGH RESPONSE SOLID",
    "LENGTH SWITCH SYSTEM",
    "MULTI PIECE ULTIMATE BLANKS DESIGN",
    "MUSCLE CARBON",
    "NANO PITCH",
    "SCREW LOCK JOINT",
    "SOFTUBE TOP",
    "SPIRAL X",
    "SPIRAL X CORE",
    "TAFTEC",
    "TAFTECα",
    "TAFTEC∞",
    "UBD",
    "X SEAT",
    "X 导环",
    "全碳纤维一体成型握把",
    "碳纤维一体成型握把",
    "竿梢更换系统",
    "融合握把技术"
  ],
  "ark": [
    "ARK HPCR (High Pressure Carbon Fiber Rolling) technology",
    "carbon nano tube reinforcement",
    "Fuji PTS/TVS reel seat",
    "Fuji K concept Alconite guides",
    "Multi-Direction Multi-Layer technology",
    "ARK Stainless Steel Tangle-Free Guides",
    "NanoForce Rings",
    "ARK Titanium Tangle-Free Guides",
    "Fuji K concept guides",
    "FazLite rings",
    "ARK Tangle-Free Guides",
    "Team ARK reel seat",
    "Black Coated Stainless Micro Guides System With Zirconium Inserts",
    "A-Ring technology",
    "High-Visibility Strike Indicator"
  ],
  "nories": [
    "富士工業製WBCバランサー",
    "富士工業製PTSリールシート",
    "Kガイド",
    "バリアブルテーパー",
    "ストラクチャーNXSブランク",
    "富士工業製チタンフレームトルザイトガイド",
    "KTガイド",
    "富士工業製GMステンレスフレームSiC-Sガイド",
    "LGSTトップガイド",
    "富士工業製ステンレスフレームSICガイド",
    "MNSTトップガイド",
    "LRVガイド",
    "富士工業製ECSリールシート",
    "KLガイド",
    "富士工業製VSSシート",
    "グラスコンポジット（-Gc）",
    "バキューム",
    "富士工業製VSSリールシート",
    "テレスコピック",
    "チタンフレームガイド",
    "テレスコピックハンドル",
    "ショートカーボンソリッドティップ",
    "シングルフットティップガイド",
    "富士工業製チタンフレームSiC KRコンセプトガイド",
    "SGt（シャキットグラスティップ）",
    "テレスコピックストッパー",
    "富士工業製TCSリールシート",
    "富士工業製チタンフレームトルザイトリング",
    "KRコンセプト",
    "ステンレスフレームオールダブルフットガイド",
    "グリップジョイント",
    "アンサンドフィニッシュ",
    "モーメントディレイブランク"
  ],
  "dstyle": [
    "X45フルシールド",
    "エアセンサーシート",
    "SVFカーボン",
    "ステンレスSICガイド",
    "グルーブドセンターグリップ",
    "ショートコルクグリップ",
    "コンパクトEVAリアグリップ",
    "Low Modulusカーボン",
    "異なる弾性率カーボン",
    "チタンSICガイド",
    "フォアグリップデザイン",
    "フィネススイミング向けガイドセッティング",
    "ハイクオリティカーボン",
    "中弾性ロングソリッド",
    "TORZITEガイド",
    "XULソリッドティップ",
    "ナノマテリアル配合BLUE TREKブランクス",
    "SABER SERIES EVAグリップ",
    "セパレートグリップ",
    "圧縮コルクグリップ",
    "太めフロロ/PE対応ガイドセッティング",
    "ソリッドティップ",
    "2ピース構造",
    "EVAグリップ",
    "ジョイントマーカー",
    "ULパワーソリッドティップ",
    "PE対応DSTYLEオリジナルガイドセッティング",
    "ミドスト/ボトスト向けガイドセッティング",
    "MLパワーソリッドティップ",
    "PEライン仕様ガイド",
    "高弾性ブランクス",
    "チタンSiCガイド",
    "カラースレッド",
    "ULソリッドティップ",
    "ミドスト/PE対応ガイドセッティング",
    "Hパワーソリッドティップ",
    "PE対応ガイドセッティング",
    "Lパワーソリッドティップ",
    "フルグラスブランク",
    "ストレートグリップ",
    "BLUE TREK独自配合低弾性カーボンブランクス",
    "LDBガイド",
    "パワーフィネスSPグリップ",
    "グラスコンポジットブランク",
    "ヘビーアクションソリッドティップ",
    "オールWフットガイド"
  ],
  "evergreen": [
    "トレカ®M40X",
    "トレカ®T1100G",
    "ナノアロイ®技術",
    "50トンカーボン",
    "30トンカーボン",
    "超高弾性カーボン",
    "高弾性カーボン",
    "4軸補強",
    "カーボンソリッドティップ",
    "チューブラー構造",
    "チタンフレーム・トルザイトリング・シングルフットガイド",
    "チタンフレーム・トルザイトリングLKWガイド",
    "Fuji ECSリールシート",
    "AAAシャンパンコルク",
    "ブランクタッチ方式",
    "超極薄カーボンプリプレグ",
    "高レジンカーボン",
    "4軸カーボン",
    "ステンレスフレーム・ダブルフット・SiCリングガイド",
    "トルザイトリングガイド",
    "33トンカーボン",
    "24トンカーボン",
    "高強度・高弾性率炭素繊維",
    "中弾性カーボン",
    "4軸製法",
    "4軸カーボンスリーブナット",
    "チタンフレーム・トルザイトリング・ダブルフットガイド",
    "40トンカーボン",
    "LKWガイド・SiCリング",
    "オールトルザイトリング",
    "カレイド・スーパークワトロクロス",
    "オールダブルフットガイド",
    "Fuji TCSリールシート",
    "SiC-S",
    "低弾性カーボン",
    "低レジンピュアカーボン",
    "セミマイクロKガイド",
    "チタンフレームSiCガイド",
    "±45°オリジナル4軸クロス",
    "±30°狭角オリジナル4軸クロス",
    "オールチューブラー設計",
    "完全ブランクスルー構造",
    "ZIGZAGガイドシステム",
    "オールチタンフレーム・オールトルザイトリングガイド",
    "Fuji IPSリールシート",
    "カーボンパイプ",
    "高品位スピゴットジョイント",
    "Fuji チタンフレーム・トルザイトリングKガイド",
    "Fuji VSS16リールシート",
    "ウーブンクロス補強",
    "10トンカーボン",
    "グラスコンポジット",
    "ダブルフットKガイド",
    "オールダブルフットKガイド",
    "オールステンレスフレームSiCリング",
    "EGスーパーバスシート・スリム",
    "チタンフレームSiCリングKガイド",
    "ヘラクレスクロス製法",
    "ステンレスフレームSiCガイド",
    "Fuji ACSリールシート",
    "アンサンドフィニッシュ",
    "4軸ヘラクレスクロス",
    "Fuji チタンフレームSiCリング・ダブルフットガイド",
    "4軸クロス",
    "LGトップガイド",
    "KTガイド",
    "MNガイド",
    "Fuji VSSリールシート",
    "Kガイド",
    "Fuji ステンレスフレームSiCリング・シングルフットKガイド",
    "チタンフレーム・シングルフット・トルザイトリング",
    "ECSリールシート",
    "ステンレス強化シングルフットフレームSiCリング",
    "ステンレスダブルフットフレームSiCリング",
    "ステンレスフレームSiCリングKガイド",
    "カーボンスリーブ・フォアグリップ",
    "ステンレスフレーム・ハイフット・SiCリング",
    "低レジン素材",
    "スレッドレス仕様",
    "スピニングセミマイクロKガイド",
    "ハイフットKガイド",
    "Fuji ステンレスフレームKガイド",
    "RVガイド",
    "LRVガイド",
    "SiC-J",
    "Fuji T-DPS22",
    "エバーグリーンオリジナルアーバー",
    "チタンKガイド",
    "チタンLGトップ",
    "カーボンパイプスペーサー",
    "チタンフレームLNガイド",
    "Fuji チタンフレーム・トルザイトリングガイド",
    "46トンカーボン",
    "チタンKGトップ"
  ],
  "megabass": [
    "HONEYCOMB HEAD LOCKING SYSTEM",
    "LEVEL FIT CENTER BALANCING SYSTEM",
    "ITO WOVEN GRAPHITE GUIDE STAGE",
    "ITO ARTIFICIAL CUSTOM THREAD WRAPPING",
    "Fuji TORZITE GUIDE RING＋TITANIUM FRAME ARMS SETTING",
    "TOP GUIDE THREAD",
    "ITO CARBON HANDLE",
    "CARBON FIBER ERGONOMICS GRIP",
    "SUPERLEGGERA FINGER TOUCH TIP DOWN BALANCER",
    "EVOLUZION MX40 SUPER-TITANIUM HYBRID SHAFT",
    "EVOLUZION HEAD LOCKING SYSTEM（PAT.）",
    "IFPS : ITO FULL PALMING SEAT（D.PAT.P）",
    "EVOLUZION ORIGINAL TIGHT THREADING FUJI TITANIUM FRAME SiC-S GUIDE ITO-SETTING",
    "ITO ENGINEERING SLANT BRIDGE（PAT.）",
    "IES(ITO ERGONOMIC-CONTACT SEAT)（D.PAT.P）",
    "IAS(ITO ENGINEERING AIRY-FIT ERGONOMIC SEAT)（D.PAT.P）",
    "Solid Tip",
    "DNA-SLX Graphite System",
    "All double footed and double wrapped guide system",
    "Reel Seat (TCS)",
    "Grip Joint System",
    "Grip End Balancer",
    "T-DPS Reel Seat",
    "Separate Flat Grip",
    "5-D GRAPHITE SYSTEM",
    "DESTROYER HEAD LOCKING SYSTEM 3 (PAT.)",
    "IBCS (ITO BIONOMICS CASTING SEAT)(D.PAT)",
    "DESTROYER ORIGINAL TIGHT THREADING Fuji TITANIUM FRAME SiC-S GUIDE",
    "DESTROYER ORIGINAL TIGHT THREADING Fuji TITANIUM FRAME SiC-S GUIDE&TORZITE TOP RING",
    "MEGABASS 3D DYNAMICS PERFORMANCE GRIP",
    "MBCS (MEGABASS BRIDGE CONSTRUCTION SEAT)(D.PAT)",
    "OROCHI X10 ORGANIC FIBER COMPOSITE BLANKS",
    "OROCHI ALUMINUM MACHINE-CUT HOOD",
    "OROCHI X10 ORIGINAL TIGHT THREADING FUJI STAINLESS FRAME SiC-S GUIDE",
    "Megabass original solid tip",
    "ITS(ITO TRIGER SYSTEM ERGONOMIC CASTING SEAT)（D.PAT.）",
    "LEVANTE HIGH DENSITY X-GRAPHITE SYSTEM",
    "LEVANTE HIGH STIFFNESS&LIGHTWEIGHT ALUMINUM MACHINE CUT HOOD",
    "ITO ENGINEERING AIRY-FIT ERGONOMIC SEAT TYPE-L（D.PAT.P）",
    "LEVANTE ORIGINAL GUIDE SYSTEM",
    "Double-footed guides and double-wrapped guide setting",
    "VALKYRIE MULTI PIECE",
    "NANO MATRIX COMPOSITE SHAFT",
    "All double foot stainless Fuji SiC guides",
    "BACK STOP SYSTEM",
    "HIGH STRENGTH HARD EVA",
    "Small diameter #6 guides",
    "Large diameter #8 guides",
    "Stainless Fuji SiC guides",
    "VALKYRIE MULTI PIECE & VALKYRIE EXTENSION SHAFT",
    "T3-TRIANGLE CONCEPT",
    "Exclusive Tip System",
    "TRIZA carbon fiber end plate",
    "Butt Ferrule",
    "SiC Guides",
    "HUNTING-ANGLE HANDLE",
    "HUNTSMAN™ REEL SEAT & TRIGGER",
    "HUNTSMAN™ TITANIUM-SiC GUIDE SYSTEM",
    "GREATHUNTING X-GLASS COMPOSITE SHAFT",
    "GREATHUNTING ORIGINAL HUNTING GRIP",
    "GREATHUNTING ORIGINAL TIGHT THREADING FUJI STAINLESS・SiC-S GUIDE",
    "Spigot Joint",
    "High-precision Spigot Ferrule Joint System",
    "YOLOY Protection Blanks",
    "STINGER TIP technology",
    "High frame K-Guide stripper guide",
    "Stainless SiC Guide"
  ],
  "olympic": OLYMPIC_TERMS
};

module.exports = {
  meta,
  techGlossary,
  termsByBrand
};
