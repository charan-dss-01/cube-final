from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.config.settings import settings
from app.models.models import Base

db_url = settings.DATABASE_URL
if not db_url:
    raise RuntimeError("DATABASE_URL environment variable is required and cannot be empty.")
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# Ensure compatible driver prefix for PostgreSQL in SQLAlchemy 2.0 / 2.1+
if db_url.startswith("postgresql://") and "+psycopg" not in db_url:
    try:
        import psycopg  # psycopg v3
    except ImportError:
        try:
            import psycopg2  # psycopg v2 fallback
            db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
        except ImportError:
            pass

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        from sqlalchemy import text
        from app.models.models import Company, User
        # Seed companies table
        alpha = db.query(Company).filter(Company.id == "org_demo_alpha").first()
        if not alpha:
            db.add(Company(id="org_demo_alpha", name="Alpha Retail Corp"))
        bravo = db.query(Company).filter(Company.id == "org_demo_bravo").first()
        if not bravo:
            db.add(Company(id="org_demo_bravo", name="Bravo Logistics Inc"))
        u1 = db.query(User).filter(User.email == "analyst@alpharetail.com").first()
        if not u1:
            db.add(User(company_id="org_demo_alpha", name="Sarah Chen", email="analyst@alpharetail.com", role="Admin"))
        
        # Seed rcy_companies table if present
        db.execute(text("""
            INSERT INTO rcy_companies (id, name)
            VALUES 
                ('org_demo_alpha', 'Alpha Retail Corp'),
                ('org_demo_bravo', 'Bravo Logistics Inc')
            ON CONFLICT (id) DO NOTHING;
        """))
        db.commit()
    except Exception as e:
        db.rollback()
        print("Init DB seed notice:", e)
    finally:
        db.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
