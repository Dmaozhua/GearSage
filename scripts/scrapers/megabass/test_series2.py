import requests
from bs4 import BeautifulSoup

url = "https://www.megabass.co.jp/site/freshwater/bass_rod/"
response = requests.get(url)
soup = BeautifulSoup(response.content, 'html.parser')

# The main content is usually inside a specific section
main_content = soup.find('div', class_='content') or soup.find('main') or soup.find(id='main') or soup.find(id='primary')
if not main_content:
    print("Main content not found, using body")
    main_content = soup.find('body')

# Look for specific lists
items = main_content.select('.archive-list a') or main_content.select('.item-list a') or main_content.select('.category-list a')
if not items:
    # Just print the classes of the main content divs to inspect
    print("No specific list found. Inspecting classes:")
    for div in main_content.find_all('div', class_=True)[:10]:
        print(div.get('class'))

print("Extracted:")
for a in main_content.select('.item-list a, .archive-list a, .series-list a, .product-list a, article a'):
    print(a.get('href'))

