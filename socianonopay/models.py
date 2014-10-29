from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.login import UserMixin

from socianonopay.helpers import generate_token

db = SQLAlchemy()

class User(db.Model, UserMixin):
  """

  """
  id = db.Column(db.Integer(), primary_key=True)
  token = db.Column(db.String(), default=generate_token, unique=True)

  def is_anonymous(self):
    return True
