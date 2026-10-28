# DengueCare AI: Urban Dengue Surveillance, Forecasting and Early Warning System

DengueCare AI is a professional urban dengue surveillance system designed for government health authorities. It consists of two main portals: a **User Portal** for data submission by healthcare providers and a **Government Admin Portal** for advanced analytics and resource planning.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)

### Installation

1. **Frontend Setup**
   ```bash
   npm install
   ```

2. **Backend Setup**
   ```bash
   cd api
   pip install -r requirements.txt
   ```

### Running the Application

1. **Start Backend API** (Run from root)
   ```bash
   python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Start Frontend Dev Server** (Run from root)
   ```bash
   npm run dev
   ```

3. Open your browser at `http://localhost:5173`

## 📁 Project Structure

- `src/`: Frontend React source code
  - `pages/`: Portal pages (Landing, User, Admin)
  - `components/`: Reusable UI components
  - `api/`: API client for backend communication
- `api/`: Backend FastAPI source code
  - `routes/`: API endpoints (Submissions, Analytics)
  - `models/`: Database schemas (SQLAlchemy)
  - `data/`: SQLite database storage
- `uploads/`: Storage for uploaded surveillance files
- `.trae/documents/`: PRD and Technical Architecture

## 📊 Features

- **User Portal**: Organization metadata entry, Excel/CSV upload with client-side validation, submission history tracking.
- **Admin Portal**: 
  - **Overview Dashboard**: Key metrics and trend visualizations.
  - **Submission Management**: Review workflow (Approve/Reject/Correction).
  - **Dengue Forecast**: AI-driven 4-week case predictions.
  - **Hotspot Analysis**: Geographic risk detection.
  - **Weather Analysis**: Climate-dengue correlation.
  - **Model Performance**: Walk-forward back-test metrics and feature importance.
  - **Data Explorer**: Searchable record browser with CSV export.
  - **Audit Log**: Immutable record of system actions.

## 🧪 Loading Surveillance Data

`dengue_surveillance_dataset.csv` in the root directory is the dataset used by this
prototype. Upload it in the User Portal and approve it from the Admin Portal to
populate every analytics view.

Its columns match the upload template exactly:
`report_date, district, locality, reported_dengue_cases, suspected_cases,
confirmed_cases, hospital_visits, hospital_admissions, rainfall, temperature,
humidity, population`

### Data provenance

| Field | Source |
| --- | --- |
| `reported_dengue_cases` | [OpenDengue v1.3](https://figshare.com/articles/dataset/OpenDengue_dengue_surveillance_data/24238383) weekly country data (CC BY 4.0) — Colombia, 22 municipalities, 26 ISO weeks of 2019 |
| `population` | Wikidata `P1082` (DANE census projections); three gaps filled from the DANE projections cited on Spanish Wikipedia |
| `rainfall`, `temperature`, `humidity` | Open-Meteo ERA5 reanalysis archive, aggregated to weekly means per municipality |
| `confirmed_cases`, `suspected_cases`, `hospital_visits`, `hospital_admissions` | Derived from the reported series using the published 2019 proportions in the Colombian INS dengue report (50.5% laboratory-confirmed, 50.7% with warning signs, 41.8% hospitalised) |

Reported cases, population and weather are measured values. The four clinical
columns are labelled derivations, because no open dataset publishes them at
municipality-week granularity.

---
*Note: This is an academic prototype. The analytics run on the real surveillance
records listed above; nothing in the dashboard is randomised or hardcoded.*
