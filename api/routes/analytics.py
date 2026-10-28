from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
import numpy as np
import pandas as pd

from api.database import get_db
from api.models.schemas import Submission, ApprovedData, AuditLog
from api.auth import require_admin

router = APIRouter(
    prefix="/api/admin",
    tags=["analytics"],
    dependencies=[Depends(require_admin)],
)

FORECAST_HORIZON = 4


# ---------------------------------------------------------------------------
# Data helpers
# ---------------------------------------------------------------------------

def _load_dataframe(db: Session) -> pd.DataFrame:
    """Load all approved surveillance records into a dataframe."""
    rows = db.query(ApprovedData).all()
    records = [
        {
            "report_date": r.report_date,
            "district": r.district or "Unknown",
            "locality": r.locality or "Unknown",
            "reported_cases": r.reported_cases or 0,
            "suspected_cases": r.suspected_cases or 0,
            "confirmed_cases": r.confirmed_cases or 0,
            "hospital_visits": r.hospital_visits or 0,
            "hospital_admissions": r.hospital_admissions or 0,
            "rainfall": float(r.rainfall) if r.rainfall is not None else np.nan,
            "temperature": float(r.temperature) if r.temperature is not None else np.nan,
            "humidity": float(r.humidity) if r.humidity is not None else np.nan,
            "population": r.population or 0,
        }
        for r in rows
    ]
    df = pd.DataFrame(records)
    if not df.empty:
        df["report_date"] = pd.to_datetime(df["report_date"])
        df = df.sort_values("report_date").reset_index(drop=True)
    return df


def _week_label(ts) -> str:
    iso = pd.Timestamp(ts).isocalendar()
    return f"W{int(iso.week):02d}"


def _weekly_frame(df: pd.DataFrame) -> pd.DataFrame:
    """Aggregate records into an ISO-week series (mean weather, summed cases)."""
    if df.empty:
        return pd.DataFrame(
            columns=["week_start", "week", "cases", "confirmed", "rainfall", "temperature", "humidity"]
        )
    d = df.copy()
    d["week_start"] = d["report_date"] - pd.to_timedelta(d["report_date"].dt.weekday, unit="D")
    grouped = (
        d.groupby("week_start")
        .agg(
            cases=("reported_cases", "sum"),
            confirmed=("confirmed_cases", "sum"),
            rainfall=("rainfall", "mean"),
            temperature=("temperature", "mean"),
            humidity=("humidity", "mean"),
        )
        .reset_index()
        .sort_values("week_start")
    )
    grouped["week"] = grouped["week_start"].apply(_week_label)
    return grouped.reset_index(drop=True)


def _fit_forecast(weekly: pd.DataFrame, horizon: int = FORECAST_HORIZON):
    """Fit a linear trend on the weekly case series. Returns None when data is insufficient."""
    if len(weekly) < 3 or weekly["cases"].sum() == 0:
        return None

    from sklearn.linear_model import LinearRegression

    y = weekly["cases"].to_numpy(dtype=float)
    x = np.arange(len(weekly)).reshape(-1, 1)
    model = LinearRegression().fit(x, y)

    fitted = np.clip(model.predict(x), 0, None)
    residual = y - fitted
    std = float(np.std(residual, ddof=1)) if len(weekly) > 1 else 0.0
    future_x = np.arange(len(weekly), len(weekly) + horizon).reshape(-1, 1)
    future = np.clip(model.predict(future_x), 0, None)
    r2 = float(model.score(x, y))

    return {
        "fitted": fitted,
        "future": future,
        "std": std,
        "r2": max(0.0, min(1.0, r2)),
        "model_name": "Linear Trend (least squares)",
    }


def _future_weeks(last_start, horizon: int = FORECAST_HORIZON):
    return [pd.Timestamp(last_start) + pd.Timedelta(weeks=i + 1) for i in range(horizon)]


def _risk_from_incidence(incidence):
    if incidence is None:
        return None
    if incidence >= 30:
        return "Critical"
    if incidence >= 15:
        return "High"
    if incidence >= 7:
        return "Moderate"
    return "Low"


_STATUS_BY_RISK = {
    "Critical": "Active Outbreak",
    "High": "Rising Trend",
    "Moderate": "Potential Signal",
    "Low": "Stable",
}


