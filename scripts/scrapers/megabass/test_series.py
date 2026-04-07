import requests
from bs4 import BeautifulSoup

def get_series_links(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    # Let's look for specific container
    container = soup.select_one('.l-main') or soup
    links = container.select('a')
    series_links = set()
    for a in links:
        href = a.get('href', '')
        # Only keep links that start with https://www.megabass.co.jp/site/freshwater/ 
        # and don't have things like 'bass_rod', 'trout_rod', 'lure', 'reel' etc.
        if href.startswith('https://www.megabass.co.jp/site/freshwater/'):
            # Filter out categories and unrelated
            if not any(x in href for x in ['bass_rod', 'trout_rod', 'bass_lure', 'trout_lure', 'reel', 'feed', 'category', 'custom_parts']):
                # In Megabass, series are like /freshwater/destroyer_p5/
                # We can just collect them
                series_links.add(href)
    return list(series_links)

bass_series = get_series_links("https://www.megabass.co.jp/site/freshwater/bass_rod/")
trout_series = get_series_links("https://www.megabass.co.jp/site/freshwater/trout_rod/")

print("Bass Series:")
for s in bass_series: print(s)
print("\nTrout Series:")
for s in trout_series: print(s)

