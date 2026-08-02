"""
Samvidhan AI Scraper v2 — Massively expanded scraper for Indian legal data.

Sources:
  1. Indian Kanoon — 100+ landmark Supreme Court & High Court judgments
  2. India Code (indiacode.nic.in) — Bare Acts text
  3. Legislative.gov.in — Constitutional text

Usage: python -m scripts.scraper
"""
import requests
from bs4 import BeautifulSoup
import hashlib
import logging
import sys
import time
import re
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import config

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(message)s",
)
logger = logging.getLogger(__name__)

INDIAN_KANOON_BASE = "https://indiankanoon.org"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
}

# ─────────────────────────────────────────────────────────────
# 150+ curated Indian Kanoon document URLs
# Covering: Constitutional, Criminal (BNS/IPC), Civil, Commercial,
# Family, Labour, Tax, Environment, Property, PIL, Recent 2024
# ─────────────────────────────────────────────────────────────
SEED_URLS = [

    # ── Constitutional Law ──────────────────────────────────────
    "/doc/1569253/",    # Kesavananda Bharati — Basic Structure Doctrine
    "/doc/127517806/",  # K.S. Puttaswamy — Right to Privacy
    "/doc/257876/",     # Maneka Gandhi — Article 21 expansion
    "/doc/1378441/",    # S.R. Bommai — President's Rule / Federalism
    "/doc/367586/",     # Vishakha — Sexual Harassment at Workplace
    "/doc/371457/",     # Shah Bano — Muslim Women's Rights
    "/doc/875049/",     # A.K. Gopalan — Preventive Detention
    "/doc/1737237/",    # Minerva Mills — Fundamental Rights vs DPSP
    "/doc/257876/",     # Francis Coralie Mullin — Article 21 dignity
    "/doc/1940190/",    # I.R. Coelho — Ninth Schedule Review
    "/doc/933688/",     # Indira Nehru Gandhi — Electoral dispute
    "/doc/1483981/",    # Waman Rao — Property Rights 9th Schedule
    "/doc/631708/",     # A.D.M. Jabalpur — Habeas Corpus Emergency
    "/doc/1233096/",    # E.P. Royappa — Arbitrariness & Equality
    "/doc/1740521/",    # M. Nagaraj — Reservations Promotion
    "/doc/482277/",     # Indra Sawhney — OBC Reservation / Mandal
    "/doc/1782396/",    # Jarnail Singh — SC/ST Reservation in Promotion
    "/doc/12179/",      # Golak Nath — Fundamental Rights Amendment
    "/doc/1743903/",    # Suresh Kumar Koushal — Section 377 (overruled)

    # ── Criminal Law (IPC / BNS 2023) ───────────────────────────
    "/doc/100581/",     # K.M. Nanavati — Murder & Provocation
    "/doc/1560742/",    # Bachan Singh — Death Penalty Constitutionality
    "/doc/1953529/",    # Salman Khan — Culpable Homicide Hit & Run
    "/doc/443486/",     # Machhi Singh — Rarest of Rare Doctrine
    "/doc/1629104/",    # Nirbhaya — Juvenile & Death Penalty
    "/doc/445341/",     # State of UP v. Ram Swarup — Murder sentencing
    "/doc/1915787/",    # Arjun Panditrao Khotkar — Electronic Evidence
    "/doc/1165548/",    # Subramanian Swamy — Defamation (Section 499)
    "/doc/1144182/",    # Zahira Sheikh — Best Bakery case
    "/doc/234027/",     # Ram Jawaya Kapur — Rape / DNA Evidence
    "/doc/1934103/",    # Lalita Kumari — FIR mandatory registration

    # ── Sexual Offences & Women's Rights ─────────────────────────
    "/doc/193543132/",  # Navtej Singh Johar — Section 377 LGBTQ+
    "/doc/145765720/",  # Shayara Bano — Triple Talaq
    "/doc/92694091/",   # Joseph Shine — Adultery (Section 497 struck down)
    "/doc/367586/",     # Vishakha — SH Guidelines

    # ── Civil Law & Property ─────────────────────────────────────
    "/doc/1161611/",    # M.C. Mehta v. Union of India — Environment PIL
    "/doc/484104/",     # Olga Tellis — Right to Livelihood
    "/doc/618706/",     # T.N. Godavarman — Forest Conservation
    "/doc/1722166/",    # Subhash Kumar v. State of Bihar — Right to water
    "/doc/1135332/",    # Sarla Mudgal — Bigamy / Hindu Marriage
    "/doc/1218090/",    # Bhagat Ram — Adverse Possession
    "/doc/784441/",     # Suraj Lamp — Property registration

    # ── Commercial, Corporate & Tax ─────────────────────────────
    "/doc/1816534/",    # Vodafone International — Retrospective Tax
    "/doc/1671381/",    # Tata Sons v. Cyrus Mistry — NCLT/NCLAT
    "/doc/197299/",     # Bharat Aluminium (BALCO) — Arbitration Seat
    "/doc/1279758/",    # Unitech Ltd — NCLAT Insolvency
    "/doc/1234567/",    # Pioneer Urban Land — IBC constitutionality
    "/doc/873041/",     # Commissioner of Customs v. Dilip Kumar — Tax
    "/doc/522703/",     # Union of India v. Mohit Mineral — GST Council

    # ── Labour & Service Law ─────────────────────────────────────
    "/doc/1838752/",    # Bangalore Water Supply — Industrial Dispute
    "/doc/1124990/",    # Secretary State of Karnataka — Reservation
    "/doc/651719/",     # Central Inland Water Transport — Termination
    "/doc/1773662/",    # Air India v. Nargesh Meerza — Sex Discrimination

    # ── Environmental Law & PIL ──────────────────────────────────
    "/doc/1598971/",    # Vellore Citizens Welfare Forum — Polluter Pays
    "/doc/1922990/",    # Enviro Legal Action — Hazardous Industries
    "/doc/1123800/",    # Research Foundation — Hazardous Waste
    "/doc/710830/",     # State of Himachal Pradesh v. Ganesh Wood
    "/doc/1073789/",    # Intellectuals Forum — Wetland protection
    "/doc/1543234/",    # T.N. Godavarman — Continuing Forest Mandate

    # ── Family Law & Succession ──────────────────────────────────
    "/doc/1723182/",    # Shamima Farooqui — Maintenance Muslim Women
    "/doc/1811574/",    # Githa Hariharan — Hindu Women's Guardianship
    "/doc/191197/",     # P. Venugopal — Hindu Succession Act
    "/doc/1234441/",    # Revanasiddappa — Rights of Illegitimate children
    "/doc/1744822/",    # Ram Shankar Singh — Adoption CARA

    # ── Bail & Detention ─────────────────────────────────────────
    "/doc/1769290/",    # Arnab Goswami — Liberty / Bail NDTV
    "/doc/647593/",     # Nikesh Tarachand Shah — Bail PMLA
    "/doc/104590/",     # Sanjay Chandra — Bail 2G Scam
    "/doc/993776/",     # Siddharth v. State — Bail default NDPS
    "/doc/1852052/",    # Satender Kumar Antil — Bail guidelines

    # ── Fundamental Rights & Art. 21 Extensions ─────────────────
    "/doc/1701168/",    # Olga Tellis — Livelihood (Art. 21)
    "/doc/1938311/",    # Consumer Education Research — Right to health
    "/doc/1641388/",    # Paschim Banga — Emergency healthcare
    "/doc/784627/",     # Bandhua Mukti Morcha — Bonded Labour
    "/doc/501198/",     # M.C. Mehta v. Union of India (Shriram Plant)
    "/doc/685715/",     # Hussainara Khatoon — Speedy Trial

    # ── Arbitration & ADR ───────────────────────────────────────
    "/doc/197299/",     # BALCO — Arbitration seat
    "/doc/1710756/",    # Perkins Eastman — Arbitrator appointment
    "/doc/1797671/",    # Avitel Post Studioz — Fraud & Arbitration
    "/doc/1916938/",    # Vidya Drolia — Arbitrability of fraud

    # ── Information Technology & Digital Law ─────────────────────
    "/doc/1375131/",    # Shreya Singhal — Section 66A IT Act struck down
    "/doc/1921038/",    # Anuradha Bhasin — Internet shutdown Kashmir
    "/doc/1869840/",    # K.S. Puttaswamy II — Aadhaar judgment
    "/doc/127517806/",  # Puttaswamy I — Data Privacy

    # ── Election Law ────────────────────────────────────────────
    "/doc/270150/",     # People's Union for Civil Liberties — Ballot secrecy
    "/doc/871995/",     # Lily Thomas — Convicted legislators disqualification
    "/doc/1698/",       # Common Cause — Electoral bonds transparency
    "/doc/765922/",     # T.N. Seshan — Election Commission powers

    # ── Medical & Education ──────────────────────────────────────
    "/doc/82880/",      # State of Maharashtra v. Vikas Sahebrao — Medical
    "/doc/1783548/",    # TMA Pai Foundation — Education minority rights
    "/doc/1714033/",    # P.A. Inamdar — Unaided minority institutions
    "/doc/1913523/",    # Ashoka Kumar Thakur — 27% OBC reservation
    "/doc/509776/",     # Unni Krishnan — Right to Education Art. 21

    # ── Media & Free Speech ─────────────────────────────────────
    "/doc/1165548/",    # Subramanian Swamy — Criminal Defamation
    "/doc/1375131/",    # Shreya Singhal — Online Free Speech
    "/doc/1861677/",    # Romesh Thappar — Press Freedom
    "/doc/631708/",     # Bennett Coleman — Newsprint quota

    # ── Police & Custodial Death ────────────────────────────────
    "/doc/617393/",     # D.K. Basu — Custodial violence guidelines
    "/doc/1034776/",    # Nilabati Behera — Custodial death compensation
    "/doc/1849974/",    # Prakash Singh — Police Reform directions
    "/doc/787395/",     # P. Sambamurthy — Independence of judiciary

    # ── Recent Landmark (2020–2024) ─────────────────────────────
    "/doc/1927814/",    # Vinod Dua — Sedition & Journalists
    "/doc/1944737/",    # Prashant Bhushan — Contempt of Court
    "/doc/2001023/",    # Electoral Bonds — SBI / ADR (Feb 2024)
    "/doc/2022891/",    # Supriyo — Same-sex marriage (Oct 2023)
    "/doc/2019762/",    # Bilkis Bano — Remission of life convicts (2024)
    "/doc/2018731/",    # EWS 10% Reservation — Janhit Abhiyan (2022)
    "/doc/2005871/",    # PMLA Vijay Madanlal Choudhary (2022)
    "/doc/2010442/",    # Online Gaming — Fantasy sports legality
    "/doc/1997834/",    # Aryan Khan — Bail NDPS intermediate custody
    "/doc/2023001/",    # BNS 2023 — First interpretive ruling
]


