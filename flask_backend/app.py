from flask import Flask, send_from_directory
from db import init_db, db
from routes import database
from routes import weather
from routes import reports
from flask_cors import CORS
import os

# Optionally load .env in local development for convenience (do not commit .env)
try:
    # local import; if python-dotenv isn't installed this will fail silently
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

app = Flask(__name__, static_folder='../client/dist', static_url_path='')
CORS(app, resources={r"/*": {"origins": [
    "https://project3-gang80-1.onrender.com",
    "http://localhost:5173"
]}}, supports_credentials=True)

# Set up DB
init_db(app)


# Test API calls
# @app.route('/')
# def home():
#     return "This is the API server. Make requests to /api/..."

@app.route('/api/test')
def test():
    return {"message": "Success"}

# Add a /api/testdb which just tries to establish connection and returns success or fail

# Register route files
app.register_blueprint(database.bp, url_prefix='/api/db')
# Register weather blueprint so /api/weather is available
app.register_blueprint(weather.weather_bp)
app.register_blueprint(reports.reports_bp, url_prefix='/api/analytics')

# Health route to verify translate API key is set (useful for local debugging)
@app.route('/api/db/translate/health')
def translate_health():
    key = os.environ.get('TRANSLATE_API_KEY')
    if key:
        return {'translate_key_set': True}, 200
    return {'translate_key_set': False, 'message': 'TRANSLATE_API_KEY not set in environment'}, 200

# Serve React frontend - catch-all route for client-side routing
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    # Serve API and health check routes
    if path.startswith('api/') or path == 'api':
        return {'error': 'Not found'}, 404
    
    # For static files, try to serve them
    static_file = os.path.join(app.static_folder, path)
    if os.path.isfile(static_file):
        return send_from_directory(app.static_folder, path)
    
    # For all other routes, serve index.html (React Router will handle client-side routing)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))  # Render provides PORT
    app.run(host="0.0.0.0", port=port, debug=False)

