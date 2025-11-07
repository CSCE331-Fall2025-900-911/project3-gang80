from flask import Blueprint, jsonify
from db import db

bp = Blueprint('database', __name__)

# Define the table mapping
class MenuItem(db.Model):
    __tablename__ = "menu_items"
    id = db.Column(db.Integer, primary_key=True)

@bp.route('/menu_items', methods=['GET'])
def get_items():
    count = db.session.query(MenuItem).count()  # SQLAlchemy row count
    return jsonify({"menu_items_count": count})
