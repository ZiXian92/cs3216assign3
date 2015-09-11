from app import app, api, utils, models

from flask import render_template

from flask_restful import Resource


class Article(Resource):
    def get(self, source_id, post_id):
        return utils.get_cached_post(source_id, post_id)


class Categories(Resource):
    def get(self):
        return [{'id': cat.id, 'name': cat.name} for cat in models.Category.get_all()]


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


api.add_resource(Article, '/article/<string:source_id>/<string:post_id>')
api.add_resource(Categories, '/categories')
