"""
Bootstrap Training Script.
Pre-trains version 1.0 of the RouteFill AI ML models using realistic synthetic
historical freight corridor data so the ML engine starts fully functional.
"""

import sys
import os

# Add ml-service directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.training_service import TrainingService


def main():
    print("Initializing RouteFill AI ML bootstrap training...")
    service = TrainingService()
    metrics = service.train_and_save(version_tag="v1.0")
    print("Training successfully completed!")
    print(f"Model Version:       {metrics['model_version']}")
    print(f"Acceptance Accuracy: {metrics['acceptance_accuracy']}")
    print(f"Success Accuracy:    {metrics['success_accuracy']}")
    print(f"Profit MAE (INR):    {metrics['profit_mae']}")
    print(f"Profit R2 Score:     {metrics['profit_r2']}")
    print(f"Trained Samples:     {metrics['samples_trained']}")


if __name__ == "__main__":
    main()
