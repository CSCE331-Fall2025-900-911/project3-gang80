from db import db

# SQLAlchemy Table Object Storage

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    uid = db.Column(db.String(64), unique=True, nullable=False)
    name = db.Column(db.String(64))
    email = db.Column(db.String(64))
    role = db.Column(db.Integer, nullable=False)
    phone_number = db.Column(db.String(15))
    rewards = db.Column(db.Integer, default=0)

class MenuItem(db.Model):
    __tablename__ = 'menu_items'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    description = db.Column(db.String(255))
    is_modification = db.Column(db.Boolean, nullable=False)
    category = db.Column(db.String(64))
    img_name = db.Column(db.String(255))

class Inventory(db.Model):
    __tablename__ = 'inventory'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    restock_price = db.Column(db.Numeric(10, 2), nullable=False)

class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer)
    timestamp = db.Column(db.TIMESTAMP, nullable=False)
    total_price = db.Column(db.Numeric(10, 2), nullable=False)
    pearls_earned = db.Column(db.Integer)
    employee_id = db.Column(db.Integer, nullable=False)
    payment_method = db.Column(db.String(20), nullable=False)

class JointOrderItem(db.Model):
    __tablename__ = 'joint_order_items'
    order_id = db.Column(db.Integer, primary_key=True)
    menu_item_id = db.Column(db.Integer, primary_key=True)

class JointRecipeIngredient(db.Model):
    __tablename__ = 'joint_recipe_ingredients'
    menu_item_id = db.Column(db.Integer, primary_key=True)
    inventory_item_id = db.Column(db.Integer, primary_key=True)
    quantity_used = db.Column(db.Integer, nullable=False)
