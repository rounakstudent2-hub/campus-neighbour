from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.user import User
from app.models.task import Task
from app.core.security import get_password_hash

def init_db_and_seed():
    """Initializes tables and seeds default evaluation accounts."""
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # Check if users already exist
        existing = db.query(User).first()
        if existing:
            return

        print("Seeding initial evaluation data...")
        users = [
            User(
                email="priya.neighbor@gmail.com",
                password_hash=get_password_hash("neighbor123"),
                name="Priya Sharma",
                role="neighbor",
                bio="Software Engineer & Resident of Indiranagar. Looking for help with household errands & gardening.",
                avatar="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
                is_verified=True,
                is_active=True
            ),
            User(
                email="arun.neighbor@outlook.com",
                password_hash=get_password_hash("neighbor123"),
                name="Arun Verma",
                role="neighbor",
                bio="Senior resident in Koramangala. Frequent requirement for technology support, groceries and medication pickups.",
                avatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
                is_verified=True,
                is_active=True
            ),
            User(
                email="rahul.student@iisc.edu.in",
                password_hash=get_password_hash("student123"),
                name="Rahul Nair",
                role="student",
                college="Indian Institute of Science (IISc), Bangalore",
                bio="M.Tech Computer Science scholar. Proficient in Math tutoring, Python, PC/printer hardware troubleshooting and pet sitting.",
                avatar="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200",
                is_verified=True,
                is_active=True
            ),
            User(
                email="ananya.student@christ.edu.in",
                password_hash=get_password_hash("student123"),
                name="Ananya Hegde",
                role="student",
                college="Christ University, Bangalore",
                bio="B.Com 3rd year. Experienced dog walker, organized event coordinator, and academic tutor for middle school students.",
                avatar="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200",
                is_verified=True,
                is_active=True
            ),
            User(
                email="admin@marketplace.local",
                password_hash=get_password_hash("admin123"),
                name="CampusNeighbor Operations",
                role="admin",
                bio="CampusNeighbor Trust, Safety & Operations Command Center.",
                avatar="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
                is_verified=True,
                is_active=True
            )
        ]
        db.add_all(users)
        db.commit()

        # Seed initial realistic chores in Bengaluru (Indiranagar / Koramangala)
        priya = db.query(User).filter(User.email == "priya.neighbor@gmail.com").first()
        arun = db.query(User).filter(User.email == "arun.neighbor@outlook.com").first()

        tasks = [
            Task(
                creator_id=priya.id,
                title="Weekend Dog Walking & Feeding",
                description="Need a responsible student to walk our 2-year-old Golden Retriever twice a day over the weekend in Defense Colony, Indiranagar.",
                category="Pet Care",
                budget=500.0,
                lat=12.9784,
                lon=77.6408,
                address="12th Main Road, Indiranagar, Bengaluru",
                status="open"
            ),
            Task(
                creator_id=arun.id,
                title="Wi-Fi Router & Smart TV Configuration",
                description="Recently upgraded broadband fiber. Looking for a tech-savvy student to setup the mesh Wi-Fi and configure Netflix on smart TV.",
                category="Technology Assistance",
                budget=450.0,
                lat=12.9352,
                lon=77.6245,
                address="4th Block, Koramangala, Bengaluru",
                status="open"
            ),
            Task(
                creator_id=priya.id,
                title="Class 9 Mathematics Exam Prep Coaching",
                description="Seeking a university engineering student to conduct 2 hours of revision for Linear Equations and Trigonometry.",
                category="Tutoring and Academic Help",
                budget=800.0,
                lat=12.9716,
                lon=77.6412,
                address="HAL 2nd Stage, Indiranagar, Bengaluru",
                status="open"
            )
        ]
        db.add_all(tasks)
        db.commit()
        print("Initial data seeded successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()
