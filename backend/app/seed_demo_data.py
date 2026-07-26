import os
import sys
from datetime import datetime, date, timedelta
import random

# Add parent directory to path so app imports work
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.user_models import User, Role, PatientProfile, Medicine, ReminderSchedule, MedicationHistory, NotificationSetting, Notification
from app.utils.security import get_password_hash

def seed_data():
    db = SessionLocal()
    try:
        print("[*] Seeding demo data for sukumarsty25@gmail.com...")
        
        # 1. Get or create Role
        patient_role = db.query(Role).filter(Role.name == "patient").first()
        if not patient_role:
            patient_role = Role(name="patient")
            db.add(patient_role)
            db.commit()
            db.refresh(patient_role)
        
        # 2. Get or create User
        target_email = "sukumarsty25@gmail.com"
        user = db.query(User).filter(User.email == target_email).first()
        if user:
            print(f"[*] User {target_email} already exists. Cleaning old data...")
            # Delete old profile/medicines/history to start fresh
            db.query(PatientProfile).filter(PatientProfile.user_id == user.id).delete()
            db.query(Medicine).filter(Medicine.user_id == user.id).delete()
            db.query(MedicationHistory).filter(MedicationHistory.user_id == user.id).delete()
            db.query(NotificationSetting).filter(NotificationSetting.user_id == user.id).delete()
            db.query(Notification).filter(Notification.user_id == user.id).delete()
            db.commit()
        else:
            print(f"[*] Creating user {target_email}...")
            user = User(
                email=target_email,
                hashed_password=get_password_hash("password123"),
                role_id=patient_role.id,
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # 3. Create Patient Profile
        print("[*] Creating Patient Profile...")
        profile = PatientProfile(
            user_id=user.id,
            full_name="Sukumar Karnam",
            phone="+91 9876543210",
            age=22,
            gender="Male",
            blood_group="O+",
            address="Flat 302, Green Meadows, Hyderabad, Telangana, 500081 (Height: 170 cm, Weight: 68 kg, Medical Notes: Daily vitamin routine, Allergies: Penicillin, Conditions: Mild asthma)",
            emergency_contact="Ramesh Karnam (Father) - +91 9988776655",
            account_status="Active"
        )
        db.add(profile)

        # 4. Create Notification Settings
        print("[*] Creating Notification Settings...")
        settings = NotificationSetting(
            user_id=user.id,
            email_enabled=True,
            use_primary_email=True,
            reminder_email=target_email,
            last_email_sent=None
        )
        db.add(settings)
        db.commit()

        # 5. Create 10 sample medicines
        print("[*] Seeding 10 Medicines & Schedules...")
        medicines_data = [
            ("Paracetamol 650mg", "650mg", "Daily", True, False, True, "After Food", "Take with warm water", 45, 5, [("Morning", "08:00"), ("Night", "20:00")]),
            ("Vitamin D3", "60K IU", "Weekly", False, True, False, "Before Food", "Take Sunday afternoon", 12, 2, [("Afternoon", "13:00")]),
            ("Vitamin B12", "1500mcg", "Daily", True, False, False, "After Food", "Take after breakfast", 30, 7, [("Morning", "08:30")]),
            ("Cetirizine", "10mg", "Daily", False, False, True, "After Food", "Take before bedtime, causes drowsiness", 20, 4, [("Night", "21:00")]),
            ("Azithromycin", "500mg", "Daily", False, True, False, "Before Food", "Take 1 hour before lunch", 6, 2, [("Afternoon", "12:00")]),
            ("Pantoprazole", "40mg", "Daily", True, False, False, "Before Food", "Take first thing in the morning empty stomach", 30, 5, [("Morning", "07:00")]),
            ("Metformin", "500mg", "Daily", True, False, True, "After Food", "Take with dinner and breakfast", 60, 10, [("Morning", "08:00"), ("Night", "20:00")]),
            ("Calcium Tablets", "500mg", "Daily", False, True, False, "After Food", "Take with lunch", 30, 5, [("Afternoon", "13:30")]),
            ("Iron Tablets", "100mg", "Daily", False, False, True, "After Food", "Take after dinner", 30, 5, [("Night", "20:30")]),
            ("Multivitamin", "1 capsule", "Daily", True, False, False, "After Food", "Take with breakfast", 30, 5, [("Morning", "08:00")]),
        ]

        inserted_medicines = []
        start_dt = date.today() - timedelta(days=45)
        end_dt = date.today() + timedelta(days=90)

        for name, dosage, freq, morn, aft, night, relation, notes, qty, refill, schedules in medicines_data:
            med = Medicine(
                user_id=user.id,
                name=name,
                dosage=dosage,
                frequency=freq,
                morning=morn,
                afternoon=aft,
                night=night,
                food_relation=relation,
                start_date=start_dt,
                end_date=end_dt,
                notes=notes,
                quantity=qty,
            )
            db.add(med)
            db.commit()
            db.refresh(med)
            inserted_medicines.append((med, schedules))

            for tod, tm in schedules:
                sched = ReminderSchedule(
                    medicine_id=med.id,
                    time_of_day=tod,
                    scheduled_time=tm
                )
                db.add(sched)
        db.commit()

        # 6. Generate 30 days of Medication History
        print("[*] Generating 30 days of Medication History logs...")
        statuses = ["Taken", "Missed", "Skipped", "Late"]
        weights = [0.85, 0.05, 0.05, 0.05] # Realistic adherence rates
        
        history_start = date.today() - timedelta(days=30)
        for day_offset in range(31):
            current_day = history_start + timedelta(days=day_offset)
            # Add logs for all medicines scheduled for this day
            for med, schedules in inserted_medicines:
                # If weekly, only log on Sundays
                if med.frequency == "Weekly" and current_day.weekday() != 6:
                    continue
                
                for tod, tm in schedules:
                    status = random.choices(statuses, weights=weights)[0]
                    # Map action time
                    action_time = datetime.combine(current_day, datetime.strptime(tm, "%H:%M").time())
                    if status == "Late":
                        action_time += timedelta(minutes=random.randint(60, 180))
                    elif status == "Taken":
                        action_time += timedelta(minutes=random.randint(-15, 30))
                    elif status in ["Missed", "Skipped"]:
                        action_time = None
                    
                    hist = MedicationHistory(
                        user_id=user.id,
                        medicine_id=med.id,
                        medicine_name=med.name,
                        dosage=med.dosage,
                        time_of_day=tod,
                        status=status,
                        action_time=action_time,
                        scheduled_date=current_day
                    )
                    db.add(hist)
        db.commit()

        # 7. Create some notifications
        print("[*] Seeding sample notification inbox alerts...")
        notif_types = ["reminder", "refill", "system"]
        for i in range(5):
            notif = Notification(
                user_id=user.id,
                title=f"Sample Notification {i+1}",
                message=f"This is a detail for notification message alert {i+1}.",
                type=random.choice(notif_types),
                is_read=False if i < 2 else True,
                created_at=datetime.now() - timedelta(hours=i*3)
            )
            db.add(notif)
        db.commit()

        print("[OK] Seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"[FAIL] Error seeding data: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
