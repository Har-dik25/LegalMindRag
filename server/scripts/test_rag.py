import logging
import requests
import config

logging.basicConfig(level=logging.INFO)

def test_api():
    queries = [
        "Principle: Nothing is an offence which is done by a person who, at the time of doing it, by reason of unsoundness of mind, is incapable of knowing the nature of the act, or that he is doing what is either wrong or contrary to law (Section 84, Indian Penal Code).Facts: 'X', under the influence of severe delusions caused by a mental illness, believes that 'Y' is an alien entity sent to destroy the earth. To save humanity, 'X' kills 'Y', fully believing his actions are heroic. However, at the time of the act, 'X' knew that he was physically striking 'Y' with a weapon.Can 'X' claim the defense of legal insanity?",
        "'Civil death' of a person may be legally presumed if they have not been heard of for how many years by those who would naturally have heard of them?",
        "What is Section 103 of BNS 2023?",
        "What is a Zero FIR under BNSS 2023?",
        "How does BSA 2023 treat WhatsApp messages as electronic evidence?",
    ]

    for q in queries:
        print("\n" + "="*80)
        print(f"QUESTION: {q}")
        print("="*80)
        resp = requests.post("http://127.0.0.1:8000/query", json={"query": q})
        if resp.status_code != 200:
            print(f"❌ Error {resp.status_code}: {resp.text}")
            continue
            
        data = resp.json()
        print("STATUS: 200 OK")
        print("TIME:", data["metrics"]["time"], "seconds")
        print("\n--- ⚡ AI OVERVIEW (DIRECT ANSWER) ---")
        print(data["answer"])
        print("\n--- 📚 GROUNDED SOURCES ---")
        for s in data["sources"][:3]:
            print(f"  • {s['title']} | Section: {s['section']} | Score: {s['score']}")

if __name__ == "__main__":
    test_api()
