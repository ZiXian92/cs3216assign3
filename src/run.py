#!/usr/bin/env python

from app import app, db, models

db.create_all()
models.Category.create_categories()
app.run(host='0.0.0.0', port=8001)