def _hotspot_areas(df: pd.DataFrame):
    """Rank districts by case load / incidence using only real approved data."""
    if df.empty:
        return []

    population_known = df["population"].sum() > 0
    latest_week = _weekly_frame(df)["week_start"].max() if not df.empty else None
    prev_week = (latest_week - pd.Timedelta(weeks=1)) if latest_week is not None else None

    def _week_cases(frame, week_start):
        if week_start is None or frame.empty:
            return {}
        d = frame.copy()
        d["week_start"] = d["report_date"] - pd.to_timedelta(d["report_date"].dt.weekday, unit="D")
        sel = d[d["week_start"] == week_start]
        return sel.groupby("district")["reported_cases"].sum().to_dict()

    current = _week_cases(df, latest_week)
    previous = _week_cases(df, prev_week)

    grouped = df.groupby("district").agg(
        cases=("reported_cases", "sum"),
        confirmed=("confirmed_cases", "sum"),
        localities=("locality", "nunique"),
    ).reset_index()

    # A locality appears once per reporting week, so its population must be
    # counted a single time per district -- not summed across its weekly rows.
    district_population = (
        df.groupby(["district", "locality"])["population"]
        .max()
        .groupby("district")
        .sum()
    )

    max_cases = grouped["cases"].max() or 1
    areas = []
    for _, row in grouped.iterrows():
        cases = int(row["cases"])
        population = int(district_population.get(row["district"], 0))
        incidence = round(cases / population * 10000, 1) if population_known and population > 0 else None

        if incidence is not None:
            risk = _risk_from_incidence(incidence)
        else:
            ratio = cases / max_cases
            risk = "Critical" if ratio >= 0.75 else "High" if ratio >= 0.5 else "Moderate" if ratio >= 0.25 else "Low"

        cur = int(current.get(row["district"], 0))
        prev = int(previous.get(row["district"], 0))
        trend = round((cur - prev) / prev * 100, 1) if prev > 0 else None

        areas.append({
            "district": row["district"],
            "cases": cases,
            "confirmed": int(row["confirmed"]),
            "population": population if population_known else None,
            "localities": int(row["localities"]),
            "incidence": incidence,
            "currentWeekCases": cur,
            "previousWeekCases": prev,
            "trend": trend,
            "risk": risk,
            "status": _STATUS_BY_RISK.get(risk, "Stable"),
        })

    areas.sort(key=lambda a: (a["incidence"] if a["incidence"] is not None else a["cases"]), reverse=True)
    return areas


def _latest_week_start(df: pd.DataFrame):
    if df.empty:
        return None
    weekly = _weekly_frame(df)
    return weekly["week_start"].max() if not weekly.empty else None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/dashboard")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    df = _load_dataframe(db)
    weekly = _weekly_frame(df)
    model = _fit_forecast(weekly)
    areas = _hotspot_areas(df)

    reported_cases = int(df["reported_cases"].sum()) if not df.empty else 0
    confirmed_cases = int(df["confirmed_cases"].sum()) if not df.empty else 0

    trend = []
    if not weekly.empty:
        for i, row in weekly.iterrows():
            trend.append({
                "week": row["week"],
                "cases": int(row["cases"]),
                "forecast": int(round(model["fitted"][i])) if model is not None else None,
            })
        if model is not None:
            for i, week_start in enumerate(_future_weeks(weekly["week_start"].max())):
                trend.append({
                    "week": _week_label(week_start),
                    "cases": None,
                    "forecast": int(round(model["future"][i])),
                })

    district_distribution = []
    if not df.empty:
        dist = df.groupby("district")["reported_cases"].sum().sort_values(ascending=False)
        district_distribution = [{"name": name, "cases": int(cases)} for name, cases in dist.items()]

    alerts = [
        {
            "area": a["district"],
            "risk": a["risk"],
            "cases": a["cases"],
            "trend": a["trend"],
        }
        for a in areas
        if a["risk"] in ("Critical", "High")
    ][:3]

    recent_activity = [
        {
            "action": log.action,
            "actor": log.actor,
            "submission_id": log.submission_id,
            "details": log.details,
            "timestamp": log.timestamp,
        }
        for log in db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(5).all()
    ]

    forecasted_cases = int(round(model["future"][0])) if model is not None else 0

    return {
        "totalSubmissions": db.query(Submission).count(),
        "pendingReviews": db.query(Submission).filter(Submission.status == "pending").count(),
        "approvedSubmissions": db.query(Submission).filter(Submission.status == "approved").count(),
        "rejectedSubmissions": db.query(Submission).filter(Submission.status == "rejected").count(),
        "reportedCases": reported_cases,
        "confirmedCases": confirmed_cases,
        "affectedDistricts": int(df["district"].nunique()) if not df.empty else 0,
        "totalRecords": int(len(df)),
        "forecastedCases": forecasted_cases,
        "hotspots": len(alerts),
        "lastUpdated": df["report_date"].max().strftime("%Y-%m-%d") if not df.empty else None,
        "hasData": not df.empty,
        "trend": trend,
        "districtDistribution": district_distribution,
        "alerts": alerts,
        "recentActivity": recent_activity,
    }


