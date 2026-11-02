import os
import re
import sys
import firebase_admin
from firebase_admin import credentials, db
from PyQt5.QtWidgets import QApplication, QWidget, QPushButton, QVBoxLayout, QLabel, QLineEdit, QHBoxLayout
from PyQt5.QtCore import Qt, pyqtSignal

# Load the private service-account file from an environment variable.
service_account_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH")
if not service_account_path:
    raise RuntimeError("Set FIREBASE_SERVICE_ACCOUNT_PATH to the Firebase service-account JSON file.")

cred = credentials.Certificate(service_account_path)
firebase_admin.initialize_app(cred, options={
    'databaseURL': 'https://my-ticket-app-5b992-default-rtdb.firebaseio.com/' 
})

class LaserGameApp(QWidget):
    room_updated = pyqtSignal(str, object)

    def __init__(self):
        super().__init__()
        self.connected_pin = None  # Store the four-digit code for the connected game room.
        self.player_name = ""
        self.game_listener = None
        self.room_updated.connect(self.handle_room_update)
        self.initUI()

    def initUI(self):
        self.setWindowTitle('🎯 Pico WH スコアモニター')
        self.resize(460, 230)

        layout = QVBoxLayout()

        # Build the controls used to enter and submit a room code.
        self.conn_layout = QHBoxLayout()
        self.pin_input = QLineEdit(self)
        self.pin_input.setPlaceholderText('32-character room code')
        self.pin_input.setAlignment(Qt.AlignCenter)
        self.pin_input.setStyleSheet("font-size: 16px; padding: 5px; font-weight: bold;")
        self.conn_layout.addWidget(self.pin_input)

        self.connect_btn = QPushButton('接続', self)
        self.connect_btn.setStyleSheet("background-color: #34495e; color: white; font-size: 14px; padding: 6px 15px; font-weight: bold;")
        self.connect_btn.clicked.connect(self.connect_to_player)
        self.conn_layout.addWidget(self.connect_btn)
        
        layout.addLayout(self.conn_layout)

        # Show the current connection status.
        self.status_label = QLabel('プレイヤー未接続\n(スマホのQRコードからルームコードを取得してください)', self)
        self.status_label.setAlignment(Qt.AlignCenter)
        self.status_label.setStyleSheet("font-size: 14px; font-weight: bold; color: #7f8c8d; margin: 15px 0;")
        layout.addWidget(self.status_label)

        self.score_label = QLabel("Score: 0", self)
        self.score_label.setAlignment(Qt.AlignCenter)
        self.score_label.setStyleSheet("font-size: 20px; font-weight: bold; color: #2c3e50; margin-bottom: 10px;")
        self.score_label.setVisible(False)
        layout.addWidget(self.score_label)

        self.setLayout(layout)

    # Connect to the game room created by the player's phone.
    def connect_to_player(self):
        pin = self.pin_input.text().strip()
        if not re.fullmatch(r"[a-fA-F0-9]{32}", pin):
            self.status_label.setText("⚠️ 有効な32文字のルームコードを入力してください")
            return
        pin = pin.lower()

        try:
            # Look up the game room created by the web app.
            game_ref = db.reference(f'game_pins/{pin}')
            game_data = game_ref.get()

            if not isinstance(game_data, dict) or game_data.get('status') not in ('waiting', 'playing'):
                self.status_label.setText("❌ コードが見つかりません\n再度スマホの数字を確認してください")
                self.status_label.setStyleSheet("color: #e74c3c; font-size: 13px; font-weight: bold;")
                return

            self.connected_pin = pin
            self.player_name = game_data.get('name', 'Unknown')
            self.score_label.setText(f"Score: {game_data.get('score', 0)}")
            self.score_label.setVisible(True)
            
            # Follow room changes so the Pico-produced score stays visible.
            self.game_listener = game_ref.listen(
                lambda event: self.room_updated.emit(pin, event.data)
            )
            
            self.status_label.setText(f"🟢 接続完了!\nプレイヤー: {self.player_name} 選手")
            self.status_label.setStyleSheet("color: #2ecc71; font-size: 16px; font-weight: bold;")
            self.pin_input.setEnabled(False)  # Prevent changing the code while connected.
            self.connect_btn.setText("切断")
            self.connect_btn.clicked.disconnect()
            self.connect_btn.clicked.connect(self.disconnect_player)
        except Exception as error:
            print("Firebase connection error:", error)
            self.status_label.setText("❌ Firebaseへの接続に失敗しました")
            self.status_label.setStyleSheet("color: #e74c3c; font-size: 13px; font-weight: bold;")

    def handle_room_update(self, pin, game_data):
        if pin != self.connected_pin:
            return

        if not isinstance(game_data, dict):
            self.disconnect_player()
            self.status_label.setText("⚠️ The game has ended on the web page.")
            self.status_label.setStyleSheet("color: #e67e22; font-size: 13px; font-weight: bold;")
            return

        self.player_name = game_data.get('name', self.player_name)
        self.score_label.setText(f"Score: {game_data.get('score', 0)}")

    # Disconnect from the player and restore the initial interface state.
    def disconnect_player(self):
        if self.game_listener is not None:
            self.game_listener.close()
            self.game_listener = None

        self.connected_pin = None
        self.player_name = ""
        self.status_label.setText('プレイヤー未接続\n(スマホのQRコードからルームコードを取得してください)')
        self.status_label.setStyleSheet("font-size: 14px; font-weight: bold; color: #7f8c8d; margin: 15px 0;")
        self.score_label.setVisible(False)
        self.pin_input.setEnabled(True)
        self.pin_input.clear()
        self.connect_btn.setText("接続")
        self.connect_btn.clicked.disconnect()
        self.connect_btn.clicked.connect(self.connect_to_player)

    def closeEvent(self, event):
        if self.game_listener is not None:
            self.game_listener.close()
            self.game_listener = None
        super().closeEvent(event)

if __name__ == '__main__':
    app = QApplication(sys.argv)
    ex = LaserGameApp()
    ex.show()
    sys.exit(app.exec_())
