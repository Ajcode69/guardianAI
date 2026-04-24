from fastapi import FastAPI
import uvicorn
from app.config import HOST, PORT
from app.routes import compare

app = FastAPI(title="Guardian Similarity Service")

app.include_router(compare.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=False)
