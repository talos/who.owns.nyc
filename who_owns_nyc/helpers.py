from random import choice
from string import digits, ascii_letters

def generate_token(length=40):
  return ''.join(choice(digits + ascii_letters) for i in xrange(length))
