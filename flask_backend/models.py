from db import db

# SQLAlchemy Table Object Storage

class MenuItem(db.Model):
    __tablename__ = "menu_items"
    id = db.Column(db.Integer, primary_key=True)

class User(db.Model):
    __tablename__ = "users"
    uid = db.Column(db.String, primary_key=True)