from flask import render_template
from flask.ext.login import current_user

def register_routes(app):

  @app.route('/')
  def index():
    return render_template('index.html', user=current_user)
