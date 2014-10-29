import stripe

from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.login import UserMixin
from sqlalchemy.sql import func

from socianonopay.helpers import generate_token

db = SQLAlchemy()

class User(db.Model, UserMixin):
  """

  """
  id = db.Column(db.Integer(), primary_key=True)
  token = db.Column(db.String(), default=generate_token, unique=True)

  debits = db.relationship('Debit', backref='user', lazy='dynamic')
  credits = db.relationship('Credit', backref='user', lazy='dynamic')

  def debit(self, amount, description=None):
    if amount > self.balance:
      raise Exception(u"Insufficient funds: balance is {}".format(self.balance))
    debit = Debit(user=self, amount=amount, description=description)
    self.debits.append(debit)
    return debit

  def charge(self, amount, token):
    charge = stripe.Charge.create(
      amount=amount,
      currency="usd",
      card=token,
      description="payinguser@example.com"
    )
    charge
    return self.credit(amount)

  def credit(self, amount, description=None):
    credit = Credit(user=self, amount=amount, description=description)
    self.credits.append(credit)
    return credit

  @property
  def balance(self):
    total_debit = sum(float(d.amount) for d in self.debits)
    total_credit = sum(float(d.amount) for d in self.credits)

    return total_credit - total_debit

  def is_anonymous(self):
    return True


class Debit(db.Model):
  id = db.Column(db.Integer(), primary_key=True)
  user_id = db.Column(db.Integer(), db.ForeignKey('user.id'), nullable=False)

  amount = db.Column(db.Integer(), nullable=False)
  created = db.Column(db.DateTime(), default=func.now())
  description = db.Column(db.Text(), nullable=True)


class Credit(db.Model):
  id = db.Column(db.Integer(), primary_key=True)
  user_id = db.Column(db.Integer(), db.ForeignKey('user.id'), nullable=False)

  amount = db.Column(db.Integer(), nullable=False)
  created = db.Column(db.DateTime(), default=func.now())
  description = db.Column(db.Text(), nullable=True)
