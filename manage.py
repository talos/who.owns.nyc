from flask.ext.script import Manager

from who_owns_nyc.models import db
from who_owns_nyc.factory import create_app

app = create_app()

manager = Manager(app)


@manager.command
@manager.option('-v', '--verbose', dest='verbose', default=False)
def drop_and_create_db(verbose=False):
    """
    Drops database and creates a new one
    """
    if not verbose:
        db.engine.echo = False
    try:
      db.drop_all()
    except:
      pass
    db.create_all()
    return 0


if __name__ == '__main__':
    manager.run()
