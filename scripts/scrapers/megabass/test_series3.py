import requests
from bs4 import BeautifulSoup

url = "https://www.megabass.co.jp/site/freshwater/bass_rod/"
response = requests.get(url)
soup = BeautifulSoup(response.content, 'html.parser')

body = soup.find('div', class_='category_home__body')
if body:
    links = body.find_all('a')
    for link in links:
        print(link.get('href'))
else:
    print("category_home__body not found")
