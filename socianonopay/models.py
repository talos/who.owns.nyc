import stripe
import json

from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.login import UserMixin
from sqlalchemy.sql import func

from socianonopay.helpers import generate_token
from socianonopay.bigquery import query, bytes2expense

db = SQLAlchemy()

class User(db.Model, UserMixin):
  """

  """
  id = db.Column(db.Integer(), primary_key=True)
  token = db.Column(db.String(), default=generate_token, unique=True)

  debits = db.relationship('Debit', backref='user', lazy='dynamic')
  credits = db.relationship('Credit', backref='user', lazy='dynamic')

  def debit(self, amount, description=None, response=None):
    if amount > self.balance:
      raise Exception(u"Insufficient funds: balance is {}".format(self.balance))
    debit = Debit(user=self, amount=amount, description=description, response=response)
    self.debits.append(debit)
    return debit

  def charge(self, amount, token):
    charge = stripe.Charge.create(
      amount=amount,
      currency="usd",
      card=token,
      description="payinguser@example.com"
    )
    return self.credit(amount, json.dumps(charge))

  def credit(self, amount, stripe_charge, description=None):
    credit = Credit(user=self, amount=amount,
                    stripe_charge=stripe_charge, description=description)
    self.credits.append(credit)
    return credit

  def bq_query(self, sql):
    resp = query(sql, budget=self.balance)
    debit = self.debit(bytes2expense(resp[u'totalBytesProcessed']),
                       response=json.dumps(resp))
    self.debits.append(debit)
    return debit

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
  response = db.Column(db.Text())


class Credit(db.Model):
  id = db.Column(db.Integer(), primary_key=True)
  user_id = db.Column(db.Integer(), db.ForeignKey('user.id'), nullable=False)

  stripe_charge = db.Column(db.Text(), nullable=False)
  amount = db.Column(db.Integer(), nullable=False)
  created = db.Column(db.DateTime(), default=func.now())
  description = db.Column(db.Text(), nullable=True)
