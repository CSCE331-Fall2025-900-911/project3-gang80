from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_db(app):
    with open("passwd.txt", "r", encoding="utf-8", errors="ignore") as f:
        password = f.read().strip()
    app.config["SQLALCHEMY_DATABASE_URI"] = f"postgresql+psycopg2://gang_80:{password}@csce-315-db.engr.tamu.edu:5432/gang_80_db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.init_app(app)