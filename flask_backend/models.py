from db import db

# SQLAlchemy Table Object Storage

class MenuItem(db.Model):
    __tablename__ = "menu_items"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    description = db.Column(db.String(255))
    is_modification = db.Column(db.Boolean, nullable=False)
    category = db.Column(db.String(32), nullable=False)


class User(db.Model):
    __tablename__ = "users"
    uid = db.Column(db.String, primary_key=True)