from flask import render_template, request, url_for, redirect
from flask.ext.login import current_user

from socianonopay.models import db

def register_routes(app):

  @app.route('/', methods=['GET'])
  def index():
    return render_template('index.html')

  @app.route('/charge', methods=['POST'])
  def charge():
    if 'stripeToken' in request.form:
      token = request.form['stripeToken']
      amount = request.args['amount']
      if amount in ('500', '1000', '2000'):
        amount = int(amount)

        credit = current_user.charge(amount, token)
        db.session.add(credit)
        db.session.commit()

    return redirect(url_for('index'))

  @app.route('/query', methods=['POST'])
  def query():
    sql = request.form['sql']
    if sql:
      debit = current_user.bq_query(sql)
      db.session.add(debit)
      db.session.commit()
    return redirect(url_for('index'))
