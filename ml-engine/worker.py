"""
SAM 3 Training Worker
Can be launched per job by the ASP.NET backend or run as an independent daemon.
"""

import argparse
import time
import requests
from training.trainer import SAMTrainer

def run_single_job(job_id: str, manifest_path: str, api_url: str):
    trainer = SAMTrainer(job_id=job_id, manifest_path=manifest_path, api_url=api_url)
    trainer.run()

def run_daemon(api_url: str, poll_interval: int = 5):
    print(f"[SAM Worker Daemon] Polling API at {api_url} every {poll_interval}s for new jobs...")
    while True:
        try:
            resp = requests.get(f"{api_url}/api/training/jobs/pending", timeout=5)
            if resp.status_code == 200 and resp.text:
                job_data = resp.json()
                if job_data and "id" in job_data:
                    job_id = job_data["id"]
                    manifest = f"./storage/exports/{job_id}/sam_dataset_manifest.json"
                    print(f"[SAM Worker Daemon] Found queued Job: {job_id}. Starting training...")
                    run_single_job(job_id, manifest, api_url)
            time.sleep(poll_interval)
        except KeyboardInterrupt:
            print("[SAM Worker Daemon] Exiting cleanly...")
            break
        except Exception as e:
            print(f"[SAM Worker Daemon] Polling tick error: {e}")
            time.sleep(poll_interval)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SAM 3 Fine-Tuning Worker")
    parser.add_argument("--job-id", type=str, help="Job UUID to process")
    parser.add_argument("--manifest", type=str, help="Path to exported dataset manifest")
    parser.add_argument("--api-url", type=str, default="http://localhost:5000", help="ASP.NET Core API URL")
    parser.add_argument("--daemon", action="store_true", help="Run as background polling daemon")
    parser.add_argument("--interval", type=int, default=5, help="Daemon polling interval in seconds")

    args = parser.parse_args()

    if args.daemon:
        run_daemon(args.api_url, args.interval)
    elif args.job_id and args.manifest:
        run_single_job(args.job_id, args.manifest, args.api_url)
    else:
        print("Usage: python worker.py --daemon OR python worker.py --job-id <uuid> --manifest <path>")
