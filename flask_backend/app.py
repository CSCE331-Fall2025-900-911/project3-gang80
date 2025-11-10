from flask import Flask
from db import init_db
from routes import database
from flask_cors import CORS


app = Flask(__name__)

CORS(app, origins=[
    "https://project3-gang80-1.onrender.com", "http://127.0.0.1:5000", "http://localhost:5173" #add local host below to test locally
])

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
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
