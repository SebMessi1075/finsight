from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import pandas as pd, io

from database import engine, get_db, Base
import models, schemas, auth
from ml.analyzer import preprocess_df, analyze

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FinSight API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Auth routes ────────────────────────────────────────────────
@app.post("/auth/register", response_model=schemas.UserOut, status_code=201)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        email=payload.email,
        name=payload.name,
        hashed_password=auth.hash_password(payload.password),
    )
    db.add(user); db.commit(); db.refresh(user)
    return user

@app.post("/auth/login", response_model=schemas.Token)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not auth.verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = auth.create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}
from fastapi.security import OAuth2PasswordRequestForm

@app.post("/auth/token", response_model=schemas.Token)
def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2 form sends 'username' field — we treat it as email
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = auth.create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}
@app.get("/auth/me", response_model=schemas.UserOut)
def me(current_user=Depends(auth.get_current_user)):
    return current_user

# ── Analysis route ─────────────────────────────────────────────
@app.post("/api/analyze")
def analyze_upload(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    try:
        contents = file.file.read()
        df_raw   = pd.read_csv(io.BytesIO(contents))
        df       = preprocess_df(df_raw)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {e}")

    result = analyze(df)

    # Persist upload record
    upload = models.Upload(
        user_id=current_user.id,
        filename=file.filename,
        date_range=result['date_range'],
        total_rows=len(df),
    )
    db.add(upload); db.commit(); db.refresh(upload)

    # Persist transactions
    full_df  = result['df']
    debits_df = result['debits']
    rows = []
    for _, row in full_df.iterrows():
        is_debit = row['Type'] == 'Debit'
        debit_row = debits_df[debits_df.index == row.name]
        rows.append(models.Transaction(
            user_id=current_user.id,
            upload_id=upload.id,
            date=row['Date'].to_pydatetime(),
            description=row['Description'],
            amount=float(row['Amount']),
            type=row['Type'],
            category=row.get('Category'),
            z_score=float(debit_row['Z_Score'].iloc[0]) if is_debit and len(debit_row) else 0.0,
            z_flagged=bool(debit_row['Z_Flagged'].iloc[0]) if is_debit and len(debit_row) else False,
        ))
    db.bulk_save_objects(rows); db.commit()

    # Strip internal df keys before returning
    result.pop('df'); result.pop('debits')
    result['upload_id'] = upload.id
    return result

# ── History routes ─────────────────────────────────────────────
@app.get("/api/uploads", response_model=list[schemas.UploadOut])
def get_uploads(db: Session = Depends(get_db), current_user=Depends(auth.get_current_user)):
    return db.query(models.Upload).filter(models.Upload.user_id == current_user.id)\
             .order_by(models.Upload.uploaded_at.desc()).all()

@app.get("/api/transactions", response_model=list[schemas.TransactionOut])
def get_transactions(
    upload_id: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(auth.get_current_user),
):
    q = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id)
    if upload_id:
        q = q.filter(models.Transaction.upload_id == upload_id)
    return q.order_by(models.Transaction.date.desc()).limit(500).all()

@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0"}