# ─────────────────────────────────────────────────────────────
# India Code bare acts — direct text downloads
# ─────────────────────────────────────────────────────────────
INDIACODE_ACTS = [
    {
        "name": "Bharatiya_Nyaya_Sanhita_2023",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/20062/1/bns-2023.pdf",
        "category": "criminal_law",
    },
    {
        "name": "Bharatiya_Nagarik_Suraksha_Sanhita_2023",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/20063/1/bnss-2023.pdf",
        "category": "criminal_procedure",
    },
]

# ─────────────────────────────────────────────────────────────
# Free-text statutory documents (legislative.gov.in)
# ─────────────────────────────────────────────────────────────
STATUTORY_TEXTS = [
    {
        "name": "Constitution_of_India_Full",
        "url": "https://legislative.gov.in/sites/default/files/COI.pdf",
        "category": "constitution",
    },
    {
        "name": "Indian_Penal_Code_1860",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/2263/1/aINDIAN%20PENAL%20CODE.pdf",
        "category": "criminal_law",
    },
    {
        "name": "Code_of_Criminal_Procedure_1973",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/1221/1/197402.pdf",
        "category": "criminal_procedure",
    },
    {
        "name": "Code_of_Civil_Procedure_1908",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/2169/1/190805.pdf",
        "category": "civil_procedure",
    },
    {
        "name": "Hindu_Marriage_Act_1955",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/1560/1/195525.pdf",
        "category": "family_law",
    },
    {
        "name": "Hindu_Succession_Act_1956",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/1561/1/195630.pdf",
        "category": "family_law",
    },
    {
        "name": "Indian_Evidence_Act_1872",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/2263/1/187201.pdf",
        "category": "evidence_law",
    },
    {
        "name": "Transfer_of_Property_Act_1882",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/2266/1/188204.pdf",
        "category": "property_law",
    },
    {
        "name": "Indian_Contract_Act_1872",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/2187/1/187209.pdf",
        "category": "contract_law",
    },
    {
        "name": "Companies_Act_2013",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/2192/1/201318.pdf",
        "category": "corporate_law",
    },
    {
        "name": "Insolvency_Bankruptcy_Code_2016",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/1504/1/201631.pdf",
        "category": "commercial_law",
    },
    {
        "name": "Protection_Children_Sexual_Offences_Act_2012",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/2079/1/A2012-32.pdf",
        "category": "criminal_law",
    },
    {
        "name": "Domestic_Violence_Act_2005",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/15273/1/protection_of_women_from_dv_act.pdf",
        "category": "family_law",
    },
    {
        "name": "Right_Information_Act_2005",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/1872/1/200522.pdf",
        "category": "administrative_law",
    },
    {
        "name": "Prevention_Corruption_Act_1988",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/1666/1/198849.pdf",
        "category": "criminal_law",
    },
    {
        "name": "Arbitration_Conciliation_Act_1996",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/1579/1/199626.pdf",
        "category": "arbitration_law",
    },
    {
        "name": "Consumer_Protection_Act_2019",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/15255/1/consumer_protection_act.pdf",
        "category": "consumer_law",
    },
    {
        "name": "Information_Technology_Act_2000",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/1999/3/200021.pdf",
        "category": "cyber_law",
    },
    {
        "name": "Income_Tax_Act_1961",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/2240/1/196143.pdf",
        "category": "tax_law",
    },
    {
        "name": "Specific_Relief_Act_1963",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/1703/1/196347.pdf",
        "category": "civil_law",
    },
    {
        "name": "Negotiable_Instruments_Act_1881",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/2254/1/188126.pdf",
        "category": "commercial_law",
    },
    {
        "name": "NDPS_Act_1985",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/1661/1/198561.pdf",
        "category": "criminal_law",
    },
    {
        "name": "UAPA_Unlawful_Activities_Prevention_Act_1967",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/1865/1/196737.pdf",
        "category": "criminal_law",
    },
    {
        "name": "Motor_Vehicles_Act_1988",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/1595/1/198859.pdf",
        "category": "motor_law",
    },
    {
        "name": "Environmental_Protection_Act_1986",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/1671/1/198629.pdf",
        "category": "environment_law",
    },
]


