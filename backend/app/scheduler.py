from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime

# Global scheduler instance
scheduler = AsyncIOScheduler()

def start_scheduler(app_logger):
    """Start the APScheduler with daily jobs for Milestone‑3 features.
    The jobs are scheduled at low‑traffic times (02:00‑03:00) to avoid
    interfering with request handling.
    """
    # Import job functions lazily to avoid circular imports
    from app.services.refill_service import run_daily_refill_job
    from app.services.dosage_analysis_service import run_dosage_analysis
    from app.services.notification_service import generate_refill_notifications
    from app.services.adherence_service import compute_adherence_metrics

    # Schedule daily jobs at 02:00‑03:00 AM
    scheduler.add_job(run_daily_refill_job, CronTrigger(hour=2, minute=0), id="refill_job", replace_existing=True)
    scheduler.add_job(run_dosage_analysis, CronTrigger(hour=2, minute=15), id="dosage_job", replace_existing=True)
    scheduler.add_job(generate_refill_notifications, CronTrigger(hour=2, minute=30), id="notification_job", replace_existing=True)
    scheduler.add_job(compute_adherence_metrics, CronTrigger(hour=3, minute=0), id="adherence_job", replace_existing=True)

    scheduler.start()
    app_logger.info("APScheduler started with daily jobs for refill prediction, dosage analysis, notifications, and adherence analytics.")