@router.get("/forecast")
async def get_forecast(db: Session = Depends(get_db)):
    df = _load_dataframe(db)
    weekly = _weekly_frame(df)
    model = _fit_forecast(weekly)

    if model is None:
        return {
            "sufficient": False,
            "message": "At least 3 weeks of approved records are required to generate a forecast.",
            "series": [],
            "horizonWeeks": FORECAST_HORIZON,
            "confidence": 0,
        }

    series = []
    for i, row in weekly.iterrows():
        series.append({
            "week": row["week"],
            "actual": int(row["cases"]),
            "predicted": int(round(model["fitted"][i])),
            "lower": None,
            "upper": None,
        })

    future_weeks = _future_weeks(weekly["week_start"].max())
    for i, week_start in enumerate(future_weeks):
        predicted = float(model["future"][i])
        margin = 1.96 * model["std"]
        series.append({
            "week": _week_label(week_start),
            "actual": None,
            "predicted": int(round(predicted)),
            "lower": int(round(max(0, predicted - margin))),
            "upper": int(round(predicted + margin)),
        })

    next_week = int(round(model["future"][0]))
    current_week = int(weekly["cases"].iloc[-1])
    change_pct = round((next_week - current_week) / current_week * 100, 1) if current_week else None
    peak_index = int(np.argmax(model["future"]))

    return {
        "sufficient": True,
        "message": None,
        "horizonWeeks": FORECAST_HORIZON,
        "modelName": model["model_name"],
        "confidence": round(model["r2"] * 100),
        "basedOnWeek": weekly["week"].iloc[-1],
        "nextWeekPrediction": next_week,
        "currentWeekCases": current_week,
        "changePct": change_pct,
        "peakWeek": _week_label(future_weeks[peak_index]),
        "peakValue": int(round(model["future"][peak_index])),
        "series": series,
    }


@router.get("/hotspots")
async def get_hotspots(db: Session = Depends(get_db)):
    df = _load_dataframe(db)
    areas = _hotspot_areas(df)
    counts = {"Critical": 0, "High": 0, "Moderate": 0, "Low": 0}
    for area in areas:
        counts[area["risk"]] = counts.get(area["risk"], 0) + 1

    return {
        "sufficient": len(areas) > 0,
        "areas": areas,
        "counts": counts,
        "maxCases": max((a["cases"] for a in areas), default=0),
        "incidenceAvailable": bool(df["population"].sum() > 0) if not df.empty else False,
        "latestWeek": _week_label(_latest_week_start(df)) if _latest_week_start(df) is not None else None,
    }