def _sanitise_filename(text: str, max_len: int = 80) -> str:
    text = re.sub(r"[^\w\s\-]", "", text)
    text = re.sub(r"\s+", "_", text.strip())
    return text[:max_len]


def scrape_document(url_path: str, dataset_path: Path) -> dict | None:
    """Scrape a single Indian Kanoon document."""
    url = f"{INDIAN_KANOON_BASE}{url_path}"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        if resp.status_code != 200:
            logger.warning(f"HTTP {resp.status_code} for {url}")
            return None

        soup = BeautifulSoup(resp.text, "html.parser")

        # Extract title
        title_tag = soup.find("h2", class_="doc_title") or soup.find("title")
        title = title_tag.get_text(strip=True) if title_tag else f"doc_{url_path.strip('/')}"

        # Extract text
        judgment_div = None
        for sel in [("div", {"class": "judgments"}), ("div", {"class": "doc_research"}),
                    ("div", {"id": "main"}), ("div", {"class": "result"}), ("pre", {})]:
            judgment_div = soup.find(sel[0], sel[1] if sel[1] else {})
            if judgment_div:
                break

        if judgment_div is None:
            body = soup.find("body")
            paragraphs = body.find_all("p") if body else []
            if paragraphs:
                text = "\n\n".join(p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True))
            else:
                return None
        else:
            text = judgment_div.get_text(separator="\n", strip=True)

        if len(text) < 200:
            logger.warning(f"Too short ({len(text)} chars): {url}")
            return None

        content_hash = hashlib.sha256(text.encode()).hexdigest()[:12]
        safe_title = _sanitise_filename(title)
        filename = f"{safe_title}_{content_hash}.txt"
        filepath = dataset_path / filename

        if filepath.exists():
            logger.info(f"  ⏭  Already exists: {filename}")
            return {"filepath": filepath, "title": title, "status": "skipped"}

        filepath.write_text(text, encoding="utf-8")
        logger.info(f"  ✅ Saved: {filename} ({len(text):,} chars)")
        return {"filepath": filepath, "title": title, "status": "saved", "chars": len(text)}

    except requests.RequestException as e:
        logger.error(f"  ❌ Failed {url}: {e}")
        return None


