import json

try:
    with open('GearSage-client/pkgGear/data_raw/daiwa_rod_normalized.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        for i in range(12, 16):
            if i < len(data):
                item = data[i]
                print(f"ID {i+1}: {item.get('model_name')} (URL: {item.get('url')})")
                print(f"Variants count: {len(item.get('variants', []))}")
                for v in item.get('variants', [])[:5]:
                    desc = v.get('variant_description', '')
                    print(f"  - {v.get('variant_name')}: {'[EMPTY]' if not desc else desc[:30] + '...'}")
                print("-" * 40)
except Exception as e:
    print(e)
