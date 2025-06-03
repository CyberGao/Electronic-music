
from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask_cors import CORS
import os
import zipfile
from io import BytesIO

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite3'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'your_jwt_secret_key'
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db = SQLAlchemy(app)
jwt = JWTManager(app)
CORS(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    audios = db.relationship('AudioFile', backref='user', lazy=True)

class AudioFile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(200), nullable=False)
    filepath = db.Column(db.String(300), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if User.query.filter_by(username=username).first():
        return jsonify({'message': '用户名已存在'}), 400

    hashed_pw = generate_password_hash(password)
    user = User(username=username, password=hashed_pw)
    db.session.add(user)
    db.session.commit()

    return jsonify({'message': '注册成功'}), 200

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password, password):
        token = create_access_token(identity=username)
        return jsonify({'token': token}), 200

    return jsonify({'message': '用户名或密码错误'}), 401

@app.route('/api/upload', methods=['POST'])
@jwt_required()
def upload_file():
    if 'file' not in request.files:
        return jsonify({'message': '缺少文件'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': '未选择文件'}), 400

    if file:
        username = get_jwt_identity()
        user = User.query.filter_by(username=username).first()
        filename = secure_filename(file.filename)

        user_folder = os.path.join(app.config['UPLOAD_FOLDER'], username)
        os.makedirs(user_folder, exist_ok=True)

        filepath = os.path.join(user_folder, filename)
        file.save(filepath)

        audio = AudioFile(filename=filename, filepath=filepath, user_id=user.id)
        db.session.add(audio)
        db.session.commit()

        return jsonify({'message': '上传成功'}), 200

@app.route('/api/download', methods=['GET'])
@jwt_required()
def download_zip():
    username = get_jwt_identity()
    user = User.query.filter_by(username=username).first()
    audios = AudioFile.query.filter_by(user_id=user.id).all()

    if not audios:
        return jsonify({'message': '没有可下载的音频'}), 404

    zip_buffer = BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w') as zf:
        for audio in audios:
            if os.path.exists(audio.filepath):
                zf.write(audio.filepath, arcname=audio.filename)

    zip_buffer.seek(0)
    return send_file(zip_buffer, as_attachment=True, download_name=f"{username}_audios.zip", mimetype='application/zip')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)