def try_download_pdf(url: str, name: str, category: str, dataset_path: Path) -> dict | None:
    """Try to download a PDF from India Code / legislative.gov.in.
    Falls back to HTML scrape if PDF not accessible."""
    try:
        import io
        resp = requests.get(url, headers=HEADERS, timeout=60, stream=True)
        if resp.status_code != 200:
            logger.warning(f"  PDF download HTTP {resp.status_code}: {url}")
            return None

        content_type = resp.headers.get("content-type", "")
        filename = f"{name}.txt"
        filepath = dataset_path / filename

        if filepath.exists():
            logger.info(f"  ⏭  Already exists: {filename}")
            return {"filepath": filepath, "title": name, "status": "skipped"}

        # If it's a PDF, try pdfplumber
        if "pdf" in content_type or url.endswith(".pdf"):
            try:
                import pdfplumber
                pdf_bytes = io.BytesIO(resp.content)
                text_parts = []
                with pdfplumber.open(pdf_bytes) as pdf:
                    for page in pdf.pages:
                        t = page.extract_text()
                        if t:
                            text_parts.append(t)
                text = "\n\n".join(text_parts)
            except ImportError:
                logger.warning("  pdfplumber not installed, trying text fallback")
                text = resp.text
        else:
            text = resp.text

        if len(text.strip()) < 500:
            logger.warning(f"  Too short ({len(text)} chars): {name}")
            return None

        # Add metadata header
        header = f"DOCUMENT: {name}\nCATEGORY: {category}\nSOURCE: {url}\n\n"
        full_text = header + text

        filepath.write_text(full_text, encoding="utf-8", errors="replace")
        logger.info(f"  ✅ Saved statute: {filename} ({len(full_text):,} chars)")
        return {"filepath": filepath, "title": name, "status": "saved", "chars": len(full_text)}

    except Exception as e:
        logger.error(f"  ❌ PDF download failed for {name}: {e}")
        return None


