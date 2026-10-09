import os
import shutil

root_dir = r"C:\cube"

items_to_remove = [
    # Caches & temporary scripts
    ".pytest_cache",
    "init_central_db.py",
    "run_and_save_rcv_inspections.py",
    # Extra folders copied earlier
    "agents",
    "orchestration",
    "shared",
    "scripts",
    "data",
    "examples",
    "tests",
    "docs",
    # Extra root files copied earlier (not in user screenshot)
    "alembic.ini",
    "requirements.lock",
    "pod-assignment.json",
    "PROVENANCE.md"
]

print("=== Removing Unnecessary Root Items ===")
for item in items_to_remove:
    path = os.path.join(root_dir, item)
    if os.path.isdir(path):
        shutil.rmtree(path, ignore_errors=True)
        print(f"Removed directory: {item}")
    elif os.path.isfile(path):
        os.remove(path)
        print(f"Removed file: {item}")
    else:
        print(f"Not found / Already clean: {item}")

print("\nCleanup completed!")
