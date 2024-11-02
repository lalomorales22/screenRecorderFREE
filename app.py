import os
from datetime import datetime
from flask import Flask, render_template, request, send_file, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
app = Flask(__name__)

# Configuration
app.secret_key = os.environ.get("FLASK_SECRET_KEY") or "screen-recorder-secret-key"
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config['UPLOAD_FOLDER'] = 'recordings'

# Initialize database
db.init_app(app)

# Ensure recordings directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route('/')
def index():
    recordings = Recording.query.order_by(Recording.created_at.desc()).all()
    return render_template('index.html', recordings=recordings)

@app.route('/save-recording', methods=['POST'])
def save_recording():
    if 'video' not in request.files:
        return jsonify({'error': 'No video file'}), 400
    
    video_file = request.files['video']
    if video_file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    filename = f"recording_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    video_file.save(filepath)
    
    # Save recording metadata to database
    recording = Recording(
        filename=filename,
        filepath=filepath,
        created_at=datetime.now()
    )
    db.session.add(recording)
    db.session.commit()
    
    return jsonify({'success': True, 'filename': filename})

@app.route('/download/<int:recording_id>')
def download_recording(recording_id):
    recording = Recording.query.get_or_404(recording_id)
    return send_file(recording.filepath, as_attachment=True)

@app.route('/delete/<int:recording_id>', methods=['POST'])
def delete_recording(recording_id):
    recording = Recording.query.get_or_404(recording_id)
    
    # Delete file from filesystem
    if os.path.exists(recording.filepath):
        os.remove(recording.filepath)
    
    # Delete record from database
    db.session.delete(recording)
    db.session.commit()
    
    return jsonify({'success': True})

with app.app_context():
    from models import Recording
    db.create_all()
