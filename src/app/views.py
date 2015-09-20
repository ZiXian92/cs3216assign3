from app import app, api, utils, models

from flask import render_template, request, session, g
from facebook import get_user_from_cookie
from flask_restful import Resource

FB_APP_ID = app.config['FB_APP_ID']
FB_APP_SECRET = app.config['FB_APP_SECRET']


class Article(Resource):
    def get(self, source_id, post_id):
        return utils.get_cached_post(source_id, post_id)


class Categories(Resource):
    def get(self):
        return [{'id': cat.id, 'name': cat.name} for cat in models.Category.get_all()]


class Feed(Resource):
    def get(self, category_id):
        try:
            page = int(request.args.get('page', 1))
        except ValueError:
            return 400
        limit = 5
        offset = (page - 1) * limit
        if category_id == 0:
            result = [_.to_dict() for _ in models.Post.get_paginated(offset, limit)]
        else:
            category = models.Category.get_by_id(category_id)
            result = [_.to_dict() for _ in category.get_paginated_articles(offset, limit)]
        for post in result:
            post.update(utils.get_cached_post(post['source'], post['article_id']))
        return result


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


@app.before_request
def get_current_user():
    if not session.get('user'):
        result = get_user_from_cookie(cookies=request.cookies, app_id=FB_APP_ID,
                                      app_secret=FB_APP_SECRET)
        if result:
            uid = result['uid']
            user = models.User.get_by_id(uid)
            if not user:
                user = models.User(id=uid)
                user.insert()

            session['user'] = user.id

    g.uid = session.get('user')
    g.user = models.User.get_by_id(g.uid) if g.uid else None

    if not g.user:
        session['user'] = ''


api.add_resource(Article, '/article/<string:source_id>/<string:post_id>')
api.add_resource(Categories, '/categories')
api.add_resource(Feed, '/feed/<int:category_id>')
