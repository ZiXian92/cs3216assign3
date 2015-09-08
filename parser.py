import requests
from bs4 import BeautifulSoup

# parse lifejack.org
def parseUrl(url):
    request = requests.get(url)
    if request.status_code != 200:
        return {}

    html = BeautifulSoup(request.text)
    title = html.select('h1')[0].string
    bullets = map(lambda x: x.string, html.select('h2'))

    return {'title': title, 'bullets': bullets}