@router.get("/weather")
async def get_weather_analysis(db: Session = Depends(get_db)):
    df = _load_dataframe(db)
    weekly = _weekly_frame(df)

    # Need several weeks with weather readings to compute a meaningful correlation.
    weather = weekly.dropna(subset=["rainfall", "temperature", "humidity"]) if not weekly.empty else weekly
    if len(weather) < 3:
        return {
            "sufficient": False,
            "message": "At least 3 weeks containing weather readings are required for correlation analysis.",
            "weeks": int(len(weather)),
        }

    def _corr(col):
        series = weather[["cases", col]].dropna()
        if len(series) < 3 or series[col].nunique() < 2 or series["cases"].nunique() < 2:
            return None
        return round(float(series[col].corr(series["cases"])), 2)

    lag_correlations = []
    for lag in range(0, 5):
        shifted = weekly.copy()
        shifted["lagged"] = shifted["rainfall"].shift(lag)
        pair = shifted[["cases", "lagged"]].dropna()
        r = None
        if len(pair) >= 3 and pair["lagged"].nunique() > 1 and pair["cases"].nunique() > 1:
            r = round(float(pair["lagged"].corr(pair["cases"])), 2)
        lag_correlations.append({"lag": lag, "label": "Same week" if lag == 0 else f"{lag}w delay", "r": r})

    valid_lags = [l for l in lag_correlations if l["r"] is not None]
    best_lag = max(valid_lags, key=lambda l: l["r"]) if valid_lags else None

    return {
        "sufficient": True,
        "message": None,
        "weeks": int(len(weather)),
        "rainfallCorrelation": _corr("rainfall"),
        "temperatureCorrelation": _corr("temperature"),
        "humidityCorrelation": _corr("humidity"),
        "bestLag": best_lag,
        "lagCorrelations": lag_correlations,
        "scatter": [
            {"rainfall": float(r["rainfall"]), "temperature": float(r["temperature"]), "cases": int(r["cases"])}
            for _, r in weather.iterrows()
        ],
        "series": [
            {
                "week": r["week"],
                "rainfall": round(float(r["rainfall"]), 1),
                "temperature": round(float(r["temperature"]), 1),
                "cases": int(r["cases"]),
            }
            for _, r in weather.iterrows()
        ],
    }


@router.get("/model-performance")
async def get_model_performance(db: Session = Depends(get_db)):
    df = _load_dataframe(db)
    weekly = _weekly_frame(df)

    # Enough weekly history to hold back at least two points for scoring.
    MIN_WEEKS = 5
    if len(weekly) < MIN_WEEKS or weekly["cases"].sum() == 0:
        return {
            "sufficient": False,
            "message": f"At least {MIN_WEEKS} weeks of approved records are required to back-test the model.",
            "trainedOn": int(len(weekly)),
        }

    feature_labels = {
        "lag1": "Cases (1w lag)",
        "lag2": "Cases (2w lag)",
        "rolling2": "2w Rolling Mean",
        "rainfall": "Rainfall",
        "temperature": "Avg Temperature",
        "humidity": "Humidity",
    }

    features = weekly.copy()
    features["lag1"] = features["cases"].shift(1)
    feature_cols = ["lag1"]

    # Only add longer memory when there is enough history to keep a usable sample.
    if len(weekly) >= 8:
        features["lag2"] = features["cases"].shift(2)
        features["rolling2"] = features["cases"].shift(1).rolling(2).mean()
        feature_cols += ["lag2", "rolling2"]

    # Use whichever weather columns actually carry readings.
    for col in ("rainfall", "temperature", "humidity"):
        if features[col].notna().any():
            feature_cols.append(col)

    model_frame = features.dropna(subset=feature_cols).reset_index(drop=True)
    if len(model_frame) < 4:
        return {
            "sufficient": False,
            "message": "Not enough consecutive weekly records to back-test the model.",
            "trainedOn": int(len(model_frame)),
        }

    from sklearn.ensemble import RandomForestRegressor
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

    # Expanding-window (walk-forward) back-test: every week is predicted using only
    # the weeks that came before it, so the metrics are genuinely out-of-sample and
    # remain valid even on a short history.
    min_train = max(2, int(round(len(model_frame) * 0.6)))
    if len(model_frame) - min_train < 2:
        min_train = max(2, len(model_frame) - 2)

    actuals, predictions = [], []
    for i in range(min_train, len(model_frame)):
        train = model_frame.iloc[:i]
        test = model_frame.iloc[i : i + 1]
        forest = RandomForestRegressor(n_estimators=200, random_state=42)
        forest.fit(train[feature_cols], train["cases"])
        predictions.append(float(forest.predict(test[feature_cols])[0]))
        actuals.append(float(test["cases"].iloc[0]))

    actuals = np.array(actuals)
    predictions = np.array(predictions)

    mae = float(mean_absolute_error(actuals, predictions))
    rmse = float(np.sqrt(mean_squared_error(actuals, predictions)))
    # R² needs a few scored points to be meaningful; report it only then.
    r2 = round(max(-1.0, min(1.0, float(r2_score(actuals, predictions)))), 2) if len(actuals) >= 3 else None
    non_zero = np.where(actuals == 0, np.nan, actuals)
    mape = (
        float(np.nanmean(np.abs((actuals - predictions) / non_zero)) * 100)
        if np.any(~np.isnan(non_zero))
        else 0.0
    )

    # Feature importance comes from a model fitted on the full available history.
    final_model = RandomForestRegressor(n_estimators=200, random_state=42)
    final_model.fit(model_frame[feature_cols], model_frame["cases"])
    importance = sorted(
        (
            {"name": feature_labels.get(col, col), "score": round(float(score), 3)}
            for col, score in zip(feature_cols, final_model.feature_importances_)
        ),
        key=lambda item: item["score"],
        reverse=True,
    )

    return {
        "sufficient": True,
        "message": None,
        "modelName": "Random Forest Regressor",
        "trainedOn": int(len(weekly)),
        "testSize": int(len(actuals)),
        "metrics": {
            "mae": round(mae, 1),
            "rmse": round(rmse, 1),
            "r2": r2,
            "mape": round(mape, 1),
        },
        "featureImportance": importance,
        "lastTrained": pd.Timestamp.now().strftime("%Y-%m-%d"),
        "smallSample": len(weekly) < 8,
    }


