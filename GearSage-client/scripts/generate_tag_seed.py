import json
import sys
from pathlib import Path


DEFAULT_SOURCE = Path(r"C:/Users/admin/Desktop/database_export-FV1JHFAiqOdo.json")
DEFAULT_OUTPUT_DIR = Path(r"D:/Xiaochengxu/Diaoyoushuo/data/tag_seed")


TAG_CONFIG = {
    "钓鱼人": {
        "code": "identity_angler",
        "type": "identity",
        "sub_type": "general",
        "style_key": "identity_slate",
        "icon_key": "fish",
        "source_type": "shop",
        "display_priority": 42,
        "credibility_weight": 0,
        "scene_scope": [],
        "goods_image": "/images/icons/h28.png",
        "stock": 9999,
    },
    "围观群众": {
        "code": "fun_onlooker",
        "type": "fun",
        "sub_type": "social",
        "style_key": "fun_slate",
        "icon_key": "spark",
        "source_type": "shop",
        "display_priority": 26,
        "credibility_weight": 0,
        "scene_scope": [],
        "goods_image": "/images/icons/h28.png",
        "stock": 9999,
    },
    "想买鱼竿": {
        "code": "identity_want_rod",
        "type": "identity",
        "sub_type": "gear",
        "style_key": "identity_slate",
        "icon_key": "rod",
        "source_type": "shop",
        "display_priority": 36,
        "credibility_weight": 0,
        "scene_scope": ["recommend", "question"],
        "goods_image": "/images/icons/h28.png",
        "stock": 9999,
    },
    "想买渔轮": {
        "code": "identity_want_reel",
        "type": "identity",
        "sub_type": "gear",
        "style_key": "identity_slate",
        "icon_key": "reel",
        "source_type": "shop",
        "display_priority": 36,
        "credibility_weight": 0,
        "scene_scope": ["recommend", "question"],
        "goods_image": "/images/icons/h28.png",
        "stock": 9999,
    },
    "你的钓友": {
        "code": "fun_fishing_buddy",
        "type": "fun",
        "sub_type": "social",
        "style_key": "fun_slate",
        "icon_key": "wave",
        "source_type": "shop",
        "display_priority": 28,
        "credibility_weight": 0,
        "scene_scope": [],
        "goods_image": "/images/icons/h28.png",
        "stock": 9999,
    },
    "装备刚配齐": {
        "code": "identity_gear_ready",
        "type": "identity",
        "sub_type": "style",
        "style_key": "identity_blue",
        "icon_key": "gear",
        "source_type": "shop",
        "display_priority": 48,
        "credibility_weight": 0,
        "scene_scope": ["recommend", "question"],
        "goods_image": "/images/icons/h28.png",
        "stock": 9999,
    },
    "风雨无阻": {
        "code": "identity_all_weather",
        "type": "identity",
        "sub_type": "style",
        "style_key": "identity_blue",
        "icon_key": "storm",
        "source_type": "shop",
        "display_priority": 50,
        "credibility_weight": 1,
        "scene_scope": ["trip", "experience"],
        "goods_image": "/images/icons/h28.png",
        "stock": 9999,
    },
    "不会绑前导": {
        "code": "fun_cant_tie_leader",
        "type": "fun",
        "sub_type": "meme",
        "style_key": "fun_blue",
        "icon_key": "hook",
        "source_type": "shop",
        "display_priority": 38,
        "credibility_weight": 0,
        "scene_scope": ["question", "catch"],
        "goods_image": "/images/icons/h28.png",
        "stock": 9999,
    },
    "差点打龟": {
        "code": "fun_almost_skunk",
        "type": "fun",
        "sub_type": "meme",
        "style_key": "fun_blue",
        "icon_key": "splash",
        "source_type": "shop",
        "display_priority": 40,
        "credibility_weight": 0,
        "scene_scope": ["catch", "trip"],
        "goods_image": "/images/icons/h28.png",
        "stock": 9999,
    },
    "空钩上鱼": {
        "code": "fun_empty_hook",
        "type": "fun",
        "sub_type": "meme",
        "style_key": "fun_blue",
        "icon_key": "hook",
        "source_type": "shop",
        "display_priority": 39,
        "credibility_weight": 0,
        "scene_scope": ["catch", "trip"],
        "goods_image": "/images/icons/h28.png",
        "stock": 9999,
    },
    "拍大腿": {
        "code": "fun_pat_leg",
        "type": "fun",
        "sub_type": "meme",
        "style_key": "fun_orange",
        "icon_key": "spark",
        "source_type": "shop",
        "display_priority": 52,
        "credibility_weight": 0,
        "scene_scope": ["recommend", "question"],
        "goods_image": "/images/icons/h31.png",
        "stock": 300,
    },
    "跑过毒": {
        "code": "fun_poisoned",
        "type": "fun",
        "sub_type": "meme",
        "style_key": "fun_orange",
        "icon_key": "bolt",
        "source_type": "shop",
        "display_priority": 54,
        "credibility_weight": 0,
        "scene_scope": ["recommend", "experience"],
        "goods_image": "/images/icons/h31.png",
        "stock": 300,
    },
    "不吃鱼": {
        "code": "fun_no_fish_eater",
        "type": "fun",
        "sub_type": "meme",
        "style_key": "fun_orange",
        "icon_key": "leaf",
        "source_type": "shop",
        "display_priority": 50,
        "credibility_weight": 0,
        "scene_scope": ["catch", "trip"],
        "goods_image": "/images/icons/h31.png",
        "stock": 300,
    },
    "打火机": {
        "code": "fun_lighter",
        "type": "fun",
        "sub_type": "meme",
        "style_key": "fun_orange",
        "icon_key": "fire",
        "source_type": "shop",
        "display_priority": 51,
        "credibility_weight": 0,
        "scene_scope": ["catch", "trip"],
        "goods_image": "/images/icons/h31.png",
        "stock": 300,
    },
    "开服元老": {
        "code": "event_founder",
        "type": "event",
        "sub_type": "founder",
        "style_key": "official_gold",
        "icon_key": "crown",
        "source_type": "event",
        "display_priority": 92,
        "credibility_weight": 1,
        "scene_scope": [],
        "goods_image": "/images/icons/h33.png",
        "stock": 50,
        "is_limited": True,
    },
    "最大单尾": {
        "code": "event_biggest_single",
        "type": "event",
        "sub_type": "record",
        "style_key": "behavior_gold",
        "icon_key": "trophy",
        "source_type": "event",
        "display_priority": 88,
        "credibility_weight": 0,
        "scene_scope": ["catch", "trip"],
        "goods_image": "/images/icons/h33.png",
        "stock": 100,
        "is_limited": False,
    },
    "评论达人": {
        "code": "event_comment_master",
        "type": "event",
        "sub_type": "achievement",
        "style_key": "behavior_blue",
        "icon_key": "chat",
        "source_type": "system",
        "display_priority": 58,
        "credibility_weight": 0,
        "scene_scope": ["question"],
    },
    "手有余香": {
        "code": "event_generous_like",
        "type": "event",
        "sub_type": "achievement",
        "style_key": "behavior_blue",
        "icon_key": "heart",
        "source_type": "system",
        "display_priority": 57,
        "credibility_weight": 0,
        "scene_scope": [],
    },
    "7日": {
        "code": "event_login_7d",
        "type": "event",
        "sub_type": "milestone",
        "style_key": "behavior_blue",
        "icon_key": "calendar",
        "source_type": "system",
        "display_priority": 45,
        "credibility_weight": 0,
        "scene_scope": [],
    },
    "内容创作者": {
        "code": "identity_creator",
        "type": "identity",
        "sub_type": "creator",
        "style_key": "identity_orange",
        "icon_key": "pen",
        "source_type": "system",
        "display_priority": 72,
        "credibility_weight": 1,
        "scene_scope": ["recommend", "experience", "trip"],
    },
    "21日": {
        "code": "event_login_21d",
        "type": "event",
        "sub_type": "milestone",
        "style_key": "behavior_orange",
        "icon_key": "calendar",
        "source_type": "system",
        "display_priority": 60,
        "credibility_weight": 0,
        "scene_scope": [],
    },
    "社交核心": {
        "code": "event_social_core",
        "type": "event",
        "sub_type": "achievement",
        "style_key": "behavior_gold",
        "icon_key": "link",
        "source_type": "system",
        "display_priority": 78,
        "credibility_weight": 0,
        "scene_scope": [],
    },
    "论坛领袖": {
        "code": "event_forum_leader",
        "type": "event",
        "sub_type": "honor",
        "style_key": "official_gold",
        "icon_key": "medal",
        "source_type": "system",
        "display_priority": 96,
        "credibility_weight": 1,
        "scene_scope": [],
    },
}


