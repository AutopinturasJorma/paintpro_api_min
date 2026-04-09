from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
import os

def create_app():
    app = Flask(__name__, static_folder=None)
    CORS(app)

    # Registro de blueprints
    from backend.routes.analytics_routes import analytics_bp
    from backend.routes.finance_routes import finance_bp
    from backend.routes.optimicer_routes import optimicer_bp

    app.register_blueprint(analytics_bp)
    app.register_blueprint(finance_bp)
    app.register_blueprint(optimicer_bp)

    # Servir frontend
    FRONT_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")

    @app.route("/")
    def index():
        return send_from_directory(FRONT_DIR, "index.html")

    @app.route("/static/<path:path>")
    def static_proxy(path):
        return send_from_directory(os.path.join(FRONT_DIR, "static"), path)

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=True)
