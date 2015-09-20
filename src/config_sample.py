from os import path, urandom


# App details
BASE_DIRECTORY = path.abspath(path.dirname(__file__))
DEBUG = True
SECRET_KEY = urandom(64)

# Database details
SQLALCHEMY_DATABASE_URI = '{0}{1}'.format('sqlite:///',
                                          path.join(BASE_DIRECTORY, 'app.db'))

FB_APP_ID = '1663895923894184'
FB_APP_SECRET = '***REMOVED***'
