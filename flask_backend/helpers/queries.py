from db import db
import models

def get_user(uid):
    # sub is the uid in new db schema
    return db.session.query(models.User).filter(models.User.uid == uid).first()