def read_legacy_rows(path: Path):
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def build_tag_definition(row: dict, cfg: dict) -> dict:
    tag_id = f"tag_{cfg['code']}"
    return {
        "_id": tag_id,
        "code": cfg["code"],
        "name": row["name"],
        "type": cfg["type"],
        "sub_type": cfg["sub_type"],
        "rarity_level": int(row["rarity_level"]),
        "style_key": cfg["style_key"],
        "icon_key": cfg["icon_key"],
        "source_type": cfg["source_type"],
        "is_redeemable": row.get("need_points") is not None,
        "is_wearable": True,
        "is_active": bool(int(row.get("status") or 0) == 1),
        "display_priority": cfg["display_priority"],
        "credibility_weight": cfg["credibility_weight"],
        "scene_scope": cfg["scene_scope"],
        "description": row.get("tag_desc") or "",
        "legacy_tag_doc_id": row.get("_id"),
        "legacy_tag_id": row.get("id"),
        "legacy_condition_type": row.get("condition_type"),
        "legacy_need_points": row.get("need_points"),
        "legacy_sort": row.get("sort"),
        "created_at": row.get("create_time"),
        "updated_at": row.get("update_time"),
    }


def build_goods_row(row: dict, cfg: dict) -> dict | None:
    need_points = row.get("need_points")
    if need_points is None:
        return None

    goods_id = f"goods_tag_{cfg['code']}"
    tag_id = f"tag_{cfg['code']}"
    stock = int(cfg.get("stock", 9999))
    is_limited = bool(cfg.get("is_limited", False))

    rules = "兑换后永久获得，可在编辑资料中佩戴。"
    if is_limited:
        rules = f"限量兑换，当前库存 {stock}；兑换后永久获得。"

    return {
        "_id": goods_id,
        "goods_name": row["name"],
        "goods_desc": row.get("tag_desc") or "",
        "type": 0,
        "amount": int(need_points),
        "points": int(need_points),
        "stock": stock,
        "img_url": cfg.get("goods_image") or "/images/icons/h28.png",
        "is_available": 1 if int(row.get("status") or 0) == 1 else 0,
        "tag_id": tag_id,
        "rarity_level": int(row["rarity_level"]),
        "sort": int(row.get("sort") or 0),
        "source_type": "tag_redeem",
        "rules": rules,
        "is_limited": is_limited,
        "legacy_tag_doc_id": row.get("_id"),
        "legacy_tag_id": row.get("id"),
        "created_at": row.get("create_time"),
        "updated_at": row.get("update_time"),
    }


