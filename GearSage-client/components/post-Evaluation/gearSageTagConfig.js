module.exports = {
  "version": "1.0.0",
  "app": "GearSage",
  "module": "reviewTags",
  "categoryMeta": {
    "rod": {
      "label": "鱼竿",
      "enabled": true,
      "sort": 1
    },
    "reel": {
      "label": "渔轮",
      "enabled": true,
      "sort": 2
    },
    "bait": {
      "label": "假饵",
      "enabled": true,
      "sort": 3
    },
    "line": {
      "label": "鱼线",
      "enabled": true,
      "sort": 4
    },
    "hook": {
      "label": "钩子",
      "enabled": true,
      "sort": 5
    },
    "other": {
      "label": "其他",
      "enabled": true,
      "sort": 6
    }
  },
  "groupOrder": [
    "fit",
    "budget",
    "usage",
    "otherSubType",
    "pros",
    "cons"
  ],
  "globalGroups": [
    {
      "groupKey": "fit",
      "label": "适合谁",
      "scope": "global",
      "inputType": "multi",
      "required": true,
      "minSelect": 1,
      "maxSelect": 3,
      "enabled": true,
      "sort": 1,
      "clientDisplay": {
        "showOnPublish": true,
        "showOnDetail": true,
        "showOnCard": true,
        "showOnFilter": true,
        "defaultExpanded": true,
        "collapsible": false,
        "highlight": true
      },
      "options": [
        {
          "id": "fit_beginner",
          "label": "新手入门",
          "enabled": true,
          "sort": 1,
          "clientDisplay": {
            "show": true
          }
        },
        {
          "id": "fit_intermediate",
          "label": "进阶玩家",
          "enabled": true,
          "sort": 2,
          "clientDisplay": {
            "show": true
          }
        },
        {
          "id": "fit_advanced",
          "label": "老玩家",
          "enabled": true,
          "sort": 3,
          "clientDisplay": {
            "show": true
          }
        },
        {
          "id": "fit_cost_effective",
          "label": "注重性价比",
          "enabled": true,
          "sort": 4,
          "clientDisplay": {
            "show": true
          }
        },
        {
          "id": "fit_precise",
          "label": "精细作钓",
          "enabled": true,
          "sort": 5,
          "clientDisplay": {
            "show": true
          }
        }
      ]
    },
    {
      "groupKey": "unfit",
      "label": "不适合谁",
      "scope": "global",
      "inputType": "multi",
      "required": true,
      "minSelect": 1,
      "maxSelect": 3,
      "enabled": true,
      "sort": 2,
      "clientDisplay": {
        "showOnPublish": true,
        "showOnDetail": true,
        "showOnCard": true,
        "showOnFilter": true,
        "defaultExpanded": true,
        "collapsible": false,
        "highlight": true
      },
      "options": [
        {
          "id": "unfit_beginner",
          "label": "新手不建议",
          "enabled": true,
          "sort": 1,
          "clientDisplay": {
            "show": true
          }
        },
        {
          "id": "unfit_intermediate",
          "label": "不适合远投需求",
          "enabled": true,
          "sort": 2,
          "clientDisplay": {
            "show": true
          }
        },
        {
          "id": "unfit_advanced_obstacle",
          "label": "不适合复杂障碍",
          "enabled": true,
          "sort": 3,
          "clientDisplay": {
            "show": true
          }
        },
        {
          "id": "unfit_advanced_budget",
          "label": "不适合预算有限",
          "enabled": true,
          "sort": 4,
          "clientDisplay": {
            "show": true
          }
        }
      ]
    },
    {
      "groupKey": "budget",
      "label": "预算倾向",
      "scope": "categoryAware",
      "inputType": "single",
      "required": true,
      "minSelect": 1,
      "maxSelect": 1,
      "enabled": true,
      "sort": 3,
      "clientDisplay": {
        "showOnPublish": true,
        "showOnDetail": true,
        "showOnCard": true,
        "showOnFilter": true,
        "defaultExpanded": true,
        "collapsible": false,
        "highlight": true
      },
      "categoryOptions": {
        "rod": [
          { "id": "budget_rod_value", "label": "入门性价比", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "budget_rod_balanced", "label": "均衡主力", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "budget_rod_premium", "label": "高端体验", "enabled": true, "sort": 3, "clientDisplay": { "show": true } }
        ],
        "reel": [
          { "id": "budget_reel_value", "label": "入门性价比", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "budget_reel_balanced", "label": "均衡主力", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "budget_reel_premium", "label": "高端体验", "enabled": true, "sort": 3, "clientDisplay": { "show": true } }
        ],
        "bait": [
          { "id": "budget_bait_value", "label": "日常补货", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "budget_bait_balanced", "label": "均衡常备", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "budget_bait_premium", "label": "高阶精品", "enabled": true, "sort": 3, "clientDisplay": { "show": true } }
        ],
        "line": [
          { "id": "budget_line_value", "label": "日常补货", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "budget_line_balanced", "label": "均衡常备", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "budget_line_premium", "label": "高阶精品", "enabled": true, "sort": 3, "clientDisplay": { "show": true } }
        ],
        "hook": [
          { "id": "budget_hook_value", "label": "日常补货", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "budget_hook_balanced", "label": "均衡常备", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "budget_hook_premium", "label": "高阶精品", "enabled": true, "sort": 3, "clientDisplay": { "show": true } }
        ],
        "other": [
          { "id": "budget_other_value", "label": "基础实用", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "budget_other_balanced", "label": "均衡好用", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "budget_other_premium", "label": "专业体验", "enabled": true, "sort": 3, "clientDisplay": { "show": true } }
        ]
      }
    },
    {
      "groupKey": "usage",
      "label": "使用倾向",
      "scope": "categoryAware",
      "inputType": "multi",
      "required": true,
      "minSelect": 1,
      "maxSelect": 2,
      "enabled": true,
      "sort": 4,
      "clientDisplay": {
        "showOnPublish": true,
        "showOnDetail": true,
        "showOnCard": true,
        "showOnFilter": true,
        "defaultExpanded": true,
        "collapsible": false,
        "highlight": false
      },
      "categoryOptions": {
        "rod": [
          { "id": "usage_rod_general", "label": "一竿泛用", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "usage_rod_main", "label": "高频主力", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "usage_rod_specialized", "label": "专项玩法", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "usage_rod_threshold", "label": "上手门槛高", "enabled": true, "sort": 4, "clientDisplay": { "show": true } }
        ],
        "reel": [
          { "id": "usage_reel_general", "label": "泛用搭配", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "usage_reel_main", "label": "高频主力", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "usage_reel_specialized", "label": "特定搭配", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "usage_reel_threshold", "label": "上手门槛高", "enabled": true, "sort": 4, "clientDisplay": { "show": true } }
        ],
        "bait": [
          { "id": "usage_bait_search", "label": "常备搜索", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "usage_bait_finesse", "label": "精细应对", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "usage_bait_scene", "label": "特定场景", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "usage_bait_threshold", "label": "上手门槛高", "enabled": true, "sort": 4, "clientDisplay": { "show": true } }
        ],
        "line": [
          { "id": "usage_line_general", "label": "泛用主线", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "usage_line_consumable", "label": "高频消耗", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "usage_line_scene", "label": "特定场景", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "usage_line_threshold", "label": "上手门槛高", "enabled": true, "sort": 4, "clientDisplay": { "show": true } }
        ],
        "hook": [
          { "id": "usage_hook_general", "label": "泛用常备", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "usage_hook_consumable", "label": "高频消耗", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "usage_hook_rig", "label": "特定钓组", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "usage_hook_threshold", "label": "上手门槛高", "enabled": true, "sort": 4, "clientDisplay": { "show": true } }
        ],
        "other": [
          { "id": "usage_other_daily", "label": "日常常备", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "usage_other_longtime", "label": "长时使用", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "usage_other_scene", "label": "特定场景", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "usage_other_threshold", "label": "上手门槛高", "enabled": true, "sort": 4, "clientDisplay": { "show": true } }
        ]
      }
    },
    {
      "groupKey": "fitContextTags",
      "label": "适配场景",
      "scope": "categoryAware",
      "inputType": "multi",
      "required": false,
      "minSelect": 0,
      "maxSelect": 3,
      "enabled": true,
      "sort": 5,
      "clientDisplay": {
        "showOnPublish": true,
        "showOnDetail": true,
        "showOnCard": false,
        "showOnFilter": true,
        "defaultExpanded": true,
        "collapsible": true,
        "highlight": false
      },
      "categoryOptions": {
        "rod": [
          { "id": "fit_context_rod_1", "label": "溪流微物", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "fit_context_rod_2", "label": "岸投远投", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "fit_context_rod_3", "label": "船钓点打", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "fit_context_rod_4", "label": "重障碍", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "fit_context_rod_5", "label": "开阔明水", "enabled": true, "sort": 5, "clientDisplay": { "show": true } },
          { "id": "fit_context_rod_6", "label": "近海轻作钓", "enabled": true, "sort": 6, "clientDisplay": { "show": true } }
        ],
        "reel": [
          { "id": "fit_context_reel_1", "label": "轻饵溪流", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "fit_context_reel_2", "label": "淡水泛用", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "fit_context_reel_3", "label": "岸投远投", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "fit_context_reel_4", "label": "船钓点打", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "fit_context_reel_5", "label": "拔重障碍", "enabled": true, "sort": 5, "clientDisplay": { "show": true } },
          { "id": "fit_context_reel_6", "label": "近海轻咸水", "enabled": true, "sort": 6, "clientDisplay": { "show": true } }
        ],
        "bait": [
          { "id": "fit_context_bait_1", "label": "清水慢收", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "fit_context_bait_2", "label": "浑水刺激", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "fit_context_bait_3", "label": "风浪快搜", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "fit_context_bait_4", "label": "障碍边", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "fit_context_bait_5", "label": "开阔明水", "enabled": true, "sort": 5, "clientDisplay": { "show": true } },
          { "id": "fit_context_bait_6", "label": "低活性", "enabled": true, "sort": 6, "clientDisplay": { "show": true } }
        ],
        "line": [
          { "id": "fit_context_line_1", "label": "轻饵精细", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "fit_context_line_2", "label": "淡水泛用", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "fit_context_line_3", "label": "远投开阔", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "fit_context_line_4", "label": "障碍区", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "fit_context_line_5", "label": "清水隐蔽", "enabled": true, "sort": 5, "clientDisplay": { "show": true } },
          { "id": "fit_context_line_6", "label": "近海轻咸水", "enabled": true, "sort": 6, "clientDisplay": { "show": true } }
        ],
        "hook": [],
        "other": []
      }
    },
    {
      "groupKey": "fitTechniqueTags",
      "label": "适配玩法",
      "scope": "categoryAware",
      "inputType": "multi",
      "required": false,
      "minSelect": 0,
      "maxSelect": 3,
      "enabled": true,
      "sort": 6,
      "clientDisplay": {
        "showOnPublish": true,
        "showOnDetail": true,
        "showOnCard": false,
        "showOnFilter": true,
        "defaultExpanded": true,
        "collapsible": true,
        "highlight": false
      },
      "categoryOptions": {
        "rod": [
          { "id": "fit_technique_rod_1", "label": "小饵精细", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "fit_technique_rod_2", "label": "米诺抽停", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "fit_technique_rod_3", "label": "水面系", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "fit_technique_rod_4", "label": "软虫过障", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "fit_technique_rod_5", "label": "快速搜索", "enabled": true, "sort": 5, "clientDisplay": { "show": true } },
          { "id": "fit_technique_rod_6", "label": "远投搜索", "enabled": true, "sort": 6, "clientDisplay": { "show": true } }
        ],
        "reel": [
          { "id": "fit_technique_reel_1", "label": "BFS/轻饵", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "fit_technique_reel_2", "label": "泛用搜索", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "fit_technique_reel_3", "label": "米诺抽停", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "fit_technique_reel_4", "label": "快速搜索", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "fit_technique_reel_5", "label": "软虫过障", "enabled": true, "sort": 5, "clientDisplay": { "show": true } },
          { "id": "fit_technique_reel_6", "label": "近海搜索", "enabled": true, "sort": 6, "clientDisplay": { "show": true } }
        ],
        "bait": [
          { "id": "fit_technique_bait_1", "label": "直线匀收", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "fit_technique_bait_2", "label": "抽停停顿", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "fit_technique_bait_3", "label": "表层刺激", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "fit_technique_bait_4", "label": "贴底跳底", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "fit_technique_bait_5", "label": "搜索覆盖", "enabled": true, "sort": 5, "clientDisplay": { "show": true } },
          { "id": "fit_technique_bait_6", "label": "精细慢磨", "enabled": true, "sort": 6, "clientDisplay": { "show": true } }
        ],
        "line": [
          { "id": "fit_technique_line_1", "label": "小饵精细", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "fit_technique_line_2", "label": "泛用搜索", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "fit_technique_line_3", "label": "水下感知", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "fit_technique_line_4", "label": "拔重障碍", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "fit_technique_line_5", "label": "远投搜索", "enabled": true, "sort": 5, "clientDisplay": { "show": true } },
          { "id": "fit_technique_line_6", "label": "近海路亚", "enabled": true, "sort": 6, "clientDisplay": { "show": true } }
        ],
        "hook": [
          { "id": "fit_technique_hook_1", "label": "障碍区穿草", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "fit_technique_hook_2", "label": "开阔慢搜", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "fit_technique_hook_3", "label": "精细软饵", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "fit_technique_hook_4", "label": "重型软饵", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "fit_technique_hook_5", "label": "轻口快刺", "enabled": true, "sort": 5, "clientDisplay": { "show": true } },
          { "id": "fit_technique_hook_6", "label": "巨物专用", "enabled": true, "sort": 6, "clientDisplay": { "show": true } }
        ],
        "other": []
      }
    },
    {
      "groupKey": "compareProfile",
      "label": "对比定位",
      "scope": "categoryAware",
      "inputType": "single",
      "required": false,
      "minSelect": 0,
      "maxSelect": 1,
      "enabled": true,
      "sort": 7,
      "clientDisplay": {
        "showOnPublish": true,
        "showOnDetail": true,
        "showOnCard": false,
        "showOnFilter": true,
        "defaultExpanded": true,
        "collapsible": true,
        "highlight": true
      },
      "categoryOptions": {
        "rod": [
          { "id": "compare_profile_rod_1", "label": "更适合入门", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "compare_profile_rod_2", "label": "更适合进阶", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "compare_profile_rod_3", "label": "更偏全能", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "compare_profile_rod_4", "label": "更偏专用", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "compare_profile_rod_5", "label": "手感更讨喜", "enabled": true, "sort": 5, "clientDisplay": { "show": true } },
          { "id": "compare_profile_rod_6", "label": "差异不大", "enabled": true, "sort": 6, "clientDisplay": { "show": true } }
        ],
        "reel": [
          { "id": "compare_profile_reel_1", "label": "容错更高", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "compare_profile_reel_2", "label": "手感更好", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "compare_profile_reel_3", "label": "稳定性更好", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "compare_profile_reel_4", "label": "更适合入门", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "compare_profile_reel_5", "label": "更适合进阶", "enabled": true, "sort": 5, "clientDisplay": { "show": true } },
          { "id": "compare_profile_reel_6", "label": "差异不大", "enabled": true, "sort": 6, "clientDisplay": { "show": true } }
        ],
        "bait": [
          { "id": "compare_profile_bait_1", "label": "更容易上手", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "compare_profile_bait_2", "label": "搜索更强", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "compare_profile_bait_3", "label": "定点更强", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "compare_profile_bait_4", "label": "低活性更强", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "compare_profile_bait_5", "label": "中鱼效率更高", "enabled": true, "sort": 5, "clientDisplay": { "show": true } },
          { "id": "compare_profile_bait_6", "label": "差异不大", "enabled": true, "sort": 6, "clientDisplay": { "show": true } }
        ],
        "line": [
          { "id": "compare_profile_line_1", "label": "更顺滑", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "compare_profile_line_2", "label": "更耐磨", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "compare_profile_line_3", "label": "强度信心更足", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "compare_profile_line_4", "label": "更适合精细", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "compare_profile_line_5", "label": "更适合重障碍", "enabled": true, "sort": 5, "clientDisplay": { "show": true } },
          { "id": "compare_profile_line_6", "label": "差异不大", "enabled": true, "sort": 6, "clientDisplay": { "show": true } }
        ],
        "hook": [
          { "id": "compare_profile_hook_1", "label": "更容易搭配", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "compare_profile_hook_2", "label": "防挂更好", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "compare_profile_hook_3", "label": "刺穿更稳", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "compare_profile_hook_4", "label": "持鱼更稳", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "compare_profile_hook_5", "label": "强度更高", "enabled": true, "sort": 5, "clientDisplay": { "show": true } },
          { "id": "compare_profile_hook_6", "label": "差异不大", "enabled": true, "sort": 6, "clientDisplay": { "show": true } }
        ],
        "other": [
          { "id": "compare_profile_other_1", "label": "更实用", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "compare_profile_other_2", "label": "更舒适", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "compare_profile_other_3", "label": "防护更好", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "compare_profile_other_4", "label": "收纳更顺手", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "compare_profile_other_5", "label": "更耐用", "enabled": true, "sort": 5, "clientDisplay": { "show": true } },
          { "id": "compare_profile_other_6", "label": "差异不大", "enabled": true, "sort": 6, "clientDisplay": { "show": true } }
        ]
      }
    },
    {
      "groupKey": "purchaseAdvice",
      "label": "入手建议",
      "scope": "categoryAware",
      "inputType": "single",
      "required": false,
      "minSelect": 0,
      "maxSelect": 1,
      "enabled": true,
      "sort": 9,
      "clientDisplay": {
        "showOnPublish": true,
        "showOnDetail": true,
        "showOnCard": true,
        "showOnFilter": true,
        "defaultExpanded": true,
        "collapsible": false,
        "highlight": true
      },
      "categoryOptions": {
        "rod": [
          { "id": "purchase_advice_rod_1", "label": "现在可入", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "purchase_advice_rod_2", "label": "等活动价", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "purchase_advice_rod_3", "label": "二手更香", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "purchase_advice_rod_4", "label": "建议先试投", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "purchase_advice_rod_5", "label": "当前不建议", "enabled": true, "sort": 5, "clientDisplay": { "show": true } }
        ],
        "reel": [
          { "id": "purchase_advice_reel_1", "label": "现在可入", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "purchase_advice_reel_2", "label": "等活动价", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "purchase_advice_reel_3", "label": "二手更香", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "purchase_advice_reel_4", "label": "建议先试轮", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "purchase_advice_reel_5", "label": "当前不建议", "enabled": true, "sort": 5, "clientDisplay": { "show": true } }
        ],
        "bait": [
          { "id": "purchase_advice_bait_1", "label": "建议常备", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "purchase_advice_bait_2", "label": "活动可囤", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "purchase_advice_bait_3", "label": "建议先买试色", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "purchase_advice_bait_4", "label": "建议分水层补齐", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "purchase_advice_bait_5", "label": "当前不建议", "enabled": true, "sort": 5, "clientDisplay": { "show": true } }
        ],
        "line": [
          { "id": "purchase_advice_line_1", "label": "现在可入", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "purchase_advice_line_2", "label": "活动可囤", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "purchase_advice_line_3", "label": "建议先少量试用", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "purchase_advice_line_4", "label": "适合做主线/前导", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "purchase_advice_line_5", "label": "当前不建议", "enabled": true, "sort": 5, "clientDisplay": { "show": true } }
        ],
        "hook": [
          { "id": "purchase_advice_hook_1", "label": "建议常备", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "purchase_advice_hook_2", "label": "建议多规格备齐", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "purchase_advice_hook_3", "label": "建议先少量试用", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "purchase_advice_hook_4", "label": "适合作为主力钩", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "purchase_advice_hook_5", "label": "当前不建议", "enabled": true, "sort": 5, "clientDisplay": { "show": true } }
        ],
        "other": [
          { "id": "purchase_advice_other_1", "label": "现在可入", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "purchase_advice_other_2", "label": "等活动价", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "purchase_advice_other_3", "label": "建议按需求买", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "purchase_advice_other_4", "label": "建议先试穿/试装", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "purchase_advice_other_5", "label": "当前不建议", "enabled": true, "sort": 5, "clientDisplay": { "show": true } }
        ]
      }
    },
    {
      "groupKey": "buyStage",
      "label": "购买定位",
      "scope": "categoryAware",
      "inputType": "multi",
      "required": false,
      "minSelect": 0,
      "maxSelect": 2,
      "enabled": true,
      "sort": 10,
      "clientDisplay": {
        "showOnPublish": true,
        "showOnDetail": true,
        "showOnCard": false,
        "showOnFilter": true,
        "defaultExpanded": true,
        "collapsible": true,
        "highlight": false
      },
      "categoryOptions": {
        "rod": [
          { "id": "buy_stage_rod_1", "label": "第一套主力", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "buy_stage_rod_2", "label": "第二套升级", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "buy_stage_rod_3", "label": "细分玩法补位", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "buy_stage_rod_4", "label": "替换老装备", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "buy_stage_rod_5", "label": "比赛/高频主力", "enabled": true, "sort": 5, "clientDisplay": { "show": true } }
        ],
        "reel": [
          { "id": "buy_stage_reel_1", "label": "第一颗主力轮", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "buy_stage_reel_2", "label": "第二颗升级轮", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "buy_stage_reel_3", "label": "细分搭配补位", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "buy_stage_reel_4", "label": "替换老装备", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "buy_stage_reel_5", "label": "比赛/高频主力", "enabled": true, "sort": 5, "clientDisplay": { "show": true } }
        ],
        "bait": [
          { "id": "buy_stage_bait_1", "label": "基础常备", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "buy_stage_bait_2", "label": "覆盖水层", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "buy_stage_bait_3", "label": "补齐颜色", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "buy_stage_bait_4", "label": "特定鱼情备用", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "buy_stage_bait_5", "label": "比赛备用", "enabled": true, "sort": 5, "clientDisplay": { "show": true } }
        ],
        "line": [
          { "id": "buy_stage_line_1", "label": "第一盘主线", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "buy_stage_line_2", "label": "常规补货", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "buy_stage_line_3", "label": "特定线号", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "buy_stage_line_4", "label": "高频替换", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "buy_stage_line_5", "label": "近海备用", "enabled": true, "sort": 5, "clientDisplay": { "show": true } }
        ],
        "hook": [
          { "id": "buy_stage_hook_1", "label": "基础常备", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "buy_stage_hook_2", "label": "扩充钓组", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "buy_stage_hook_3", "label": "消耗囤货", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "buy_stage_hook_4", "label": "平替", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "buy_stage_hook_5", "label": "高强度备用", "enabled": true, "sort": 5, "clientDisplay": { "show": true } }
        ],
        "other": [
          { "id": "buy_stage_other_1", "label": "日常常备", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "buy_stage_other_2", "label": "高频出钓", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "buy_stage_other_3", "label": "旅行专用", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "buy_stage_other_4", "label": "专项防护", "enabled": true, "sort": 4, "clientDisplay": { "show": true } },
          { "id": "buy_stage_other_5", "label": "收纳备选", "enabled": true, "sort": 5, "clientDisplay": { "show": true } }
        ]
      }
    },
    {
      "groupKey": "compareBuyDecision",
      "label": "对比购买结论",
      "scope": "categoryAware",
      "inputType": "single",
      "required": false,
      "minSelect": 0,
      "maxSelect": 1,
      "enabled": true,
      "sort": 8,
      "clientDisplay": {
        "showOnPublish": true,
        "showOnDetail": true,
        "showOnCard": false,
        "showOnFilter": true,
        "defaultExpanded": true,
        "collapsible": true,
        "highlight": true
      },
      "categoryOptions": {
        "rod": [
          { "id": "compare_buy_decision_rod_1", "label": "当前这款更值得买", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "compare_buy_decision_rod_2", "label": "对比款更值得买", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "compare_buy_decision_rod_3", "label": "看预算选", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "compare_buy_decision_rod_4", "label": "看场景选", "enabled": true, "sort": 4, "clientDisplay": { "show": true } }
        ],
        "reel": [
          { "id": "compare_buy_decision_reel_1", "label": "当前这款更值得买", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "compare_buy_decision_reel_2", "label": "对比款更值得买", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "compare_buy_decision_reel_3", "label": "看预算选", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "compare_buy_decision_reel_4", "label": "看搭配选", "enabled": true, "sort": 4, "clientDisplay": { "show": true } }
        ],
        "bait": [
          { "id": "compare_buy_decision_bait_1", "label": "当前这款更值得买", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "compare_buy_decision_bait_2", "label": "对比款更值得买", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "compare_buy_decision_bait_3", "label": "建议都备", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "compare_buy_decision_bait_4", "label": "看鱼情选", "enabled": true, "sort": 4, "clientDisplay": { "show": true } }
        ],
        "line": [
          { "id": "compare_buy_decision_line_1", "label": "当前这款更值得买", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "compare_buy_decision_line_2", "label": "对比款更值得买", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "compare_buy_decision_line_3", "label": "看线号选", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "compare_buy_decision_line_4", "label": "看场景选", "enabled": true, "sort": 4, "clientDisplay": { "show": true } }
        ],
        "hook": [
          { "id": "compare_buy_decision_hook_1", "label": "当前这款更值得买", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "compare_buy_decision_hook_2", "label": "对比款更值得买", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "compare_buy_decision_hook_3", "label": "看钓组选", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "compare_buy_decision_hook_4", "label": "建议都备", "enabled": true, "sort": 4, "clientDisplay": { "show": true } }
        ],
        "other": [
          { "id": "compare_buy_decision_other_1", "label": "当前这款更值得买", "enabled": true, "sort": 1, "clientDisplay": { "show": true } },
          { "id": "compare_buy_decision_other_2", "label": "对比款更值得买", "enabled": true, "sort": 2, "clientDisplay": { "show": true } },
          { "id": "compare_buy_decision_other_3", "label": "看用途选", "enabled": true, "sort": 3, "clientDisplay": { "show": true } },
          { "id": "compare_buy_decision_other_4", "label": "差异不大", "enabled": true, "sort": 4, "clientDisplay": { "show": true } }
        ]
      }
    }
  ],
  "categoryGroups": {
    "rod": [
      {
        "groupKey": "scene",
        "label": "使用场景",
        "scope": "rod",
        "inputType": "multi",
        "required": true,
        "minSelect": 1,
        "maxSelect": 5,
        "enabled": true,
        "sort": 1,
        "clientDisplay": {
          "showOnPublish": true,
          "showOnDetail": true,
          "showOnCard": true,
          "showOnFilter": true,
          "defaultExpanded": true,
          "collapsible": true,
          "highlight": false
        },
        "options": [
          {
            "id": "rod_scene_stream",
            "label": "溪流",
            "enabled": true,
            "sort": 1,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "rod_scene_managed_fishery",
            "label": "管理场/黑坑",
            "enabled": true,
            "sort": 2,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "rod_scene_river",
            "label": "江河/湖库",
            "enabled": true,
            "sort": 3,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "rod_scene_reservoir",
            "label": "水库",
            "enabled": true,
            "sort": 4,
            "clientDisplay": {
              "show":false
            }
          },
          {
            "id": "rod_scene_offshore",
            "label": "近海",
            "enabled": true,
            "sort": 5,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "rod_scene_shore_cast",
            "label": "岸投",
            "enabled": true,
            "sort": 6,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "rod_scene_boat",
            "label": "船钓",
            "enabled": true,
            "sort": 7,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "rod_scene_general",
            "label": "泛用",
            "enabled": true,
            "sort": 8,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "rod_scene_precise",
            "label": "精细作钓",
            "enabled": true,
            "sort": 9,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "rod_scene_heavy_obstacle",
            "label": "重障碍区",
            "enabled": true,
            "sort": 10,
            "clientDisplay": {
              "show": true
            }
          }
        ]
      },
      {
        "groupKey": "pros",
        "label": "鱼竿优点",
        "scope": "rod",
        "inputType": "multi",
        "required": true,
        "minSelect": 1,
        "maxSelect": 3,
        "enabled": true,
        "sort": 10,
        "clientDisplay": {
          "showOnPublish": true,
          "showOnDetail": true,
          "showOnCard": true,
          "showOnFilter": true,
          "defaultExpanded": true,
          "collapsible": true,
          "highlight": false
        },
        "options": [
          {
            "id": "rod_pro_sensitivity_clear",
            "label": "传导清晰",
            "enabled": true,
            "sort": 1,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "rod_pro_casting_easy",
            "label": "抛投轻松",
            "enabled": true,
            "sort": 2,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "rod_pro_powerful_backbone",
            "label": "腰力充足",
            "enabled": true,
            "sort": 3,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "rod_pro_control_stable",
            "label": "控饵稳定",
            "enabled": true,
            "sort": 4,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "rod_pro_lightweight",
            "label": "轻量不累",
            "enabled": true,
            "sort": 5,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "rod_pro_balance_good",
            "label": "平衡感好",
            "enabled": true,
            "sort": 6,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "rod_pro_workmanship_good",
            "label": "做工扎实",
            "enabled": true,
            "sort": 7,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "rod_pro_general_use",
            "label": "泛用性强",
            "enabled": true,
            "sort": 8,
            "clientDisplay": {
              "show": true
            }
          }
        ]
      },
      {
        "groupKey": "cons",
        "label": "鱼竿缺点",
        "scope": "rod",
        "inputType": "multi",
        "required": true,
        "minSelect": 1,
        "maxSelect": 2,
        "enabled": true,
        "sort": 11,
        "clientDisplay": {
          "showOnPublish": true,
          "showOnDetail": true,
          "showOnCard": true,
          "showOnFilter": false,
          "defaultExpanded": true,
          "collapsible": true,
          "highlight": false
        },
        "options": [
          {
            "id": "rod_con_heavy",
            "label": "偏重",
            "enabled": true,
            "sort": 1,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "rod_con_head_heavy",
            "label": "头重明显",
            "enabled": true,
            "sort": 2,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "rod_con_sensitivity_normal",
            "label": "传导一般",
            "enabled": true,
            "sort": 3,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "rod_con_backbone_weak",
            "label": "腰力不足",
            "enabled": true,
            "sort": 4,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "rod_con_casting_normal",
            "label": "抛投一般",
            "enabled": true,
            "sort": 5,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "rod_con_control_normal",
            "label": "控饵一般",
            "enabled": true,
            "sort": 6,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "rod_con_workmanship_normal",
            "label": "做工一般",
            "enabled": true,
            "sort": 7,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "rod_con_price_high",
            "label": "价格偏高",
            "enabled": true,
            "sort": 8,
            "clientDisplay": {
              "show": true
            }
          }
        ]
      }
    ],
    "reel": [
      {
        "groupKey": "scene",
        "label": "使用场景",
        "scope": "reel",
        "inputType": "multi",
        "required": true,
        "minSelect": 1,
        "maxSelect": 5,
        "enabled": true,
        "sort": 1,
        "clientDisplay": {
          "showOnPublish": true,
          "showOnDetail": true,
          "showOnCard": true,
          "showOnFilter": true,
          "defaultExpanded": true,
          "collapsible": true,
          "highlight": false
        },
        "options": [
          {
            "id": "reel_scene_freshwater_general",
            "label": "淡水泛用",
            "enabled": true,
            "sort": 1,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "reel_scene_long_cast",
            "label": "远投",
            "enabled": true,
            "sort": 2,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "reel_scene_precise",
            "label": "精细作钓",
            "enabled": true,
            "sort": 3,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "reel_scene_heavy_obstacle",
            "label": "重障碍",
            "enabled": true,
            "sort": 4,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "reel_scene_high_frequency_search",
            "label": "高频搜索",
            "enabled": true,
            "sort": 5,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "reel_scene_boat",
            "label": "船钓",
            "enabled": true,
            "sort": 6,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "reel_scene_offshore_light",
            "label": "近海轻作钓",
            "enabled": true,
            "sort": 7,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "reel_scene_managed_fishery",
            "label": "管理场/黑坑",
            "enabled": true,
            "sort": 8,
            "clientDisplay": {
              "show": true
            }
          }
        ]
      },
      {
        "groupKey": "pros",
        "label": "渔轮优点",
        "scope": "reel",
        "inputType": "multi",
        "required": true,
        "minSelect": 1,
        "maxSelect": 3,
        "enabled": true,
        "sort": 10,
        "clientDisplay": {
          "showOnPublish": true,
          "showOnDetail": true,
          "showOnCard": true,
          "showOnFilter": true,
          "defaultExpanded": true,
          "collapsible": true,
          "highlight": false
        },
        "options": [
          {
            "id": "reel_pro_smooth",
            "label": "顺滑度高",
            "enabled": true,
            "sort": 1,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "reel_pro_retrieve_comfort",
            "label": "收线舒服",
            "enabled": true,
            "sort": 2,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "reel_pro_drag_stable",
            "label": "卸力稳定",
            "enabled": true,
            "sort": 3,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "reel_pro_casting_smooth",
            "label": "抛投顺畅",
            "enabled": true,
            "sort": 4,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "reel_pro_high_tolerance",
            "label": "容错率高",
            "enabled": true,
            "sort": 5,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "reel_pro_lightweight",
            "label": "轻量趁手",
            "enabled": true,
            "sort": 6,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "reel_pro_workmanship_good",
            "label": "做工精细",
            "enabled": true,
            "sort": 7,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "reel_pro_durable",
            "label": "耐用可靠",
            "enabled": true,
            "sort": 8,
            "clientDisplay": {
              "show": true
            }
          }
        ]
      },
      {
        "groupKey": "cons",
        "label": "渔轮缺点",
        "scope": "reel",
        "inputType": "multi",
        "required": true,
        "minSelect": 1,
        "maxSelect": 2,
        "enabled": true,
        "sort": 11,
        "clientDisplay": {
          "showOnPublish": true,
          "showOnDetail": true,
          "showOnCard": true,
          "showOnFilter": false,
          "defaultExpanded": true,
          "collapsible": true,
          "highlight": false
        },
        "options": [
          {
            "id": "reel_con_heavy",
            "label": "偏重",
            "enabled": true,
            "sort": 1,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "reel_con_smooth_decline",
            "label": "顺滑衰减快",
            "enabled": true,
            "sort": 2,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "reel_con_drag_normal",
            "label": "卸力一般",
            "enabled": true,
            "sort": 3,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "reel_con_backlash_easy",
            "label": "容易炸线",
            "enabled": true,
            "sort": 4,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "reel_con_casting_normal",
            "label": "抛投一般",
            "enabled": true,
            "sort": 5,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "reel_con_noise_obvious",
            "label": "噪音明显",
            "enabled": true,
            "sort": 6,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "reel_con_maintenance_hard",
            "label": "维护麻烦",
            "enabled": true,
            "sort": 7,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "reel_con_price_high",
            "label": "价格偏高",
            "enabled": true,
            "sort": 8,
            "clientDisplay": {
              "show": true
            }
          }
        ]
      }
    ],
    "bait": [
      {
        "groupKey": "scene",
        "label": "使用场景",
        "scope": "bait",
        "inputType": "multi",
        "required": true,
        "minSelect": 1,
        "maxSelect": 5,
        "enabled": true,
        "sort": 1,
        "clientDisplay": {
          "showOnPublish": true,
          "showOnDetail": true,
          "showOnCard": true,
          "showOnFilter": true,
          "defaultExpanded": true,
          "collapsible": true,
          "highlight": false
        },
        "options": [
          {
            "id": "bait_scene_surface",
            "label": "表层",
            "enabled": true,
            "sort": 1,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "bait_scene_middle",
            "label": "中层",
            "enabled": true,
            "sort": 2,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "bait_scene_bottom",
            "label": "底层",
            "enabled": true,
            "sort": 3,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "bait_scene_search",
            "label": "搜索鱼情",
            "enabled": true,
            "sort": 4,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "bait_scene_fixed_point",
            "label": "定点作钓",
            "enabled": true,
            "sort": 5,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "bait_scene_obstacle_edge",
            "label": "障碍区边缘",
            "enabled": true,
            "sort": 6,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "bait_scene_open_water",
            "label": "开阔水面",
            "enabled": true,
            "sort": 7,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "bait_scene_stream",
            "label": "溪流",
            "enabled": true,
            "sort": 8,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "bait_scene_river",
            "label": "江河/湖库",
            "enabled": true,
            "sort": 9,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "bait_scene_reservoir",
            "label": "水库",
            "enabled": true,
            "sort": 10,
            "clientDisplay": {
              "show": false
            }
          },
          {
            "id": "bait_scene_offshore",
            "label": "近海",
            "enabled": true,
            "sort": 11,
            "clientDisplay": {
              "show": true
            }
          }
        ]
      },
      {
        "groupKey": "pros",
        "label": "鱼饵优点",
        "scope": "bait",
        "inputType": "multi",
        "required": true,
        "minSelect": 1,
        "maxSelect": 3,
        "enabled": true,
        "sort": 10,
        "clientDisplay": {
          "showOnPublish": true,
          "showOnDetail": true,
          "showOnCard": true,
          "showOnFilter": true,
          "defaultExpanded": true,
          "collapsible": true,
          "highlight": false
        },
        "options": [
          {
            "id": "bait_pro_fast_start",
            "label": "启动快",
            "enabled": true,
            "sort": 1,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "bait_pro_action_natural",
            "label": "动作自然",
            "enabled": true,
            "sort": 2,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "bait_pro_stable",
            "label": "稳定性好",
            "enabled": true,
            "sort": 3,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "bait_pro_attractive",
            "label": "诱鱼明显",
            "enabled": true,
            "sort": 4,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "bait_pro_searching_good",
            "label": "搜索效率高",
            "enabled": true,
            "sort": 5,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "bait_pro_casting_easy",
            "label": "抛投舒服",
            "enabled": true,
            "sort": 6,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "bait_pro_high_tolerance",
            "label": "容错率高",
            "enabled": true,
            "sort": 7,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "bait_pro_workmanship_good",
            "label": "做工精细",
            "enabled": true,
            "sort": 8,
            "clientDisplay": {
              "show": true
            }
          }
        ]
      },
      {
        "groupKey": "cons",
        "label": "鱼饵缺点",
        "scope": "bait",
        "inputType": "multi",
        "required": true,
        "minSelect": 1,
        "maxSelect": 2,
        "enabled": true,
        "sort": 11,
        "clientDisplay": {
          "showOnPublish": true,
          "showOnDetail": true,
          "showOnCard": true,
          "showOnFilter": false,
          "defaultExpanded": true,
          "collapsible": true,
          "highlight": false
        },
        "options": [
          {
            "id": "bait_con_start_slow",
            "label": "启动慢",
            "enabled": true,
            "sort": 1,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "bait_con_action_single",
            "label": "动作单一",
            "enabled": true,
            "sort": 2,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "bait_con_run_off",
            "label": "容易跑偏",
            "enabled": true,
            "sort": 3,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "bait_con_attraction_normal",
            "label": "诱鱼一般",
            "enabled": true,
            "sort": 4,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "bait_con_snag_easy",
            "label": "容易挂底",
            "enabled": true,
            "sort": 5,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "bait_con_casting_normal",
            "label": "抛投一般",
            "enabled": true,
            "sort": 6,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "bait_con_bite_weak",
            "label": "耐咬较差",
            "enabled": true,
            "sort": 7,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "bait_con_threshold_high",
            "label": "使用门槛高",
            "enabled": true,
            "sort": 8,
            "clientDisplay": {
              "show": true
            }
          }
        ]
      }
    ],
    "line": [
      {
        "groupKey": "scene",
        "label": "使用场景",
        "scope": "line",
        "inputType": "multi",
        "required": true,
        "minSelect": 1,
        "maxSelect": 5,
        "enabled": true,
        "sort": 1,
        "clientDisplay": {
          "showOnPublish": true,
          "showOnDetail": true,
          "showOnCard": true,
          "showOnFilter": true,
          "defaultExpanded": true,
          "collapsible": true,
          "highlight": false
        },
        "options": [
          {
            "id": "line_scene_freshwater_general",
            "label": "淡水泛用",
            "enabled": true,
            "sort": 1,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "line_scene_precise",
            "label": "精细作钓",
            "enabled": true,
            "sort": 2,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "line_scene_long_cast",
            "label": "远投",
            "enabled": true,
            "sort": 3,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "line_scene_obstacle",
            "label": "障碍区",
            "enabled": true,
            "sort": 4,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "line_scene_stream",
            "label": "溪流",
            "enabled": true,
            "sort": 5,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "line_scene_river",
            "label": "江河/湖库",
            "enabled": true,
            "sort": 6,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "line_scene_reservoir",
            "label": "水库",
            "enabled": true,
            "sort": 7,
            "clientDisplay": {
              "show": false
            }
          },
          {
            "id": "line_scene_offshore_light",
            "label": "近海轻作钓",
            "enabled": true,
            "sort": 8,
            "clientDisplay": {
              "show": true
            }
          }
        ]
      },
      {
        "groupKey": "pros",
        "label": "鱼线优点",
        "scope": "line",
        "inputType": "multi",
        "required": true,
        "minSelect": 1,
        "maxSelect": 3,
        "enabled": true,
        "sort": 10,
        "clientDisplay": {
          "showOnPublish": true,
          "showOnDetail": true,
          "showOnCard": true,
          "showOnFilter": true,
          "defaultExpanded": true,
          "collapsible": true,
          "highlight": false
        },
        "options": [
          {
            "id": "line_pro_strength_stable",
            "label": "强度稳定",
            "enabled": true,
            "sort": 1,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "line_pro_abrasion_good",
            "label": "耐磨可靠",
            "enabled": true,
            "sort": 2,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "line_pro_smooth_out",
            "label": "顺滑出线",
            "enabled": true,
            "sort": 3,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "line_pro_casting_easy",
            "label": "抛投舒服",
            "enabled": true,
            "sort": 4,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "line_pro_knot_stable",
            "label": "结节稳定",
            "enabled": true,
            "sort": 5,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "line_pro_sensitive",
            "label": "灵敏度高",
            "enabled": true,
            "sort": 6,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "line_pro_decay_slow",
            "label": "衰减较慢",
            "enabled": true,
            "sort": 7,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "line_pro_value_good",
            "label": "性价比高",
            "enabled": true,
            "sort": 8,
            "clientDisplay": {
              "show": true
            }
          }
        ]
      },
      {
        "groupKey": "cons",
        "label": "鱼线缺点",
        "scope": "line",
        "inputType": "multi",
        "required": true,
        "minSelect": 1,
        "maxSelect": 2,
        "enabled": true,
        "sort": 11,
        "clientDisplay": {
          "showOnPublish": true,
          "showOnDetail": true,
          "showOnCard": true,
          "showOnFilter": false,
          "defaultExpanded": true,
          "collapsible": true,
          "highlight": false
        },
        "options": [
          {
            "id": "line_con_fuzz_easy",
            "label": "容易起毛",
            "enabled": true,
            "sort": 1,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "line_con_abrasion_normal",
            "label": "耐磨一般",
            "enabled": true,
            "sort": 2,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "line_con_out_normal",
            "label": "出线一般",
            "enabled": true,
            "sort": 3,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "line_con_casting_loss",
            "label": "抛投损失明显",
            "enabled": true,
            "sort": 4,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "line_con_tangle_easy",
            "label": "容易打结",
            "enabled": true,
            "sort": 5,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "line_con_knot_normal",
            "label": "结节一般",
            "enabled": true,
            "sort": 6,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "line_con_decay_fast",
            "label": "衰减较快",
            "enabled": true,
            "sort": 7,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "line_con_price_high",
            "label": "价格偏高",
            "enabled": true,
            "sort": 8,
            "clientDisplay": {
              "show": true
            }
          }
        ]
      }
    ],
    "hook": [
      {
        "groupKey": "scene",
        "label": "使用场合",
        "scope": "hook",
        "inputType": "multi",
        "required": true,
        "minSelect": 1,
        "maxSelect": 5,
        "enabled": true,
        "sort": 1,
        "clientDisplay": {
          "showOnPublish": true,
          "showOnDetail": true,
          "showOnCard": true,
          "showOnFilter": true,
          "defaultExpanded": true,
          "collapsible": true,
          "highlight": false
        },
        "options": [
          {
            "id": "hook_scene_heavy_obstacle",
            "label": "重障碍区",
            "enabled": true,
            "sort": 1,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "hook_scene_precise",
            "label": "精细作钓",
            "enabled": true,
            "sort": 2,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "hook_scene_black_pit",
            "label": "黑坑",
            "enabled": true,
            "sort": 3,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "hook_scene_competition",
            "label": "竞技",
            "enabled": true,
            "sort": 4,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "hook_scene_stream",
            "label": "溪流",
            "enabled": true,
            "sort": 5,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "hook_scene_offshore_light",
            "label": "近海轻作钓",
            "enabled": true,
            "sort": 6,
            "clientDisplay": {
              "show": true
            }
          }
        ]
      },
      {
        "groupKey": "pros",
        "label": "钩子优点",
        "scope": "hook",
        "inputType": "multi",
        "required": true,
        "minSelect": 1,
        "maxSelect": 3,
        "enabled": true,
        "sort": 10,
        "clientDisplay": {
          "showOnPublish": true,
          "showOnDetail": true,
          "showOnCard": true,
          "showOnFilter": true,
          "defaultExpanded": true,
          "collapsible": true,
          "highlight": false
        },
        "options": [
          {
            "id": "hook_pro_sharp_fast",
            "label": "锋利扎口快",
            "enabled": true,
            "sort": 1,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "hook_pro_penetration_stable",
            "label": "刺鱼稳定",
            "enabled": true,
            "sort": 2,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "hook_pro_deform_resist",
            "label": "抗变形好",
            "enabled": true,
            "sort": 3,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "hook_pro_anti_rust_good",
            "label": "防锈靠谱",
            "enabled": true,
            "sort": 4,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "hook_pro_hold_bait_good",
            "label": "挂饵牢靠",
            "enabled": true,
            "sort": 5,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "hook_pro_workmanship_good",
            "label": "做工扎实",
            "enabled": true,
            "sort": 6,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "hook_pro_fit_wide",
            "label": "适配性强",
            "enabled": true,
            "sort": 7,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "hook_pro_value_good",
            "label": "性价比高",
            "enabled": true,
            "sort": 8,
            "clientDisplay": {
              "show": true
            }
          }
        ]
      },
      {
        "groupKey": "cons",
        "label": "钩子缺点",
        "scope": "hook",
        "inputType": "multi",
        "required": true,
        "minSelect": 1,
        "maxSelect": 2,
        "enabled": true,
        "sort": 11,
        "clientDisplay": {
          "showOnPublish": true,
          "showOnDetail": true,
          "showOnCard": true,
          "showOnFilter": false,
          "defaultExpanded": true,
          "collapsible": true,
          "highlight": false
        },
        "options": [
          {
            "id": "hook_con_sharp_decline",
            "label": "锋利衰减快",
            "enabled": true,
            "sort": 1,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "hook_con_penetration_normal",
            "label": "刺鱼一般",
            "enabled": true,
            "sort": 2,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "hook_con_deform_easy",
            "label": "容易变形",
            "enabled": true,
            "sort": 3,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "hook_con_rust_easy",
            "label": "容易生锈",
            "enabled": true,
            "sort": 4,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "hook_con_hold_bait_weak",
            "label": "挂饵不稳",
            "enabled": true,
            "sort": 5,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "hook_con_workmanship_normal",
            "label": "做工一般",
            "enabled": true,
            "sort": 6,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "hook_con_fit_normal",
            "label": "适配性一般",
            "enabled": true,
            "sort": 7,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "hook_con_price_high",
            "label": "价格偏高",
            "enabled": true,
            "sort": 8,
            "clientDisplay": {
              "show": true
            }
          }
        ]
      }
    ],
    "other": [
      {
        "groupKey": "scene",
        "label": "使用场景",
        "scope": "other",
        "inputType": "multi",
        "required": true,
        "minSelect": 1,
        "maxSelect": 5,
        "enabled": true,
        "sort": 1,
        "clientDisplay": {
          "showOnPublish": true,
          "showOnDetail": true,
          "showOnCard": true,
          "showOnFilter": true,
          "defaultExpanded": true,
          "collapsible": true,
          "highlight": false
        },
        "options": [
          {
            "id": "other_scene_high_uv",
            "label": "高紫外线",
            "enabled": true,
            "sort": 1,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_scene_long_time",
            "label": "长时间作钓",
            "enabled": true,
            "sort": 2,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_scene_spring",
            "label": "春季",
            "enabled": true,
            "sort": 3,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_scene_summer",
            "label": "夏季",
            "enabled": true,
            "sort": 4,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_scene_autumn",
            "label": "秋季",
            "enabled": true,
            "sort": 5,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_scene_winter",
            "label": "冬季",
            "enabled": true,
            "sort": 6,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_scene_boat",
            "label": "船钓",
            "enabled": true,
            "sort": 7,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_scene_multi_rod",
            "label": "多竿作钓",
            "enabled": true,
            "sort": 8,
            "clientDisplay": {
              "show": true
            }
          }
        ]
      },
      {
        "groupKey": "otherSubType",
        "label": "其他分类",
        "scope": "other",
        "inputType": "single",
        "required": true,
        "minSelect": 1,
        "maxSelect": 1,
        "enabled": true,
        "sort": 9,
        "clientDisplay": {
          "showOnPublish": true,
          "showOnDetail": true,
          "showOnCard": true,
          "showOnFilter": true,
          "defaultExpanded": true,
          "collapsible": false,
          "highlight": true
        },
        "options": [
          {
            "id": "other_sub_clothing",
            "label": "服饰",
            "enabled": true,
            "sort": 1,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_sub_sun_protection",
            "label": "防晒",
            "enabled": true,
            "sort": 2,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_sub_gloves",
            "label": "手套",
            "enabled": true,
            "sort": 3,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_sub_support",
            "label": "支架/置物",
            "enabled": true,
            "sort": 4,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_sub_storage",
            "label": "收纳/背包",
            "enabled": true,
            "sort": 5,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_sub_tools",
            "label": "工具/配件",
            "enabled": true,
            "sort": 6,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_sub_misc",
            "label": "其他杂项",
            "enabled": true,
            "sort": 7,
            "clientDisplay": {
              "show": true
            }
          }
        ]
      },
      {
        "groupKey": "pros",
        "label": "其他优点",
        "scope": "other",
        "inputType": "multi",
        "required": true,
        "minSelect": 1,
        "maxSelect": 3,
        "enabled": true,
        "sort": 10,
        "clientDisplay": {
          "showOnPublish": true,
          "showOnDetail": true,
          "showOnCard": true,
          "showOnFilter": true,
          "defaultExpanded": true,
          "collapsible": true,
          "highlight": false
        },
        "options": [
          {
            "id": "other_pro_practical",
            "label": "实用性强",
            "enabled": true,
            "sort": 1,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_pro_comfortable",
            "label": "佩戴舒适",
            "enabled": true,
            "sort": 2,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_pro_protection_good",
            "label": "防护到位",
            "enabled": true,
            "sort": 3,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_pro_storage_easy",
            "label": "收纳方便",
            "enabled": true,
            "sort": 4,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_pro_stable",
            "label": "固定稳定",
            "enabled": true,
            "sort": 5,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_pro_portable",
            "label": "轻便易带",
            "enabled": true,
            "sort": 6,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_pro_detail_good",
            "label": "细节贴心",
            "enabled": true,
            "sort": 7,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_pro_workmanship_good",
            "label": "做工扎实",
            "enabled": true,
            "sort": 8,
            "clientDisplay": {
              "show": true
            }
          }
        ]
      },
      {
        "groupKey": "cons",
        "label": "其他缺点",
        "scope": "other",
        "inputType": "multi",
        "required": true,
        "minSelect": 1,
        "maxSelect": 2,
        "enabled": true,
        "sort": 11,
        "clientDisplay": {
          "showOnPublish": true,
          "showOnDetail": true,
          "showOnCard": true,
          "showOnFilter": false,
          "defaultExpanded": true,
          "collapsible": true,
          "highlight": false
        },
        "options": [
          {
            "id": "other_con_practical_normal",
            "label": "实用性一般",
            "enabled": true,
            "sort": 1,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_con_uncomfortable",
            "label": "佩戴不适",
            "enabled": true,
            "sort": 2,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_con_protection_normal",
            "label": "防护一般",
            "enabled": true,
            "sort": 3,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_con_storage_bad",
            "label": "收纳不便",
            "enabled": true,
            "sort": 4,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_con_stability_normal",
            "label": "稳定性一般",
            "enabled": true,
            "sort": 5,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_con_bulky",
            "label": "占地方",
            "enabled": true,
            "sort": 6,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_con_workmanship_normal",
            "label": "做工一般",
            "enabled": true,
            "sort": 7,
            "clientDisplay": {
              "show": true
            }
          },
          {
            "id": "other_con_price_high",
            "label": "价格偏高",
            "enabled": true,
            "sort": 8,
            "clientDisplay": {
              "show": true
            }
          }
        ]
      }
    ]
  }
};
