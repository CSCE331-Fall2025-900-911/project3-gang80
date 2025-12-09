from datetime import datetime, date
from decimal import Decimal
from flask import jsonify, Blueprint
from db import db
from sqlalchemy import text

reports_bp = Blueprint('reports', __name__)

def query(sql, params=None):
    """Helper function to execute a raw SQL query and fetch all results."""
    with db.get_engine().connect() as connection:
        result = connection.execute(text(sql), params or {})
        columns = result.keys()
        rows = result.fetchall()
        # Convert rows to list of dicts
        result_list = [dict(zip(columns, row)) for row in rows]
        return result_list
    
def query_one(sql, params=None):
    """Helper function to execute a raw SQL query and fetch a single result."""
    with db.get_engine().connect() as connection:
        result = connection.execute(text(sql), params or {})
        row = result.fetchone()
        if row is None:
            return None
        columns = result.keys()
        return dict(zip(columns, row))
    
def get_last_z():
    """Fetch the timestamp of the last Z-report from the database."""
    sql = "SELECT MAX(last_z) AS last_z FROM z_report_marker"
    result = query_one(sql)
    if result and result['last_z']:
        return result['last_z']
    return None

def x_report():
    """Generate an X-report summarizing sales since the last Z-report."""
    last_z = get_last_z()
    params = {}
    sql = """
        SELECT 
            total_price,
            payment_method,
            employee_id,
            voided
        FROM orders
    """
    if last_z:
        sql += ' WHERE timestamp > :last_z'
        params['last_z'] = last_z

    rows = query(sql, params)
    if not rows:
        return {
            'since': last_z,
            'num_sales': 0,
            'cash_total': 0.0,
            'card_total': 0.0,
            'voids': 0,
            'employees': [],
            'total_sales': 0.0,
        }
    def normalize(method):
        if not method: return ""
        m = method.lower().strip()
        if "cash" in m:
            return "cash"
        elif "card" in m or "credit" in m or "debit" in m:
            return "card"
    for row in rows:
        row['payment_method'] = normalize(row['payment_method'])
        
    total_sales = sum(row['total_price'] for row in rows if not row['voided'])
    num_sales = sum(1 for row in rows if not row['voided'])
    cash_total = sum(row['total_price'] for row in rows if row['payment_method'] == 'cash' and not row['voided'])
    card_total = sum(row['total_price'] for row in rows if row['payment_method'] == 'card' and not row['voided'])
    voids = sum(1 for row in rows if row['voided'])
    employees = sorted({row["employee_id"] for row in rows})
    
    return {
        'since': last_z,
        'num_sales': num_sales,
        'cash_total': float(cash_total),
        'card_total': float(card_total),
        'voids': voids,
        'employees': employees,
        'total_sales': float(total_sales),
    }

def z_report():
    """Generate a Z-report summarizing all sales and reset counters."""
    sql = """
        SELECT 
            total_price,
            payment_method,
            employee_id,
            voided
        FROM orders
    """
    rows = query(sql)
    if not rows:
        return {
            'since': None,
            'num_sales': 0,
            'tax_amount': 0.0,
            'total_with_tax': 0.0,
            'cash_total': 0.0,
            'card_total': 0.0,
            'voids': 0,
            'employees': [],
            'total_sales': 0.0,
        }
    def normalize(method):
        if not method: return ""
        m = method.lower().strip()
        if "cash" in m:
            return "cash"
        elif "card" in m or "credit" in m or "debit" in m:
            return "card"
    for row in rows:
        row['payment_method'] = normalize(row['payment_method'])
        
    total_sales = sum(float(row['total_price'] or 0) for row in rows if not row['voided'])
    tax_rate = 0.0825
    tax_amount = total_sales * tax_rate
    total_with_tax = total_sales + tax_amount
    cash_total = sum(float(row['total_price'] or 0) for row in rows if row['payment_method'] == 'cash' and not row['voided'])
    card_total = sum(float(row['total_price'] or 0) for row in rows if row['payment_method'] == 'card' and not row['voided'])
    voids = sum(1 for row in rows if row['voided'])
    employees = sorted({row["employee_id"] for row in rows})
    timestamp = datetime.utcnow()
    
    # Store the Z-report in the database
    insert_sql = """
        INSERT INTO z_report_marker (last_z)
        VALUES (:timestamp)
    """
    with db.get_engine().connect() as connection:
        connection.execute(text(insert_sql), {'timestamp': timestamp})
        connection.commit()

    return {
        'since': timestamp,
        'sales': float(total_sales),
        'tax': float(tax_amount),
        'total_with_tax': float(total_with_tax),
        'cash_total': float(cash_total),
        'card_total': float(card_total),
        'voids': voids,
        'employees': employees,
    }

# Register route endpoints
@reports_bp.route('/x-report', methods=['GET'])
def get_x_report():
    try:
        data = x_report()
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/z-report', methods=['GET'])
def get_z_report():
    try:
        data = z_report()
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500