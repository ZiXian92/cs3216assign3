from app import app, api, utils, models, db

from flask import render_template, request, g, abort
from facebook import get_user_from_cookie
from flask_restful import Resource, reqparse

FB_APP_ID = app.config['FB_APP_ID']
FB_APP_SECRET = app.config['FB_APP_SECRET']


class Article(Resource):
    def get(self, source_id, post_id):
        article = models.Post.get_by_id(source_id, post_id).to_dict()
        article.update(utils.get_cached_post(source_id, post_id))
        return article


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
        result = []
        for post in articles:
            article_dict = post.to_dict()
            article_dict.update(utils.get_cached_post(article_dict['source'], article_dict['article_id']))
            article_dict['bookmarked'] = bool(g.user and post in g.user.bookmark_articles)
            result.append(article_dict)
        return result


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
        except ValueError:
            abort(400)
        data = [_.to_dict() for _ in g.user.bookmark_articles[limit * (page - 1):limit * page]]
        for post in data:
            post.update(utils.get_cached_post(post['source'], post['article_id']))
        return {'total': len(g.user.bookmark_articles), 'data': data}

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


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


@app.before_request
def get_current_user():
    result = get_user_from_cookie(cookies=request.cookies, app_id=FB_APP_ID,
                                  app_secret=FB_APP_SECRET)
    if result:
        uid = result['uid']
        user = models.User.get_by_id(uid)
        if not user:
            user = models.User(id=uid)
            user.insert()
        g.uid = user.id
        g.user = user
    else:
        g.uid = None
        g.user = None


api.add_resource(Article, '/article/<string:source_id>/<string:post_id>')
api.add_resource(Bookmarks, '/bookmark')
api.add_resource(Categories, '/categories')
api.add_resource(Feed, '/feed/<int:category_id>')
