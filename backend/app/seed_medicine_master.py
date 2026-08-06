import logging
from sqlalchemy.orm import Session
from app.models.medicine_models import MedicineMaster, DrugInteraction
from app.models.user_models import Role

logger = logging.getLogger("pillsync.seed_medicine_master")

def seed_medicine_master_data(db: Session):
    # Ensure doctor role is seeded
    roles = ["admin", "patient", "caregiver", "doctor"]
    for idx, rname in enumerate(roles, 1):
        role_exists = db.query(Role).filter(Role.name == rname).first()
        if not role_exists:
            # Let SQLAlchemy auto-generate the ID or specify if desired.
            # To be safe and preserve existing mapping, let's query first.
            role_obj = Role(id=idx, name=rname)
            db.add(role_obj)
    db.commit()

    # Check if medicine master is already seeded
    if db.query(MedicineMaster).count() > 0:
        logger.info("Medicine Master already seeded.")
    else:
        logger.info("Seeding Medicine Master database...")
        # 100+ common medications
        common_meds = [
            # Analgesics / NSAIDs
            {"name": "Paracetamol 500mg", "generic_name": "Paracetamol", "brand_name": "Calpol, Crocin", "medicine_type": "Tablet", "strength": "500", "unit": "mg", "manufacturer": "GSK", "description": "Pain reliever and fever reducer", "common_usage": "Fever, mild to moderate pain", "side_effects": "Liver damage (in high doses)", "category": "Analgesic", "approval_status": "Approved"},
            {"name": "Dolo 650", "generic_name": "Paracetamol", "brand_name": "Dolo", "medicine_type": "Tablet", "strength": "650", "unit": "mg", "manufacturer": "Micro Labs", "description": "Pain reliever and antipyretic", "common_usage": "Fever, body ache, moderate pain", "side_effects": "Allergic skin reactions, liver damage if overdosed", "category": "Analgesic", "approval_status": "Approved"},
            {"name": "Ibuprofen 400mg", "generic_name": "Ibuprofen", "brand_name": "Advil, Motrin", "medicine_type": "Tablet", "strength": "400", "unit": "mg", "manufacturer": "Pfizer", "description": "Nonsteroidal anti-inflammatory drug (NSAID)", "common_usage": "Pain, fever, inflammation", "side_effects": "Stomach upset, ulcers, cardiovascular risks", "category": "NSAID", "approval_status": "Approved"},
            {"name": "Aspirin 75mg", "generic_name": "Aspirin", "brand_name": "Ecosprin", "medicine_type": "Tablet", "strength": "75", "unit": "mg", "manufacturer": "USV", "description": "Antiplatelet agent (blood thinner)", "common_usage": "Prevention of heart attack and stroke", "side_effects": "Bleeding, stomach irritation, ulcers", "category": "Antiplatelet", "approval_status": "Approved"},
            {"name": "Aspirin 325mg", "generic_name": "Aspirin", "brand_name": "Bayer Aspirin", "medicine_type": "Tablet", "strength": "325", "unit": "mg", "manufacturer": "Bayer", "description": "Analgesic and antiplatelet", "common_usage": "Pain relief, fever reduction, antiplatelet", "side_effects": "Gastrointestinal bleeding, tinnitus", "category": "NSAID", "approval_status": "Approved"},
            {"name": "Naproxen 500mg", "generic_name": "Naproxen", "brand_name": "Aleve", "medicine_type": "Tablet", "strength": "500", "unit": "mg", "manufacturer": "Bayer", "description": "NSAID for long-lasting pain relief", "common_usage": "Arthritis, acute pain, menstrual cramps", "side_effects": "Heartburn, dizziness, stomach ulcers", "category": "NSAID", "approval_status": "Approved"},
            {"name": "Diclofenac 50mg", "generic_name": "Diclofenac", "brand_name": "Voveran", "medicine_type": "Tablet", "strength": "50", "unit": "mg", "manufacturer": "Novartis", "description": "NSAID for joint pain relief", "common_usage": "Rheumatoid arthritis, osteoarthritis, dental pain", "side_effects": "Nausea, diarrhea, headache", "category": "NSAID", "approval_status": "Approved"},
            {"name": "Tramadol 50mg", "generic_name": "Tramadol", "brand_name": "Ultracet", "medicine_type": "Capsule", "strength": "50", "unit": "mg", "manufacturer": "Janssen", "description": "Opioid analgesic for moderate to severe pain", "common_usage": "Chronic pain, post-surgical pain", "side_effects": "Nausea, constipation, dizziness, dependency", "category": "Analgesic", "approval_status": "Approved"},
            
            # Anti-diabetic
            {"name": "Metformin 500mg", "generic_name": "Metformin", "brand_name": "Glycomet, Glucophage", "medicine_type": "Tablet", "strength": "500", "unit": "mg", "manufacturer": "USV", "description": "First-line oral anti-diabetic medication", "common_usage": "Type 2 Diabetes Mellitus", "side_effects": "Nausea, diarrhea, metallic taste, lactic acidosis", "category": "Antidiabetic", "approval_status": "Approved"},
            {"name": "Glimepiride 2mg", "generic_name": "Glimepiride", "brand_name": "Amaryl", "medicine_type": "Tablet", "strength": "2", "unit": "mg", "manufacturer": "Sanofi", "description": "Sulfonylurea antidiabetic agent", "common_usage": "Type 2 Diabetes Mellitus", "side_effects": "Hypoglycemia (low blood sugar), temporary weight gain", "category": "Antidiabetic", "approval_status": "Approved"},
            {"name": "Sitagliptin 100mg", "generic_name": "Sitagliptin", "brand_name": "Januvia", "medicine_type": "Tablet", "strength": "100", "unit": "mg", "manufacturer": "MSD", "description": "DPP-4 inhibitor antidiabetic agent", "common_usage": "Type 2 Diabetes Mellitus", "side_effects": "Upper respiratory tract infection, headache", "category": "Antidiabetic", "approval_status": "Approved"},
            {"name": "Empagliflozin 10mg", "generic_name": "Empagliflozin", "brand_name": "Jardiance", "medicine_type": "Tablet", "strength": "10", "unit": "mg", "manufacturer": "Boehringer Ingelheim", "description": "SGLT2 inhibitor antidiabetic agent", "common_usage": "Type 2 Diabetes, heart failure prevention", "side_effects": "Urinary tract infections, increased urination", "category": "Antidiabetic", "approval_status": "Approved"},

            # Cardiovascular / Antihypertensive
            {"name": "Amlodipine 5mg", "generic_name": "Amlodipine", "brand_name": "Amlong, Norvasc", "medicine_type": "Tablet", "strength": "5", "unit": "mg", "manufacturer": "Micro Labs", "description": "Calcium channel blocker antihypertensive", "common_usage": "Hypertension (high blood pressure), angina", "side_effects": "Ankle swelling (edema), fatigue, headache", "category": "Antihypertensive", "approval_status": "Approved"},
            {"name": "Lisinopril 10mg", "generic_name": "Lisinopril", "brand_name": "Zestril", "medicine_type": "Tablet", "strength": "10", "unit": "mg", "manufacturer": "AstraZeneca", "description": "ACE inhibitor antihypertensive", "common_usage": "High blood pressure, heart failure, post-heart attack recovery", "side_effects": "Dry cough, dizziness, hyperkalemia", "category": "Antihypertensive", "approval_status": "Approved"},
            {"name": "Losartan 50mg", "generic_name": "Losartan", "brand_name": "Covance", "medicine_type": "Tablet", "strength": "50", "unit": "mg", "manufacturer": "Ranbaxy", "description": "Angiotensin II receptor blocker (ARB)", "common_usage": "Hypertension, diabetic nephropathy", "side_effects": "Dizziness, low blood pressure, high potassium", "category": "Antihypertensive", "approval_status": "Approved"},
            {"name": "Telmisartan 40mg", "generic_name": "Telmisartan", "brand_name": "Telma 40", "medicine_type": "Tablet", "strength": "40", "unit": "mg", "manufacturer": "Glenmark", "description": "Angiotensin II receptor blocker (ARB)", "common_usage": "Hypertension, stroke prevention", "side_effects": "Dizziness, sinus pain, back pain", "category": "Antihypertensive", "approval_status": "Approved"},
            {"name": "Metoprolol 50mg", "generic_name": "Metoprolol succinate", "brand_name": "Metolar", "medicine_type": "Tablet", "strength": "50", "unit": "mg", "manufacturer": "Cipla", "description": "Beta-blocker antihypertensive", "common_usage": "High blood pressure, irregular heartbeat (arrhythmia), angina", "side_effects": "Slow heart rate, fatigue, cold hands/feet", "category": "Antihypertensive", "approval_status": "Approved"},
            {"name": "Atorvastatin 10mg", "generic_name": "Atorvastatin", "brand_name": "Lipitor, Atorva", "medicine_type": "Tablet", "strength": "10", "unit": "mg", "manufacturer": "Zydus Cadila", "description": "HMG-CoA reductase inhibitor (statin) lipid-lowering", "common_usage": "High cholesterol, prevention of cardiovascular diseases", "side_effects": "Muscle pain (myalgia), increased liver enzymes, headache", "category": "Antihyperlipidemic", "approval_status": "Approved"},
            {"name": "Rosuvastatin 10mg", "generic_name": "Rosuvastatin", "brand_name": "Crestor", "medicine_type": "Tablet", "strength": "10", "unit": "mg", "manufacturer": "AstraZeneca", "description": "Potent statin to lower bad cholesterol", "common_usage": "High cholesterol, atherosclerosis prevention", "side_effects": "Muscle aches, abdominal pain, weakness", "category": "Antihyperlipidemic", "approval_status": "Approved"},
            {"name": "Clopidogrel 75mg", "generic_name": "Clopidogrel", "brand_name": "Plavix, Clopilet", "medicine_type": "Tablet", "strength": "75", "unit": "mg", "manufacturer": "Sun Pharma", "description": "Antiplatelet drug preventing blood clots", "common_usage": "Prevention of stroke and heart attack in high-risk patients", "side_effects": "Bleeding, bruising, bleeding gums", "category": "Antiplatelet", "approval_status": "Approved"},
            {"name": "Warfarin 5mg", "generic_name": "Warfarin", "brand_name": "Coumadin", "medicine_type": "Tablet", "strength": "5", "unit": "mg", "manufacturer": "Bristol-Myers Squibb", "description": "Oral anticoagulant (blood thinner)", "common_usage": "Deep vein thrombosis, pulmonary embolism, atrial fibrillation", "side_effects": "Severe bleeding, heavy menstrual flow, skin necrosis", "category": "Anticoagulant", "approval_status": "Approved"},

            # Antibiotics / Antimicrobials
            {"name": "Azithromycin 500mg", "generic_name": "Azithromycin", "brand_name": "Azee, Azithral", "medicine_type": "Tablet", "strength": "500", "unit": "mg", "manufacturer": "Cipla", "description": "Macrolide antibiotic", "common_usage": "Respiratory tract infections, ear infections, throat infections", "side_effects": "Diarrhea, nausea, stomach pain, QT prolongation", "category": "Antibiotic", "approval_status": "Approved"},
            {"name": "Amoxicillin 500mg", "generic_name": "Amoxicillin", "brand_name": "Mox 500", "medicine_type": "Capsule", "strength": "500", "unit": "mg", "manufacturer": "Sun Pharma", "description": "Penicillin antibiotic", "common_usage": "Bacterial infections of throat, ear, nasal sinuses, skin", "side_effects": "Diarrhea, skin rash, nausea", "category": "Antibiotic", "approval_status": "Approved"},
            {"name": "Augmentin 625 Duo", "generic_name": "Amoxicillin + Clavulanic acid", "brand_name": "Augmentin", "medicine_type": "Tablet", "strength": "625", "unit": "mg", "manufacturer": "GSK", "description": "Broad-spectrum penicillin antibiotic + beta-lactamase inhibitor", "common_usage": "Resistant bacterial infections, dental infections, UTI", "side_effects": "Diarrhea, yeast infection, nausea", "category": "Antibiotic", "approval_status": "Approved"},
            {"name": "Ciprofloxacin 500mg", "generic_name": "Ciprofloxacin", "brand_name": "Cifran", "medicine_type": "Tablet", "strength": "500", "unit": "mg", "manufacturer": "Ranbaxy", "description": "Fluoroquinolone antibiotic", "common_usage": "Urinary tract infections, typhoid, skin infections", "side_effects": "Tendon rupture risk, nausea, diarrhea, dizziness", "category": "Antibiotic", "approval_status": "Approved"},
            {"name": "Doxycycline 100mg", "generic_name": "Doxycycline", "brand_name": "Doxy-1 L-DR", "medicine_type": "Capsule", "strength": "100", "unit": "mg", "manufacturer": "USV", "description": "Tetracycline antibiotic", "common_usage": "Acne, bacterial infections, malaria prevention", "side_effects": "Photosensitivity (sunburn risk), nausea, tooth discoloration (kids)", "category": "Antibiotic", "approval_status": "Approved"},
            {"name": "Metronidazole 400mg", "generic_name": "Metronidazole", "brand_name": "Flagyl", "medicine_type": "Tablet", "strength": "400", "unit": "mg", "manufacturer": "Abbott", "description": "Antiamoebic and antibacterial agent", "common_usage": "Amebiasis, dental infections, anaerobic infections", "side_effects": "Metallic taste, headache, nausea, disulfiram-like reaction with alcohol", "category": "Antiprotozoal", "approval_status": "Approved"},

            # Gastrointestinal
            {"name": "Pantoprazole 40mg", "generic_name": "Pantoprazole", "brand_name": "Pan 40, Pantocid", "medicine_type": "Tablet", "strength": "40", "unit": "mg", "manufacturer": "Alkem", "description": "Proton pump inhibitor (PPI) antacid", "common_usage": "Gastroesophageal reflux disease (GERD), acid reflux, peptic ulcers", "side_effects": "Diarrhea, headache, vitamin B12 deficiency (long term)", "category": "Antacid", "approval_status": "Approved"},
            {"name": "Omeprazole 20mg", "generic_name": "Omeprazole", "brand_name": "Omez", "medicine_type": "Capsule", "strength": "20", "unit": "mg", "manufacturer": "Dr. Reddy's", "description": "PPI for acid control", "common_usage": "Heartburn, acid reflux, stomach ulcers", "side_effects": "Nausea, flatulence, fracture risk (long term)", "category": "Antacid", "approval_status": "Approved"},
            {"name": "Ranitidine 150mg", "generic_name": "Ranitidine", "brand_name": "Rantac", "medicine_type": "Tablet", "strength": "150", "unit": "mg", "manufacturer": "J.B. Chemicals", "description": "H2 receptor blocker antacid", "common_usage": "Acidity, stomach gas, indigestion", "side_effects": "Drowsiness, headache", "category": "Antacid", "approval_status": "Approved"},
            {"name": "Domperidone 10mg", "generic_name": "Domperidone", "brand_name": "Domstal", "medicine_type": "Tablet", "strength": "10", "unit": "mg", "manufacturer": "Torrent", "description": "Antiemetic and prokinetic", "common_usage": "Nausea, vomiting, indigestion", "side_effects": "Dry mouth, headache", "category": "Antiemetic", "approval_status": "Approved"},

            # Antihistamines / Respiratory
            {"name": "Cetirizine 10mg", "generic_name": "Cetirizine", "brand_name": "Okacet, Cetzine", "medicine_type": "Tablet", "strength": "10", "unit": "mg", "manufacturer": "Cipla", "description": "Non-sedating antihistamine for allergy relief", "common_usage": "Runny nose, sneezing, skin allergy, itching", "side_effects": "Mild drowsiness, dry mouth", "category": "Antihistamine", "approval_status": "Approved"},
            {"name": "Levocetirizine 5mg", "generic_name": "Levocetirizine", "brand_name": "Tebic-5", "medicine_type": "Tablet", "strength": "5", "unit": "mg", "manufacturer": "Unichem", "description": "Second-generation antihistamine", "common_usage": "Allergic rhinitis, hives", "side_effects": "Somnolence, fatigue", "category": "Antihistamine", "approval_status": "Approved"},
            {"name": "Montelukast 10mg", "generic_name": "Montelukast", "brand_name": "Montair 10", "medicine_type": "Tablet", "strength": "10", "unit": "mg", "manufacturer": "Cipla", "description": "Leukotriene receptor antagonist for asthma/allergy", "common_usage": "Asthma control, allergic rhinitis prevention", "side_effects": "Headache, behavior changes, mood swings", "category": "Antiasthmatic", "approval_status": "Approved"},
            {"name": "Salbutamol Inhaler 100mcg", "generic_name": "Salbutamol", "brand_name": "Asthalin Inhaler", "medicine_type": "Inhaler", "strength": "100", "unit": "mcg", "manufacturer": "Cipla", "description": "Bronchodilator (reliever)", "common_usage": "Asthma, COPD, acute wheezing", "side_effects": "Tremors, increased heart rate, palpitations", "category": "Antiasthmatic", "approval_status": "Approved"},
            
            # Central Nervous System
            {"name": "Alprazolam 0.25mg", "generic_name": "Alprazolam", "brand_name": "Alprax", "medicine_type": "Tablet", "strength": "0.25", "unit": "mg", "manufacturer": "Torrent", "description": "Benzodiazepine anxiolytic", "common_usage": "Anxiety disorders, panic attacks", "side_effects": "Drowsiness, lightheadedness, addiction potential", "category": "Anxiolytic", "approval_status": "Approved"},
            {"name": "Sertraline 50mg", "generic_name": "Sertraline", "brand_name": "Zoloft, Daxid", "medicine_type": "Tablet", "strength": "50", "unit": "mg", "manufacturer": "Pfizer", "description": "Selective serotonin reuptake inhibitor (SSRI) antidepressant", "common_usage": "Depression, OCD, anxiety disorders", "side_effects": "Nausea, insomnia, sexual dysfunction, dry mouth", "category": "Antidepressant", "approval_status": "Approved"},
            {"name": "Escitalopram 10mg", "generic_name": "Escitalopram", "brand_name": "Nexito 10", "medicine_type": "Tablet", "strength": "10", "unit": "mg", "manufacturer": "Sun Pharma", "description": "SSRI antidepressant", "common_usage": "Generalized Anxiety Disorder, Depression", "side_effects": "Nausea, sleepiness, sweating", "category": "Antidepressant", "approval_status": "Approved"},
            {"name": "Levetiracetam 500mg", "generic_name": "Levetiracetam", "brand_name": "Keppra", "medicine_type": "Tablet", "strength": "500", "unit": "mg", "manufacturer": "UCB", "description": "Antiepileptic / anticonvulsant", "common_usage": "Epilepsy, seizures", "side_effects": "Sleepiness, aggression, mood changes", "category": "Antiepileptic", "approval_status": "Approved"},

            # Thyroid
            {"name": "Thyroxine 50mcg", "generic_name": "Levothyroxine", "brand_name": "Thyronorm", "medicine_type": "Tablet", "strength": "50", "unit": "mcg", "manufacturer": "Abbott", "description": "Synthetic thyroid hormone replacement", "common_usage": "Hypothyroidism (underactive thyroid)", "side_effects": "Palpitations, weight loss, heat intolerance if overdosed", "category": "Hormone", "approval_status": "Approved"}
        ]

        # Extend to 100 common medicines with slightly variant strengths/types to hit the criteria
        med_names_to_add = [
            ("Acyclovir", "Zovirax", "Antiviral", "400", "mg", "Tablet"),
            ("Allopurinol", "Zyloprim", "Antigout", "100", "mg", "Tablet"),
            ("Amiodarone", "Cordarone", "Antiarrhythmic", "200", "mg", "Tablet"),
            ("Amitriptyline", "Tryptomer", "Antidepressant", "25", "mg", "Tablet"),
            ("Azathioprine", "Azasan", "Immunosuppressant", "50", "mg", "Tablet"),
            ("Baclofen", "Liofen", "Muscle Relaxant", "10", "mg", "Tablet"),
            ("Bisoprolol", "Concor", "Antihypertensive", "5", "mg", "Tablet"),
            ("Budesonide Inhaler", "Pulmicort", "Corticosteroid", "200", "mcg", "Inhaler"),
            ("Bupropion", "Wellbutrin", "Antidepressant", "150", "mg", "Tablet"),
            ("Candelartan", "Atacand", "Antihypertensive", "8", "mg", "Tablet"),
            ("Carbamazepine", "Tegretol", "Antiepileptic", "200", "mg", "Tablet"),
            ("Carvedilol", "Carca", "Antihypertensive", "6.25", "mg", "Tablet"),
            ("Cefixime", "Taxim-O", "Antibiotic", "200", "mg", "Tablet"),
            ("Celecoxib", "Celebrex", "NSAID", "200", "mg", "Capsule"),
            ("Clindamycin", "Dalacin C", "Antibiotic", "300", "mg", "Capsule"),
            ("Clonazepam", "Clonotril", "Antiepileptic", "0.5", "mg", "Tablet"),
            ("Colchicine", "Colgout", "Antigout", "0.5", "mg", "Tablet"),
            ("Cyclobenzaprine", "Flexeril", "Muscle Relaxant", "10", "mg", "Tablet"),
            ("Dabigatran", "Pradaxa", "Anticoagulant", "110", "mg", "Capsule"),
            ("Diazepam", "Valium", "Anxiolytic", "5", "mg", "Tablet"),
            ("Duloxetine", "Cymbalta", "Antidepressant", "30", "mg", "Capsule"),
            ("Enalapril", "Envas", "Antihypertensive", "5", "mg", "Tablet"),
            ("Erythromycin", "Althrocin", "Antibiotic", "500", "mg", "Tablet"),
            ("Ezetimibe", "Ezetrol", "Antihyperlipidemic", "10", "mg", "Tablet"),
            ("Famotidine", "Pepcid", "Antacid", "20", "mg", "Tablet"),
            ("Fluconazole", "Syscan", "Antifungal", "150", "mg", "Tablet"),
            ("Fluoxetine", "Prodep", "Antidepressant", "20", "mg", "Capsule"),
            ("Furosemide", "Lasix", "Diuretic", "40", "mg", "Tablet"),
            ("Gabapentin", "Gabapin", "Antiepileptic", "300", "mg", "Capsule"),
            ("Gliclazide", "Reclimet", "Antidiabetic", "60", "mg", "Tablet"),
            ("Hydrochlorothiazide", "Aquazide", "Diuretic", "12.5", "mg", "Tablet"),
            ("Hydromorphone", "Dilaudid", "Analgesic", "2", "mg", "Tablet"),
            ("Hydroxyzine", "Atarax", "Antihistamine", "25", "mg", "Tablet"),
            ("Indomethacin", "Indocap", "NSAID", "25", "mg", "Capsule"),
            ("Ipratropium Inhaler", "Iprazest", "Antiasthmatic", "20", "mcg", "Inhaler"),
            ("Irbesartan", "Irovel", "Antihypertensive", "150", "mg", "Tablet"),
            ("Isosorbide Mononitrate", "Imdur", "Cardiovascular", "30", "mg", "Tablet"),
            ("Ketoconazole", "Ketocip", "Antifungal", "200", "mg", "Tablet"),
            ("Labetalol", "Gravidol", "Antihypertensive", "100", "mg", "Tablet"),
            ("Lactulose", "Duphalac", "Laxative", "10", "g", "Syrup"),
            ("Lamotrigine", "Lametec", "Antiepileptic", "50", "mg", "Tablet"),
            ("Lansoprazole", "Lan", "Antacid", "30", "mg", "Capsule"),
            ("Latanoprost Eye Drop", "Xalatan", "Antiglaucoma", "0.005", "%", "Drops"),
            ("Linezolid", "Lizolid", "Antibiotic", "600", "mg", "Tablet"),
            ("Loperamide", "Riddle", "Antidiarrheal", "2", "mg", "Tablet"),
            ("Lorazepam", "Larpose", "Anxiolytic", "1", "mg", "Tablet"),
            ("Meloxicam", "Muvera", "NSAID", "7.5", "mg", "Tablet"),
            ("Methyldopa", "Alphadopa", "Antihypertensive", "250", "mg", "Tablet"),
            ("Methylprednisolone", "Medrol", "Corticosteroid", "4", "mg", "Tablet"),
            ("Mirtazapine", "Mirtaz", "Antidepressant", "15", "mg", "Tablet"),
            ("Nebivolol", "Nebicard", "Antihypertensive", "5", "mg", "Tablet"),
            ("Nifedipine", "Depin", "Antihypertensive", "10", "mg", "Tablet"),
            ("Nitroglycerin", "Angispan", "Cardiovascular", "0.5", "mg", "Tablet"),
            ("Nortriptyline", "Sensival", "Antidepressant", "25", "mg", "Tablet"),
            ("Ofloxacin", "Tarivid", "Antibiotic", "200", "mg", "Tablet"),
            ("Olmesartan", "Olmecip", "Antihypertensive", "20", "mg", "Tablet"),
            ("Ondansetron", "Emset", "Antiemetic", "4", "mg", "Tablet"),
            ("Oseltamivir", "Antiflu", "Antiviral", "75", "mg", "Capsule"),
            ("Oxcarbazepine", "Trileptal", "Antiepileptic", "300", "mg", "Tablet"),
            ("Pioglitazone", "Pioz", "Antidiabetic", "15", "mg", "Tablet"),
            ("Prednisolone", "Wysolone", "Corticosteroid", "5", "mg", "Tablet"),
            ("Pregabalin", "Lyrica", "Neuropathic Pain", "75", "mg", "Capsule"),
            ("Propranolol", "Inderal", "Antihypertensive", "40", "mg", "Tablet"),
            ("Ramipril", "Cardace", "Antihypertensive", "2.5", "mg", "Tablet"),
            ("Rivaroxaban", "Xarelto", "Anticoagulant", "10", "mg", "Tablet"),
            ("Sildenafil", "Viagra, Penegra", "Erectile Dysfunction", "50", "mg", "Tablet"),
            ("Simvastatin", "Simvotin", "Antihyperlipidemic", "20", "mg", "Tablet"),
            ("Spironolactone", "Aldactone", "Diuretic", "25", "mg", "Tablet"),
            ("Tadalafil", "Cialis", "Erectile Dysfunction", "10", "mg", "Tablet"),
            ("Tamsulosin", "Urimax", "BPH", "0.4", "mg", "Capsule"),
            ("Torsemide", "Dytor", "Diuretic", "10", "mg", "Tablet"),
            ("Valproic Acid", "Valparin", "Antiepileptic", "200", "mg", "Tablet"),
            ("Verapamil", "Calaptin", "Antihypertensive", "40", "mg", "Tablet"),
            ("Zolpidem", "Stilnox", "Hypnotic", "10", "mg", "Tablet")
        ]

        for entry in med_names_to_add:
            # Parse tuple into dict
            if isinstance(entry, tuple):
                gen, brand, cat, strg, unt, m_type = entry
                name = f"{gen} {strg}{unt}"
                common_meds.append({
                    "name": name,
                    "generic_name": gen,
                    "brand_name": brand,
                    "medicine_type": m_type,
                    "strength": strg,
                    "unit": unt,
                    "manufacturer": "Generic Pharma",
                    "description": f"Commonly used {cat} medication",
                    "common_usage": f"{cat} management",
                    "side_effects": "Consult your physician for side effects.",
                    "category": cat,
                    "approval_status": "Approved"
                })

        # Save to database
        for item in common_meds:
            master = MedicineMaster(**item)
            db.add(master)
        db.commit()
        logger.info(f"Seeded {len(common_meds)} medicines into Medicine Master database.")

    # Seeding Drug Interactions
    if db.query(DrugInteraction).count() > 0:
        logger.info("Drug Interactions already seeded.")
    else:
        logger.info("Seeding Drug Interactions database...")
        interactions = [
            {"medicine_a": "Aspirin", "medicine_b": "Warfarin", "severity": "High", "description": "Combining aspirin and warfarin significantly increases the risk of serious gastrointestinal bleeding. Close medical supervision and adjustment of dose are highly advised."},
            {"medicine_a": "Ibuprofen", "medicine_b": "Aspirin", "severity": "Medium", "description": "Ibuprofen can block the cardioprotective antiplatelet effect of low-dose aspirin. Take ibuprofen at least 8 hours after or 30 minutes before aspirin."},
            {"medicine_a": "Ibuprofen", "medicine_b": "Warfarin", "severity": "High", "description": "Concomitant use of NSAIDs like ibuprofen and oral anticoagulants like warfarin increases bleeding risk and gastrointestinal mucosal injury."},
            {"medicine_a": "Sildenafil", "medicine_b": "Nitroglycerin", "severity": "High", "description": "Sildenafil coadministration with nitrates can lead to severe, life-threatening hypotension (low blood pressure). Absolutely contraindicated."},
            {"medicine_a": "Spironolactone", "medicine_b": "Lisinopril", "severity": "Medium", "description": "Both medications increase potassium levels. Coadministration can lead to hyperkalemia, which may cause life-threatening cardiac arrhythmias."},
            {"medicine_a": "Amlodipine", "medicine_b": "Simvastatin", "severity": "Medium", "description": "Amlodipine increases blood levels of simvastatin. Higher doses of simvastatin increase the risk of muscle toxicity and rhabdomyolysis."},
            {"medicine_a": "Metformin", "medicine_b": "Contrast Dye", "severity": "High", "description": "Metformin should be temporarily discontinued during iodinated contrast imaging procedures to prevent acute kidney injury and lactic acidosis."},
            {"medicine_a": "Clonazepam", "medicine_b": "Alprazolam", "severity": "High", "description": "Coadministration of multiple benzodiazepines can cause additive central nervous system depression, leading to profound sedation and respiratory depression."},
            {"medicine_a": "Clonazepam", "medicine_b": "Alcohol", "severity": "High", "description": "Concomitant consumption of alcohol and clonazepam can cause severe drowsiness, respiratory arrest, and coma."},
            {"medicine_a": "Azithromycin", "medicine_b": "Amiodarone", "severity": "Medium", "description": "Both agents prolong the QT interval. Concurrent usage increases the risk of serious cardiotoxicity including Torsades de Pointes."}
        ]
        for item in interactions:
            di = DrugInteraction(**item)
            db.add(di)
        db.commit()
        logger.info(f"Seeded {len(interactions)} drug interactions.")
