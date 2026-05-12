import pandas as pd
import numpy as np

# Load the original fix file
df = pd.read_csv('../data_raw_fix/Data_Merged_Fix.csv')

# The original has English column names, let's map them to what the notebook rule expects
rename_map = {
    'Views': 'views',
    'Impressions': 'impressions',
    'Impressions click-through rate (%)': 'ctr(%)',
    'Average view duration': 'avg_view_duration',
    'Duration': 'video_duration_sec',
    'Likes': 'likes',
    'Comments added': 'comments',
    'Subscribers': 'subscribers_gained',  # Actually the original has 'Subscribers', we can use it as gained
    'Estimated revenue (IDR)': 'revenue_idr',
    'Video publish time': 'publish_date',
    'Video title': 'video_title'
}

# Rename what we can
df = df.rename(columns=rename_map)

# Add missing columns with NaNs or 0s so the notebooks don't break
for col in ['likes', 'comments', 'subscribers_gained', 'subscribers_lost', 'revenue_idr', 'views', 'impressions', 'ctr(%)', 'avg_view_duration', 'video_duration_sec', 'publish_date', 'video_title']:
    if col not in df.columns:
        df[col] = 0.0

# Ensure specific types
df['views'] = pd.to_numeric(df['views'], errors='coerce').fillna(0)
df['video_duration_sec'] = pd.to_numeric(df['video_duration_sec'], errors='coerce').fillna(0)

df_out = df[['views', 'impressions', 'ctr(%)', 'avg_view_duration', 'video_duration_sec', 'likes', 'comments', 'subscribers_gained', 'subscribers_lost', 'revenue_idr', 'publish_date', 'video_title']].copy()
df_out.to_csv('../data/raw/hippo_academy_raw.csv', index=False)
print("Saved hippo_academy_raw.csv")
