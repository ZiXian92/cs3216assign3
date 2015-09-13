from datetime import datetime

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
            'category': cls.map_category(['Category One', 'Category Two']),
            'id': pid,
            'source': cls.SOURCE_ID
        }

    @classmethod
    def get_pid(cls, url):
        return '0'

    @classmethod
    def get_url(cls, pid):
        return ''

    @classmethod
    def crawl(cls):
        return [{
                    'id': '0',
                    'title': 'Dummy Title',
                    'category': cls.map_category(['Category One', 'Category Two']),
                    'image': '',
                    'create_time': datetime(1970, 1, 1),
                    'source': cls.SOURCE_ID
                }]

    @classmethod
    def map_category(cls, categories):
        return 'Others'


class LifeHackParser(BaseParser):
    SOURCE_ID = 'lifehack'

    @classmethod
    def parse_post(cls, uid):
        url = cls.get_url(uid)
        request = requests.get(url)
        if request.status_code != 200:
            raise ParserException()
        html = BeautifulSoup(request.text)
        title = html.select('h1')[0].getText().strip()
        categories = [x.getText().strip() for x in html.find('span', class_='category').select('a')]
        post_content = html.find('div', class_='post-content')
        if not post_content:
            raise ParserException()

        def parse_image_url():
            poster = html.find('figure', class_='poster')
            if poster:
                image_tag = poster.find('img')
                image_str = image_tag['data-bttrlazyloading-md']
                for extension in ['jpg', 'png']:
                    end_index = image_str.find('.' + extension)
                    if end_index >= 0:
                        return image_str[image_str.find('http'):end_index + 4].replace('\\', '')
            return None

        def parse_headlines():
            element = post_content.findChild().findChild()
            headlines = []
            while True:
                if element.name == 'p' and element.getText().strip() is not None:
                    headlines.append(element.getText().strip())
                if element.name == 'h2' or not element.nextSibling:
                    break
                element = element.nextSibling
            return [_ for _ in headlines if _]

        def parse_bullet(bullet):
            if not bullet.getText():
                return None
            details = {'title': bullet.getText().strip(), 'details': []}
            element = bullet
            while element.nextSibling:
                element = element.nextSibling
                if element.name == 'h2':
                    break
                if element.name == 'p' and element.getText():
                    details['details'].append(element.getText())
            details['details'] = [_ for _ in details['details'] if _]
            return details

        return {
            'title': title,
            'image_url': parse_image_url(),
            'headlines': parse_headlines(),
            'bullets': [parse_bullet(_) for _ in post_content.select('h2') if _ and _.getText().strip()],
            'url': url,
            'category': cls.map_category(categories),
            'id': uid,
            'source': cls.SOURCE_ID
        }

    @classmethod
    def get_pid(cls, url):
        return url.split('/')[3]

    @classmethod
    def get_url(cls, pid):
        return 'http://www.lifehack.org/{}/'.format(pid)

    @classmethod
    def crawl(cls):
        r = requests.get('http://www.lifehack.org/wp-admin/admin-ajax.php?action=get_news_feed', headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.22 Safari/537.36'})
        d = r.json()['post'] or []
        return [{
                    'id': _['post_id'],
                    'title': _['post_title'],
                    'category': cls.map_category([i for i in [_['main_cat_name'], _['sub_cat_name']] if i]),
                    'image': _['image'],
                    'create_time': datetime.strptime(_['post_date'], '%Y-%m-%d %H:%M:%S'),
                    'source': cls.SOURCE_ID
                } for _ in d]

    @classmethod
    def map_category(cls, categories):
        for category in categories:
            category = category.lower()
            if category in ['communication', 'productivity']:
                return 'Self-help'
            if category in ['money', 'work']:
                return 'Money'
            if category in ['technology']:
                return 'Technology'
            if category in ['lifestyle']:
                return 'Lifestyle'
        return 'Others'


parsers = {_.SOURCE_ID: _ for _ in [LifeHackParser]}
