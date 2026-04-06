import json
import re
from bs4 import BeautifulSoup
from curl_cffi import requests

def test_scrape_line():
    url = "https://fish.shimano.com/zh-CN/product/line/nylonline/a15f900000e5lo8iaj.html"
    r = requests.get(url, impersonate="chrome")
    soup = BeautifulSoup(r.text, 'html.parser')
    
    model_name_tag = soup.find('h1')
    model_name = model_name_tag.get_text(strip=True) if model_name_tag else 'Unknown'
    print(f"Model Name: {model_name}")
    
    spec_table = soup.find('table')
    if not spec_table:
        print("No spec table found.")
        return
        
    headers = []
    # Try finding headers in the first row
    first_row = spec_table.find('tr')
    if first_row:
        for th in first_row.find_all(['th', 'td']):
            headers.append(th.get_text(strip=True))
            
    print("Headers:", headers)
    
    rows = spec_table.find_all('tr')
    for tr in rows[1:4]:  # Print up to 3 rows
        row = []
        for td in tr.find_all(['td', 'th']):
            row.append(td.get_text(strip=True))
        print("Row:", row)

if __name__ == "__main__":
    test_scrape_line()
