from db import db
import models

# ------------------- USERS -------------------
def get_user(id):
    return db.session.query(models.User).filter(models.User.id == id).first()

def get_user_from_uid(uid):
    return db.session.query(models.User).filter(models.User.uid == uid).first()

def get_all_users():
    return db.session.query(models.User).all()


# ------------------- MENU ITEMS -------------------
def get_menu_item(id):
    return db.session.query(models.MenuItem).filter(models.MenuItem.id == id).first()

def get_all_menu_items():
    return db.session.query(models.MenuItem).all()


# ------------------- INVENTORY -------------------
def get_inventory_item(id):
    return db.session.query(models.Inventory).filter(models.Inventory.id == id).first()

def get_all_inventory_items():
    return db.session.query(models.Inventory).all()


# ------------------- ORDERS -------------------
def get_order(id):
    return db.session.query(models.Order).filter(models.Order.id == id).first()

def get_all_orders():
    return db.session.query(models.Order).all()

# Foreign key helpers
def get_all_orders_from_customer(customer_id):
    return db.session.query(models.Order).filter(models.Order.customer_id == customer_id).all()

def get_all_orders_from_employee(employee_id):
    return db.session.query(models.Order).filter(models.Order.employee_id == employee_id).all()


# ------------------- JOINT ORDER ITEMS -------------------
def get_joint_order_item(id):
    return db.session.query(models.JointOrderItem).filter(models.JointOrderItem.id == id).first()

def get_all_joint_order_items():
    return db.session.query(models.JointOrderItem).all()

# Foreign key helpers
def get_all_joint_order_items_from_order(order_id):
    return db.session.query(models.JointOrderItem).filter(models.JointOrderItem.order_id == order_id).all()

def get_all_joint_order_items_from_menu_item(menu_item_id):
    return db.session.query(models.JointOrderItem).filter(models.JointOrderItem.menu_item_id == menu_item_id).all()


# ------------------- JOINT RECIPE INGREDIENTS -------------------
def get_joint_recipe_ingredient(id):
    return db.session.query(models.JointRecipeIngredient).filter(models.JointRecipeIngredient.id == id).first()

def get_all_joint_recipe_ingredients():
    return db.session.query(models.JointRecipeIngredient).all()

# Foreign key helpers
def get_all_joint_recipe_ingredients_from_menu_item(menu_item_id):
    return db.session.query(models.JointRecipeIngredient).filter(models.JointRecipeIngredient.menu_item_id == menu_item_id).all()

def get_all_joint_recipe_ingredients_from_inventory_item(inventory_item_id):
    return db.session.query(models.JointRecipeIngredient).filter(models.JointRecipeIngredient.inventory_item_id == inventory_item_id).all()
