from app import app, api, utils

from flask import render_template

from flask_restful import Resource


class Article(Resource):
    def get(self, source_id, post_id):
        return utils.get_cached_post(source_id, post_id)


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


api.add_resource(Article, '/article/<string:source_id>/<string:post_id>')
