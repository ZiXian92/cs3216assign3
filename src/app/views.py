from app import app, api
from app.parsers import parsers

from flask import render_template

from flask_restful import Resource


class Post(Resource):
    def get(self, source_id, post_id):
        parser = parsers[source_id]
        return parser.parse_post(parser.get_url(post_id))


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')

api.add_resource(Post, '/<string:source_id>/<string:post_id>')
