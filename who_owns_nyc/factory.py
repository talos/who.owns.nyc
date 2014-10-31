import stripe

from flask import Flask, request_started
from flask.ext.assets import Environment, Bundle

from who_owns_nyc import login_manager
from who_owns_nyc.models import db, User
from who_owns_nyc.signals import request_started_handler
from who_owns_nyc.views import register_routes

def get_user(user_id):
  return User.query.get(user_id)

def create_app():
  app = Flask(__name__, template_folder=u"templates")
  app.config.from_object(u'config')

  db.init_app(app)

  login_manager.init_app(app)
  login_manager.user_loader(get_user)

  register_routes(app)

  request_started.connect(request_started_handler, app)

  stripe.api_key = app.config.get(u"STRIPE_API_KEY")

  assets = Environment(app)

  js = Bundle(u"js/libs/react-0.10.0.js",
              u"js/libs/JSXTransformer-0.10.0.js",
              u"js/libs/proj4.js",
              u"js/libs/leaflet.js",
              u"js/libs/jquery-1.11.1.min.js",
              u"js/libs/bootstrap/dropdown.js",
              u"js/libs/bootstrap/transition.js",
              u"js/libs/bootstrap/collapse.js",
              output=u"gen/libs.js")
  assets.register(u'js', js)
  jsx = Bundle(u"js/app.js", output=u"gen/app_jsx.js")
  assets.register(u'jsx', jsx)
  css = Bundle(u"stylesheets/styles.css",
               u"stylesheets/libs/hint.css",
               u"stylesheets/libs/leaflet.css",
               output=u"gen/stylesheets.css")
  assets.register(u'css', css)

  return app
