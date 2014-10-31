import httplib2
import sys

sys.path.append('..')
sys.path.append('.')

from config import ( GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_KEY_FILE_PATH,
                     GOOGLE_PROJECT_NUMBER )
from apiclient.discovery import build
from oauth2client.client import SignedJwtAssertionCredentials

f = file(GOOGLE_KEY_FILE_PATH, 'rb')
key = f.read()
f.close()

credentials = SignedJwtAssertionCredentials(
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key,
    scope='https://www.googleapis.com/auth/bigquery')

# TODO this will expire after several hours...
http = httplib2.Http()
http = credentials.authorize(http)

service = build('bigquery', 'v2')
jobs = service.jobs()
#datasets = service.datasets()
#response = datasets.list(projectId=GOOGLE_PROJECT_NUMBER).execute(http)


def bytes2expense(bytes):
  """
  500c per terabyte processed
  """
  return (float(bytes) / pow(1024, 4)) * 500


def test(sql, **kwargs):
  """
  Test query as dry run.  Returns the number of cents it would take to run.
  """
  return bytes2expense(query(sql, tested=True, dryRun=True)['totalBytesProcessed'])


def query(sql, budget=0, tested=False, **kwargs):
  """
  budget: available USD cents for this query
  sql: query to execute
  """
  if not tested:
    expense = test(sql, **kwargs)
    if expense > budget:
      raise Exception(u"Insufficient funds to perform query, {} required".format(
        expense))

  body = {
    u"kind": u"bigquery#queryRequest",
    u"dryRun": False,
    u"useQueryCache": True,
    u"query": sql
  }
  body.update(kwargs)
  return jobs.query(projectId=GOOGLE_PROJECT_NUMBER, body=body).execute(http)
