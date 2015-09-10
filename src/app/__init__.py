from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy
from flask_restful import Api

import memcache

app = Flask(__name__)
app.config.from_object('config')
db = SQLAlchemy(app)
api = Api(app)

mc = memcache.Client(['127.0.0.1:11211'])

from app import views, models
