from flask import Flask
from db import init_db
from routes import database


app = Flask(__name__)

# Set up DB
init_db(app)


# Test API calls
@app.route('/')
def home():
    return "This is the API server. Make requests to /api/..."

@app.route('/api/test')
def test():
    return {"message": "Success"}

# Add a /api/testdb which just tries to establish connection and returns success or fail

# Register route files
app.register_blueprint(database.bp, url_prefix='/api/db')

if __name__ == '__main__':
    app.run(debug=True)
