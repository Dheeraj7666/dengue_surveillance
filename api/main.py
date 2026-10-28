from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from api.database import init_db
from api.seed import seed_if_empty
from api.routes import auth, submissions, analytics

init_db()
seed_if_empty()

app = FastAPI(title="DengueCare AI API")

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(submissions.router)
app.include_router(submissions.admin_router)
app.include_router(analytics.router)

@app.get("/")
async def root():
    return {"message": "DengueCare AI API is running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
