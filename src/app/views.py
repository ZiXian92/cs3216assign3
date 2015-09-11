from app import app, api, utils, models

from flask import render_template, request

from flask_restful import Resource


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
        limit = 10
        offset = (page - 1) * limit
        if category_id == 0:
            return [_.to_dict() for _ in models.Post.get_paginated(offset, limit)]
        else:
            category = models.Category.get_by_id(category_id)
            return [_.to_dict() for _ in category.get_paginated_articles(offset, limit)]


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


api.add_resource(Article, '/article/<string:source_id>/<string:post_id>')
api.add_resource(Categories, '/categories')
api.add_resource(Feed, '/feed/<int:category_id>')
