import sys
from pathlib import Path

import pytest


SERVER_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SERVER_DIR))

import auth_db


import tempfile

@pytest.fixture(autouse=True)
def isolated_database(monkeypatch):
    with tempfile.TemporaryDirectory() as tmp_dir:
        monkeypatch.setattr(auth_db, "DB_PATH", Path(tmp_dir) / "users.db")
        auth_db.init_db()
        yield


def test_user_session_lifecycle():
    user_id = auth_db.create_user("counsel@example.com", "secure-password")
    assert isinstance(user_id, int)

    token = auth_db.create_session(user_id)
    assert auth_db.validate_session(token) == user_id
    assert auth_db.get_user(user_id) == {"id": user_id, "username": "counsel@example.com"}


def test_user_chats_are_scoped_to_the_owner():
    owner_id = auth_db.create_user("owner@example.com", "secure-password")
    other_id = auth_db.create_user("other@example.com", "secure-password")

    assert auth_db.save_chat("chat-1", owner_id, "Research", [{"role": "user", "content": "test"}])
    assert len(auth_db.get_user_chats(owner_id)) == 1
    assert auth_db.get_user_chats(other_id) == []
    assert auth_db.get_chat("chat-1", other_id) is None
