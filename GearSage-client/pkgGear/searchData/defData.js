module.exports = [
  {
    "type": "reel",
    "id": 1,
    "brands": [
      {"id": 1, "name": "禧玛诺"},
      {"id": 2, "name": "达亿瓦"},
      {"id": 3, "name": "纯钓"}
    ],
    "types": [
      {"type": "spinning", "name": "纺车"},
      {"type": "baitcasting", "name": "水滴"},
      {"type": "conventional", "name": "鼓轮"}
    ],
    "options": [
      {"type": "stream", "name": "溪流"},
      {"type": "general", "name": "泛用"},
      {"type": "finesse", "name": "精细"},
      {"type": "longcast", "name": "远投"},
      {"type": "heavy", "name": "强力"},
      {"type": "saltwater", "name": "海水"}
    ],
"brakeSys": [
  {"type": "magnetic", "name": "磁力"},
  {"type": "centrifugal", "name": "离心"},
  {"type": "electronic", "name": "电子"}
]
    ,"family": [],
    "derive_family_reels": []

  },
  {
    "type": "rod",
    "id": 2,
    "brands": [
      {"id": 1, "name": "禧玛诺"},
      {"id": 2, "name": "达亿瓦"}
    ]
    ,"types": [
  {"type": "multi_section", "name": "多节"},
  {"type": "rock_fishing", "name": "根钓"},
  {"type": "stream", "name": "溪流"},
  {"type": "bass", "name": "鲈钓"},
  {"type": "long_cast", "name": "远投"},
  {"type": "versatile", "name": "泛用"},
  {"type": "finesse", "name": "精细"}
]
        ,"family": [],
    "derive_family_rods": []
  },
  {
    "type": "lure",
    "id": 3,
    "brands": [
      {"id": 4, "name": "大河奔流"},
      {"id": 5, "name": "鸦语"},
      {"id": 6, "name": "O.S.P"}
    ],
    "system": [
      {"id": "hardbait", "zh": "硬饵", "en": "Hardbait / Plug"},
      {"id": "soft", "zh": "软饵", "en": "Soft plastic"},
      {"id": "metal", "zh": "金属饵", "en": "Metal lure"},
      {"id": "wire", "zh": "钢丝系", "en": "Wire bait"},
      {"id": "jig", "zh": "JIG系", "en": "Jigs"}
    ],
    "water_column": [
      {"id": "Topwater", "zh": "水面", "en": "Topwater"},
      {"id": "Subsurface", "zh": "表层(0–0.5m)", "en": "Subsurface (0–0.5m)"},
      {"id": "Mid (0.5–2m)", "zh": "中层(0.5–2m)", "en": "Mid (0.5–2m)"},
      {"id": "Deep (2m+)", "zh": "深层(2m+)", "en": "Deep (2m+)"},
      {"id": "Bottom", "zh": "近底/底层", "en": "Near-bottom / Bottom"},
      {"id": "Variable", "zh": "全水层/操控可变", "en": "All levels (by retrieve)"}
    ],
    "action": [
      {"id": "walk_pop", "zh": "走狗/点水", "en": "Walk / Pop"},
      {"id": "jerk_dart", "zh": "抽停/急停", "en": "Jerk / Dart"},
      {"id": "wobble_roll", "zh": "摇摆摆动", "en": "Wobble / Roll"},
      {"id": "vibration", "zh": "高频震动", "en": "Vibration"},
      {"id": "glide", "zh": "滑行", "en": "Glide"},
      {"id": "spin_flash", "zh": "旋转闪光", "en": "Spin / Flash"},
      {"id": "flutter_fall", "zh": "飘落/慢沉", "en": "Flutter / Fall"},
      {"id": "crawl_creature", "zh": "底爬/触须", "en": "Crawl / Creature"},
      {"id": "worm", "zh": "虫形", "en": "Worm"},
      {"id": "frog", "zh": "蛙类", "en": "Frog / Toad"}
    ],
    "family": [
      {"id": "crank", "zh": "胖子", "en": "Crank"},
      {"id": "minnow", "zh": "米诺", "en": "Minnow"},
      {"id": "suspending_minnow", "zh": "悬停米诺", "en": "Suspending Minnow"},
      {"id": "topwater_pencil", "zh": "浮水铅笔", "en": "Topwater Pencil"},
      {"id": "sinking_pencil", "zh": "沉水铅笔", "en": "Sinking Pencil"},
      {"id": "topwater_walker", "zh": "之字狗", "en": "Topwater Walker"},
      {"id": "popper", "zh": "波爬", "en": "Popper"},
      {"id": "buzzbait", "zh": "拖拉机", "en": "Buzzbait"},
      {"id": "spinnerbait", "zh": "复合亮片", "en": "Spinnerbait"},
      {"id": "spoon", "zh": "亮片", "en": "Spoon"},
      {"id": "vib", "zh": "VIB", "en": "VIB"},
      {"id": "blade_bait", "zh": "铁板", "en": "Blade Bait"},
      {"id": "spinner", "zh": "旋转亮片", "en": "Spinner"},
      {"id": "spy_bait", "zh": "间谍饵", "en": "Spy Bait"},
      {"id": "swimbait", "zh": "多节鱼", "en": "Swimbait"},
      {"id": "weightless_soft_bait", "zh": "无铅软饵", "en": "Weightless Soft Bait"},
      {"id": "finesse_jig", "zh": "精细jig", "en": "Finesse Jig"},
      {"id": "special_lure", "zh": "异形饵", "en": "Special Lure"}
    ],
    "derive_family_rules": [
      {
        "if": { "system": "hardbait", "water_column": "Topwater", "action": "walk_pop" },
        "then": ["topwater_pencil", "topwater_walker", "popper"]
      },
      {
        "if": { "system": "hardbait", "water_column": ["Mid (0.5–2m)", "Deep (2m+)", "Bottom"], "action": "wobble_roll" },
        "then": ["crank"]
      },
      {
        "if": { "system": "hardbait", "water_column": ["Subsurface", "Mid (0.5–2m)", "Deep (2m+)", "Bottom"], "action": "jerk_dart" },
        "then": ["minnow", "suspending_minnow", "sinking_pencil"]
      },
      {
        "if": { "system": "hardbait", "action": "vibration", "water_column": ["Topwater", "Subsurface", "Mid (0.5–2m)", "Deep (2m+)", "Bottom", "Variable"] },
        "then": ["vib"]
      },
      {
        "if": { "system": "hardbait", "water_column": ["Mid (0.5–2m)", "Deep (2m+)"], "action": ["wobble_roll", "glide"] },
        "then": ["swimbait"]
      },
      {
        "if": { "system": "metal", "action": "vibration", "water_column": ["Topwater", "Subsurface", "Mid (0.5–2m)", "Deep (2m+)", "Bottom", "Variable"] },
        "then": ["blade_bait", "spy_bait"]
      },
      {
        "if": { "system": "metal", "action": ["flutter_fall", "wobble_roll"], "water_column": ["Topwater", "Subsurface", "Mid (0.5–2m)", "Deep (2m+)", "Bottom", "Variable"] },
        "then": ["spoon"]
      },
      {
        "if": { "system": "wire", "water_column": "Topwater", "action": "spin_flash" },
        "then": ["buzzbait"]
      },
      {
        "if": { "system": "wire", "water_column": ["Mid (0.5–2m)", "Deep (2m+)", "Bottom"], "action": "spin_flash" },
        "then": ["spinnerbait", "spinner"]
      },
      {
        "if": { "system": "jig", "water_column": "Bottom", "action": ["flutter_fall", "crawl_creature"] },
        "then": ["finesse_jig"]
      },
      {
        "if": { "system": "soft", "water_column": ["Mid (0.5–2m)", "Bottom"], "action": ["worm", "crawl_creature"] },
        "then": ["weightless_soft_bait"]
      }
    ]
  },
  {
    "type": "line",
    "id": 4,
    "brands": [
      {"id": 1, "name": "禧玛诺"},
      {"id": 2, "name": "达亿瓦"}
    ],
    "family": []
  },
  {
    "type": "hook",
    "id": 5,
    "brands": [
      {"id": 19, "name": "Gamakatsu"}
    ],
    "family": []
  }
];
