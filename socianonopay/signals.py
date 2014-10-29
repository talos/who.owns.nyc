from flask.ext.login import current_user, login_user

from socianonopay.models import db, User

def request_started_handler(sender, **extra):

  # Create new user without password if there is none
  if current_user.get_id() == None:
    u = User()
    db.session.add(u)
    db.session.commit()
    login_user(u)
