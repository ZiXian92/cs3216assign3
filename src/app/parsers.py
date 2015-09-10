import requests
from bs4 import BeautifulSoup


class ParserException(Exception):
    pass


class BaseParser():
    SOURCE_ID = 'dummy'

    @classmethod
    def parse_post(cls, pid):
        if False:
            raise ParserException()
        return {
            'title': 'Dummy Title',
            'image_url': '',
            'headlines': 'Dummy Headline',
            'bullets': [{'title': 'Bullet One', 'details': 'Details One'},
                        {'title': 'Bullet Two', 'details': 'Details Two'}],
            'url': cls.get_url(pid),
            'categories': ['Category One', 'Category Two'],
            'id': pid,
            'source': cls.SOURCE_ID
        }

    @classmethod
    def get_pid(cls, url):
        return '0'

    @classmethod
    def get_url(cls, pid):
        return ''


class LifeHackParser(BaseParser):
    SOURCE_ID = 'lifehack'

    @classmethod
    def parse_post(cls, url):
        request = requests.get(url)
        if request.status_code != 200:
            raise ParserException()
        html = BeautifulSoup(request.text)
        title = html.select('h1')[0].string.strip()
        categories = [x.string.strip() for x in html.find('span', class_='category').select('a')]
        post_content = html.find('div', class_='post-content')
        if (not post_content):
            raise ParserException()

        def parse_bullet(bullet):
            if bullet.string is None:
                return None
            details = {'title': bullet.string.strip(), 'details': []}
            element = bullet
            while element.nextSibling:
                element = element.nextSibling
                if element.name == 'h2':
                    break
                if element.name == 'p' and element.string is not None:
                    details['details'].append(element.string)
            return details

        return {
            'title': title,
            'image_url': '',
            'headlines': 'Dummy Headline',
            'bullets': [parse_bullet(_) for _ in post_content.select('h2')],
            'url': url,
            'categories': categories,
            'id': url,
            'source': cls.SOURCE_ID
        }

    @classmethod
    def get_pid(cls, url):
        return url.split('/')[3]

    @classmethod
    def get_url(cls, pid):
        return 'http://www.lifehack.org/{}/'.format(pid)


parsers = {_.SOURCE_ID: _ for _ in [BaseParser, LifeHackParser]}