def write_ndjson(path: Path, rows: list[dict]):
    path.write_text(
        "\n".join(json.dumps(row, ensure_ascii=False) for row in rows) + ("\n" if rows else ""),
        encoding="utf-8",
    )


def build_visual_recommendations(rows: list[dict], cfg_map: dict[str, dict]) -> list[dict]:
    recommendations = []
    for row in rows:
        cfg = cfg_map[row["name"]]
        recommendations.append({
            "name": row["name"],
            "code": cfg["code"],
            "type": cfg["type"],
            "sub_type": cfg["sub_type"],
            "style_key": cfg["style_key"],
            "icon_key": cfg["icon_key"],
            "rarity_level": int(row["rarity_level"]),
            "source_type": cfg["source_type"],
            "scene_scope": cfg["scene_scope"],
            "display_priority": cfg["display_priority"],
        })
    return recommendations


def main():
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SOURCE
    output_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_OUTPUT_DIR
    output_dir.mkdir(parents=True, exist_ok=True)

    rows = read_legacy_rows(source)
    missing = [row["name"] for row in rows if row["name"] not in TAG_CONFIG]
    if missing:
        raise SystemExit(f"Missing TAG_CONFIG for: {', '.join(missing)}")

    tag_definitions = []
    goods_rows = []
    summary = []

    for row in rows:
        cfg = TAG_CONFIG[row["name"]]
        definition = build_tag_definition(row, cfg)
        goods = build_goods_row(row, cfg)
        tag_definitions.append(definition)
        if goods:
            goods_rows.append(goods)
        summary.append({
            "name": row["name"],
            "tag_id": definition["_id"],
            "code": definition["code"],
            "type": definition["type"],
            "sub_type": definition["sub_type"],
            "style_key": definition["style_key"],
            "icon_key": definition["icon_key"],
            "is_redeemable": definition["is_redeemable"],
            "goods_id": goods["_id"] if goods else None,
        })

    tag_definitions.sort(key=lambda item: (item["display_priority"], item["rarity_level"], item["name"]))
    goods_rows.sort(key=lambda item: (item["amount"], item["rarity_level"], item["goods_name"]))
    visual_recommendations = build_visual_recommendations(rows, TAG_CONFIG)
    visual_recommendations.sort(key=lambda item: (item["display_priority"], item["rarity_level"], item["name"]))

    write_ndjson(output_dir / "bz_tag_definitions.seed.ndjson", tag_definitions)
    write_ndjson(output_dir / "bz_points_goods.seed.ndjson", goods_rows)
    (output_dir / "tag_visual_recommendations.json").write_text(
        json.dumps(visual_recommendations, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (output_dir / "tag_seed_summary.json").write_text(
        json.dumps(
            {
                "source_file": str(source),
                "tag_definition_count": len(tag_definitions),
                "goods_count": len(goods_rows),
                "collections": {
                    "bz_tag_definitions": "bz_tag_definitions.seed.ndjson",
                    "bz_points_goods": "bz_points_goods.seed.ndjson",
                },
                "artifacts": {
                    "visual_recommendations": "tag_visual_recommendations.json",
                },
                "notes": [
                    "bz_user_tags 和 user_tag_display_settings 不从旧标签定义自动生成。",
                    "积分商品只为旧数据中 need_points 不为空的标签生成。",
                    "goods.tag_id 直接引用 bz_tag_definitions 的 _id。",
                    "style_key / sub_type / icon_key 已切换为 GearSage tag 体系的最终推荐值。",
                ],
                "mapping": summary,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Generated {len(tag_definitions)} tag definitions and {len(goods_rows)} goods rows in {output_dir}")


if __name__ == "__main__":
    main()
