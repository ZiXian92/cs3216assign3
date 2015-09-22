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

        def parse_bullets():
            def parse_bullet(bullet, tag):
                details = {'title': bullet.getText().strip(), 'details': []}
                element = bullet
                while element.nextSibling:
                    element = element.nextSibling
                    if element.name == tag:
                        break
                    if element.name == 'p' and element.getText():
                        details['details'].append(element.getText())
                details['details'] = [_ for _ in details['details'] if _]
                return details

            def refine(bullets):
                refined_bullets = []
                for bullet in bullets:
                    if not bullet in refined_bullets:
                        refined_bullets.append(bullet)
                return refined_bullets

            for bullet_tag in ['h2', 'h1', 'ol']:
                bullet_elements = post_content.select(bullet_tag)
                bullets = refine([parse_bullet(_, bullet_tag) for _ in bullet_elements if _ and _.getText().strip()])
                if len(bullets) > 0:
                    return bullets
            return []

        return {
            'title': title,
            'image': parse_image_url(),
            'headlines': parse_headlines(),
            'bullets': parse_bullets(),
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


class MarcAndAngelParser(BaseParser):
    SOURCE_ID = 'marcandangel'

    @classmethod
    def parse_post(cls, id, categories = []):
        url = cls.get_url(id)
        request = requests.get(url)
        if request.status_code != 200:
            raise ParserException()
        html = BeautifulSoup(request.text)
        title = html.find('h1', class_='entry-title').getText().strip()
        content = html.find('div', class_='entry-content')
        body_classes = html.find('body')['class']
        pid = None
        for body_class in body_classes:
            if body_class.startswith('postid-'):
                pid = body_class[7:]

        def parse_image_url():
            image = content.find('img')
            image_url = image['src']
            for extension in ['jpg', 'png']:
                end_index = image_url.find('.' + extension)
                if end_index >= 0:
                    return image_url[:end_index + len(extension) + 1]
            return None

        def parse_headlines():
            element = content.findChild()
            headlines = []
            while element:
                if element.name == 'h3':
                    break
                if element.name == 'p' and element.getText():
                    headlines.append(element.getText().strip())
                element = element.nextSibling
            return headlines

        def parse_bullets():
            h3_elements = content.select('h3')
            bullets = []
            for h3_element in h3_elements:
                bullet = {'title': h3_element.getText(), 'details': []}
                if bullet['title'] and not h3_element.get('class'):
                    bullets.append(bullet)
                    element = h3_element
                    while element.nextSibling:
                        element = element.nextSibling
                        if element.name == 'h3':
                            break
                        if element.name == 'p' and element.getText():
                            bullet['details'].append(element.getText().strip())

            if len(bullets) == 0 and (content.find('ol') or content.find('ul')):
                li_elements = content.select('li')
                for li_element in li_elements:
                    title = li_element.find('strong')
                    p = li_element.next.next.next
                    if not title:
                        continue
                    bullet = {'title': title.getText().strip(), 'details': p.strip()}
                    bullets.append(bullet)

            return bullets

        return {
            'title': title,
            'image': parse_image_url(),
            'headlines': parse_headlines(),
            'bullets': parse_bullets(),
            'category': categories,
            'id': pid,
            'url': url,
            'source': cls.SOURCE_ID
        }

    @classmethod
    def map_category(cls, categories):
        for category in categories:
            category = category.lower()
            if category in ['tech', 'life']:
                return 'Lifestyle'
            if category in ['money', 'career']:
                return 'Money'
        return 'Others'

    @classmethod
    def get_url(cls, pid):
        return 'http://www.marcandangel.com?p={}/'.format(pid)

    @classmethod
    def crawl(cls, limit = 1):
        posts = []
        for category in ['money', 'tech', 'life', 'career']:
            base_url = 'http://www.marcandangel.com/category/{}/page/{}/'
            page = 1
            while page <= limit:
                url = base_url.format(category, page)
                request = requests.get(url)
                if request.status_code != 200:
                    break

                html = BeautifulSoup(request.text)
                articles = html.findAll('article')
                for article in articles:
                    article_classes = article['class']
                    pid = None
                    for article_class in article_classes:
                        if article_class.startswith('post-'):
                            pid = article_class[5:]
                    link = article.find('h1').find('a')
                    time = datetime.strptime(article.find('time')['datetime'].split('+')[0], '%Y-%m-%dT%H:%M:%S')
                    if link['href']:
                        posts.append({
                            'title': link.getText().strip(),
                            'id': pid,
                            'url': link['href'],
                            'category': cls.map_category([category]),
                            'source': cls.SOURCE_ID,
                            'image': '',
                            'create_time': time
                        })

                page += 1

        return posts


class NewserParser(BaseParser):
    SOURCE_ID = 'newser'

    @classmethod
    def parse_post(cls, url):
        request = requests.get(url)
        if request.status_code != 200:
            raise ParserException()
        html = BeautifulSoup(request.text)
        title = html.find('div', class_='storyTitle').find('h1').getText()
        headlines = html.find('div', class_='storyTitle').find('h2').getText()
        image_url = html.find('div', class_='storyTopSideMedia').find('img')['src']
        
        def parse_bullets():
            paragraphs = html.findAll('p', class_='storyParagraph')
            bullets = []
            for paragraph in paragraphs:
                text = paragraph.getText().strip()
                while True:
                    index = text.find('  ')
                    if index < 0:
                        break
                    text = text[index + 2:]
                for i in range(0, len(text)):
                    if text[i] in '.!?':
                        bullets.append({'title': text[:i + 1], 'details': text[i + 1:]})
                        break
            return bullets

        return {
            'title': title,
            'image_url': image_url,
            'headlines': headlines,
            'bullets': parse_bullets(),
            'url': url,
            'category': cls.map_category([]),
            'id': cls.get_pid(url),
            'source': cls.SOURCE_ID
        }

    @classmethod
    def get_pid(cls, url):
        return url.split('/')[4]

    @classmethod
    def get_url(cls, pid):
        return ''

    @classmethod
    def crawl(cls):
        categories = {
            'money': 'http://rss.newser.com/rss/section/5.rss',
            'tech': 'http://rss.newser.com/rss/section/7.rss',
        }
        posts = []

        for category in categories:
            url = categories[category]
            request = requests.get(url)
            if request.status_code != 200:
                continue
            html = BeautifulSoup(request.text)
            items = html.findAll('item')
            for item in items:
                title = item.find('title').getText().strip()
                link = item.find('link').getText()
                posts.append({
                    'id': cls.get_pid(link),
                    'url': link,
                    'title': title,
                    'category': category,
                    'source': cls.SOURCE_ID
                })

        return posts

    @classmethod
    def map_category(cls, categories):
        return 'Others'


parsers = {_.SOURCE_ID: _ for _ in [LifeHackParser, MarcAndAngelParser]}
