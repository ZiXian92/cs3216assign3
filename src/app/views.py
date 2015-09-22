from app import app, api, utils, models, db

from flask import render_template, request, g, abort
from facebook import parse_signed_request
from flask_restful import Resource, reqparse

FB_APP_ID = app.config['FB_APP_ID']
FB_APP_SECRET = app.config['FB_APP_SECRET']


def prepare_article(post):
    article_dict = post.to_dict()
    article_dict.update(utils.get_cached_post(article_dict['source'], article_dict['article_id']))
    article_dict['bookmarked'] = bool(g.user and post in g.user.bookmark_articles)
    return article_dict


def prepare_feed(articles):
    return [prepare_article(_) for _ in articles]


class Article(Resource):
    def get(self, source_id, post_id):
        article = models.Post.get_by_id(source_id, post_id)
        return prepare_article(article)


class Categories(Resource):
    def get(self):
        return [{'id': cat.id, 'name': cat.name} for cat in models.Category.get_all()]


class Feed(Resource):
    def get(self, category_id):
        try:
            page = int(request.args.get('page', 1))
        except ValueError:
            abort(400)
        limit = 5
        offset = (page - 1) * limit
        if category_id == 0:
            articles = models.Post.get_paginated(offset, limit)
        else:
            category = models.Category.get_by_id(category_id)
            if not category:
                abort(404)
            articles = category.get_paginated_articles(offset, limit)
        return prepare_feed(articles)


class Trending(Resource):
    def get(self):
        try:
            days = int(request.args.get('days', 5))
        except ValueError:
            abort(400)
        articles = models.Post.get_trending(days)
        return prepare_feed(articles)


class Bookmarks(Resource):
    parser = reqparse.RequestParser()
    parser.add_argument('source_id')
    parser.add_argument('article_id')

    def get(self):
        limit = 5
        if not g.user:
            abort(403)
        try:
            page = int(request.args.get('page', 1))
            category = int(request.args.get('category', 0))
        except ValueError:
            abort(400)
        bookmarked_articles = list(reversed(g.user.bookmark_articles))
        if category > 0:
            bookmarked_articles = [_ for _ in bookmarked_articles if _.categories[0].id == category]
        return {'total': len(bookmarked_articles),
                'data': prepare_feed(bookmarked_articles[limit * (page - 1):limit * page])}

    def post(self):
        if not g.user:
            abort(403)
        args = Bookmarks.parser.parse_args()
        article = models.Post.get_by_id(args['source_id'], args['article_id'])
        if not article:
            abort(404)
        if article in g.user.bookmark_articles:
            abort(409)
        g.user.bookmark_articles.append(article)
        db.session.commit()
        return args

    def delete(self):
        if not g.user:
            abort(403)
        args = Bookmarks.parser.parse_args()
        article = models.Post.get_by_id(args['source_id'], args['article_id'])
        if not article or article not in g.user.bookmark_articles:
            abort(404)
        g.user.bookmark_articles.remove(article)
        db.session.commit()
        return args


class BookmarksCount(Resource):
    def get(self):
        if not g.user:
            abort(403)
        bookmark_articles = g.user.bookmark_articles

        def count_by_category(category):
            count = 0
            for article in bookmark_articles:
                if article.categories[0].id == category:
                    count += 1
            return count

        result_by_categories = {category.id: count_by_category(category.id) for category in models.Category.get_all()}
        return {'total': len(bookmark_articles), 'by_categories': result_by_categories}


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


@app.before_request
def get_current_user():
    cookie = request.cookies.get("fbsr_" + FB_APP_ID, "")
    if cookie:
        result = parse_signed_request(signed_request=cookie, app_secret=FB_APP_SECRET)
        if result:
            uid = result["user_id"]
            user = models.User.get_by_id(uid)
            if not user:
                user = models.User(id=uid)
                user.insert()
            g.uid = user.id
            g.user = user
            return
    g.uid = None
    g.user = None


api.add_resource(Article, '/article/<string:source_id>/<string:post_id>')
api.add_resource(Bookmarks, '/bookmark')
api.add_resource(BookmarksCount, '/bookmark_count')
api.add_resource(Categories, '/categories')
api.add_resource(Feed, '/feed/<int:category_id>')
api.add_resource(Trending, '/trending')
