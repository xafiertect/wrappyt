#!/bin/bash

# Path to the virtual environment's python
PYTHON_EXEC="./captonevenv/bin/python"

# Check if python exists in venv
if [ ! -f "$PYTHON_EXEC" ]; then
    echo "Error: Python not found in $PYTHON_EXEC"
    exit 1
fi

# Define notebooks in sequential order of execution
notebooks=(
    "notebooks/preparation/prep_data.ipynb"
    "notebooks/feature_enginering/02_feature_engineering_wildan.ipynb"
    "notebooks/feature_enginering/03_feature_engineering_qiqi.ipynb"
    "notebooks/feature_enginering/04_feature_engineering_yusuf.ipynb"
    "notebooks/feature_enginering/05_feature_engineering_akmal.ipynb"
    "notebooks/feature_enginering/06_feature_engineering_zahra.ipynb"
    "notebooks/feature_enginering/07_feature_aggregation.ipynb"
    "notebooks/modelling/08_model1_regression_views.ipynb"
    "notebooks/modelling/09_model2_timeseries_forecast.ipynb"
    "notebooks/modelling/10_model3_anomaly_detection.ipynb"
)

# Execute all notebooks
for nb in "${notebooks[@]}"; do
    if [ -f "$nb" ]; then
        echo "Executing $nb..."
        "$PYTHON_EXEC" -m nbconvert --to notebook --execute --ExecutePreprocessor.kernel_name=captonevenv --inplace "$nb"
        if [ $? -eq 0 ]; then
            echo "Successfully executed $nb"
        else
            echo "Failed to execute $nb"
            exit 1
        fi
    else
        echo "Warning: Notebook file not found: $nb"
    fi
done
