"""
Automated Test Suite for Samvidhan AI Pure Extractive Engine.
Tests RAG retrieval, multi-style synthesis archetypes, and API endpoints.
"""
import sys
from pathlib import Path

# Add server directory to path
SERVER_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SERVER_DIR))

import pytest
from fastapi.testclient import TestClient
from api import app, rag
import config


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health_check(client):
    """Verify system health and status."""
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "Extractive" in data["engine"]


def test_stats_endpoint(client):
    """Verify real stats endpoint returns corpus counts."""
    res = client.get("/stats")
    assert res.status_code == 200
    data = res.json()
    assert data["total_chunks"] >= 1000
    assert "Bharatiya Nyaya Sanhita, 2023 (BNS)" in data["statutes"]


def test_approach_config(client):
    """Verify zero-LLM extractive approach configuration."""
    res = client.get("/config/approach")
    assert res.status_code == 200
    assert res.json()["approach"] == "extractive"


def test_irac_problem_solving(client):
    """Test judicial hypothetical solving with Section 84 IPC."""
    query = (
        "Principle: Nothing is an offence which is done by a person who, at the time of doing it, "
        "by reason of unsoundness of mind, is incapable of knowing the nature of the act, or that he is doing "
        "what is either wrong or contrary to law (Section 84, Indian Penal Code).\n"
        "Facts: 'X', under the influence of severe delusions caused by a mental illness, believes that 'Y' is an alien entity "
        "sent to destroy the earth. To save humanity, 'X' kills 'Y', fully believing his actions are heroic. "
        "However, at the time of the act, 'X' knew that he was physically striking 'Y' with a weapon.\n"
        "Can 'X' claim the defense of legal insanity?"
    )
    res = client.post("/query", json={"query": query})
    assert res.status_code == 200
    data = res.json()
    answer = data["answer"]
    assert "verdict" in answer.lower()
    assert "Section 84" in answer or "Section 22" in answer


def test_comparative_transmutation(client):
    """Test IPC to BNS comparative matrix generation."""
    query = "What is the difference between Section 302 IPC and Section 103 BNS 2023?"
    res = client.post("/query", json={"query": query})
    assert res.status_code == 200
    data = res.json()
    assert "103" in data["answer"]


def test_devils_advocate_mode(client):
    """Test adversarial counter-arguments in Devil's Advocate mode."""
    query = "Is an accused entitled to statutory bail under Section 479 BNSS?"
    res = client.post("/query", json={"query": query, "devils_advocate": True})
    assert res.status_code == 200
    data = res.json()
    assert "Devil's Advocate" in data["answer"] or "Counter-Analysis" in data["answer"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