@router.get("/data-explorer")
async def get_data_explorer(
    search: str = "",
    district: str = "",
    page: int = Query(1, ge=1),
    pageSize: int = Query(15, ge=1, le=200),
    db: Session = Depends(get_db),
):
    df = _load_dataframe(db)
    all_districts = sorted(df["district"].dropna().unique().tolist()) if not df.empty else []

    if not df.empty:
        if search:
            needle = search.strip().lower()
            mask = (
                df["locality"].fillna("").str.lower().str.contains(needle, regex=False)
                | df["district"].fillna("").str.lower().str.contains(needle, regex=False)
            )
            df = df[mask]
        if district:
            df = df[df["district"] == district]

    df = df.sort_values("report_date", ascending=False)
    total = int(len(df))
    pages = max(1, int(np.ceil(total / pageSize)))
    page = min(page, pages)
    start = (page - 1) * pageSize
    window = df.iloc[start:start + pageSize]

    items = [
        {
            "report_date": r["report_date"].strftime("%Y-%m-%d"),
            "district": r["district"],
            "locality": r["locality"],
            "reported_cases": int(r["reported_cases"]),
            "confirmed_cases": int(r["confirmed_cases"]),
            "hospital_visits": int(r["hospital_visits"]),
            "rainfall": round(float(r["rainfall"]), 1) if pd.notna(r["rainfall"]) else None,
            "temperature": round(float(r["temperature"]), 1) if pd.notna(r["temperature"]) else None,
            "humidity": round(float(r["humidity"]), 1) if pd.notna(r["humidity"]) else None,
        }
        for _, r in window.iterrows()
    ]

    return {
        "items": items,
        "total": total,
        "page": page,
        "pageSize": pageSize,
        "pages": pages,
        "districts": all_districts,
        "hasData": total > 0,
    }


@router.get("/data-explorer/export")
async def export_data_explorer(db: Session = Depends(get_db)):
    df = _load_dataframe(db)
    if df.empty:
        return Response(content="No approved data available.", media_type="text/plain")

    export = df.copy()
    export["report_date"] = export["report_date"].dt.strftime("%Y-%m-%d")
    export = export.rename(columns={
        "report_date": "report_date",
        "reported_cases": "reported_dengue_cases",
    })
    csv_data = export.to_csv(index=False)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=approved_surveillance_data.csv"},
    )


@router.get("/audit-log")
async def get_audit_log(
    search: str = "",
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(AuditLog).order_by(AuditLog.timestamp.desc())
    if search:
        needle = f"%{search.strip()}%"
        query = query.filter(
            AuditLog.action.ilike(needle)
            | AuditLog.actor.ilike(needle)
            | AuditLog.details.ilike(needle)
        )
    logs = query.limit(limit).all()
    return [
        {
            "action": log.action,
            "actor": log.actor,
            "submission_id": log.submission_id,
            "details": log.details,
            "timestamp": log.timestamp,
        }
        for log in logs
    ]
