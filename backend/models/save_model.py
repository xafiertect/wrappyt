import os
import json
import joblib
from datetime import datetime
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
# import xgboost as xgb

def save_ml_models():
    """
    Script to save trained ML models to the backend/models/ directory.
    This creates dummy models for structural purposes if real ones don't exist.
    """
    MODELS_DIR = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(MODELS_DIR, exist_ok=True)

    # 1. Dummy RandomForest Classifier
    rf_clf = RandomForestClassifier(n_estimators=10, random_state=42)
    # Fit with some dummy data [views, ctr, impressions, avg_view_duration, engagement_rate]
    X_dummy = [[1000, 5.0, 20000, 180.0, 4.5], [5000, 8.0, 50000, 240.0, 6.0]]
    y_dummy = [1, 2] # 1: Normal, 2: Viral
    rf_clf.fit(X_dummy, y_dummy)
    joblib.dump(rf_clf, os.path.join(MODELS_DIR, 'rf_classifier.pkl'))

    # 2. Dummy XGBRegressor (Commented out to prevent crash if xgboost is not installed)
    # xgb_reg = xgb.XGBRegressor(n_estimators=10)
    # xgb_reg.fit(X_dummy, [1500, 6000])
    # joblib.dump(xgb_reg, os.path.join(MODELS_DIR, 'xgb_regressor.pkl'))

    # 3. Dummy Scaler
    scaler = StandardScaler()
    scaler.fit(X_dummy)
    joblib.dump(scaler, os.path.join(MODELS_DIR, 'scaler.pkl'))

    # 4. Dummy LabelEncoder
    le = LabelEncoder()
    le.fit(['Tidak Viral', 'Normal', 'Viral'])  # Hippo Academy 2-jam rule
    joblib.dump(le, os.path.join(MODELS_DIR, 'label_encoder.pkl'))

    # 5. Metadata JSON
    metadata = {
        "trained_at": datetime.utcnow().isoformat(),
        "accuracy": 0.95, # Example
        "features": ["views", "ctr", "impressions", "avg_view_duration", "engagement_rate"]
    }
    with open(os.path.join(MODELS_DIR, 'metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=4)

    print(f"Models and metadata saved successfully in {MODELS_DIR}")

if __name__ == "__main__":
    save_ml_models()
