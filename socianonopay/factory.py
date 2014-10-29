import stripe
from flask import Flask, request_started
from socianonopay import login_manager
from socianonopay.models import db, User
from socianonopay.signals import request_started_handler
from socianonopay.views import register_routes

def get_user(user_id):
  return User.query.get(user_id)

def create_app():
  app = Flask(__name__, template_folder="templates")
  app.config.from_object('config')

  db.init_app(app)

  login_manager.init_app(app)
  login_manager.user_loader(get_user)

  register_routes(app)

  request_started.connect(request_started_handler, app)

  stripe.api_key = app.config.get(u"STRIPE_API_KEY")

  return app