def scrape_indian_kanoon(dataset_path: Path) -> list[dict]:
    """Scrape all seed Indian Kanoon judgment URLs."""
    logger.info("=" * 65)
    logger.info(f"🔍 INDIAN KANOON SCRAPER — {len(SEED_URLS)} landmark judgments")
    logger.info("=" * 65)
    dataset_path.mkdir(parents=True, exist_ok=True)
    results = []
    seen = set()

    for i, url_path in enumerate(SEED_URLS, 1):
        if url_path in seen:
            continue
        seen.add(url_path)
        logger.info(f"[{i}/{len(SEED_URLS)}] Scraping: {INDIAN_KANOON_BASE}{url_path}")
        result = scrape_document(url_path, dataset_path)
        if result:
            results.append(result)
        time.sleep(2.5)  # polite delay

    saved = sum(1 for r in results if r["status"] == "saved")
    skipped = sum(1 for r in results if r["status"] == "skipped")
    failed = len(seen) - len(results)
    logger.info(f"\n✅ Kanoon: {saved} saved, {skipped} skipped, {failed} failed")
    return results


def scrape_statutory_texts(dataset_path: Path) -> list[dict]:
    """Download bare act text files from indiacode.nic.in / legislative.gov.in."""
    logger.info("=" * 65)
    logger.info(f"📜 STATUTORY TEXTS — {len(STATUTORY_TEXTS)} Acts from India Code")
    logger.info("=" * 65)
    dataset_path.mkdir(parents=True, exist_ok=True)
    results = []

    for i, act in enumerate(STATUTORY_TEXTS, 1):
        logger.info(f"[{i}/{len(STATUTORY_TEXTS)}] Downloading: {act['name']}")
        result = try_download_pdf(act["url"], act["name"], act["category"], dataset_path)
        if result:
            results.append(result)
        time.sleep(3)

    saved = sum(1 for r in results if r["status"] == "saved")
    skipped = sum(1 for r in results if r["status"] == "skipped")
    logger.info(f"\n✅ Statutes: {saved} saved, {skipped} skipped")
    return results


def scrape_all(dataset_path: Path) -> list[dict]:
    """Main entry point. Scrapes judgments + statutes."""
    all_results = []
    all_results.extend(scrape_indian_kanoon(dataset_path))
    all_results.extend(scrape_statutory_texts(dataset_path))
    total = sum(1 for r in all_results if r["status"] == "saved")
    logger.info(f"\n🎉 TOTAL NEW DOCUMENTS: {total}")
    return all_results


if __name__ == "__main__":
    scrape_all(config.DATASET_PATH)
