#!/bin/bash

# Path to the virtual environment's jupyter
JUPYTER_EXEC="./capstonevnv/bin/jupyter"
NOTEBOOKS_DIR="./notebooks"

# Check if jupyter exists in venv
if [ ! -f "$JUPYTER_EXEC" ]; then
    echo "Error: Jupyter not found in $JUPYTER_EXEC"
    exit 1
fi

# Execute all notebooks
for nb in "$NOTEBOOKS_DIR"/*.ipynb; do
    echo "Executing $nb..."
    "$JUPYTER_EXEC" nbconvert --to notebook --execute --inplace "$nb"
    if [ $? -eq 0 ]; then
        echo "Successfully executed $nb"
    else
        echo "Failed to execute $nb"
    fi
done
