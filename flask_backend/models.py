from db import db

# SQLAlchemy Table Object Storage

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    uid = db.Column(db.String(64), unique=True, nullable=False)
    name = db.Column(db.String(64))
    email = db.Column(db.String(64), unique=True)
    role = db.Column(db.Integer, nullable=False)
    phone_number = db.Column(db.String(15))
    rewards = db.Column(db.Integer, default=0)

    customer_orders = db.relationship('Order', foreign_keys='Order.customer_id', back_populates='customer')
    employee_orders = db.relationship('Order', foreign_keys='Order.employee_id', back_populates='employee')

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
    customer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    employee_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    timestamp = db.Column(db.TIMESTAMP, nullable=False)
    total_price = db.Column(db.Numeric(10, 2), nullable=False)
    pearls_earned = db.Column(db.Integer)
    payment_method = db.Column(db.String(20), nullable=False)

    customer = db.relationship('User', foreign_keys=[customer_id], back_populates='customer_orders')
    employee = db.relationship('User', foreign_keys=[employee_id], back_populates='employee_orders')

class JointOrderItem(db.Model):
    __tablename__ = 'joint_order_items'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    menu_item_id = db.Column(db.Integer, db.ForeignKey('menu_items.id'), nullable=False)

class JointRecipeIngredient(db.Model):
    __tablename__ = 'joint_recipe_ingredients'
    menu_item_id = db.Column(db.Integer, primary_key=True)
    inventory_item_id = db.Column(db.Integer, primary_key=True)
    quantity_used = db.Column(db.Integer, nullable=False)
