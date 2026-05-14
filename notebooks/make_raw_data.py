import pandas as pd
import numpy as np

# Load dataset mentah
df = pd.read_csv('data_raw_fix/Data_Merged_Fix.csv')
print(f'Loaded : {df.shape}')

# Standarisasi nama kolom
rename_map = {
    'Content'                            : 'video_id',
    'Video title'                        : 'video_title',
    'Publish_Date_WIB'                   : 'publish_date',
    'Publish_Time_WIB'                   : 'publish_time',
    'Duration'                           : 'video_duration_sec',
    'Views'                              : 'views',
    'Watch time (hours)'                 : 'watch_time_hours',
    'Average view duration'              : 'avg_view_duration',
    'Average percentage viewed (%)'      : 'avg_pct_viewed',
    'Engaged views'                      : 'engaged_views',
    'Impressions'                        : 'impressions',
    'Impressions click-through rate (%)' : 'ctr_pct',
    'Subscribers'                        : 'subscribers_gained',
    'Estimated revenue (IDR)'            : 'revenue_idr',
    'YouTube ad revenue (IDR)'           : 'yt_ad_revenue_idr',
    'RPM (IDR)'                          : 'rpm_idr',
    'CPM (IDR)'                          : 'cpm_idr',
    'Ad impressions'                     : 'ad_impressions',
    'Unique viewers'                     : 'unique_viewers',
    'New viewers'                        : 'new_viewers',
    'Returning viewers'                  : 'returning_viewers',
    'TS1_Views'                          : 'ts1_views',
    'TS2_Views'                          : 'ts2_views',
    'TS3_Views'                          : 'ts3_views',
    'TS4_Views'                          : 'ts4_views',
}

df = df.rename(columns=rename_map)

# Pilih kolom yang relevan untuk project
output_cols = [
    'video_id', 'video_title', 'publish_date', 'publish_time', 'video_duration_sec',
    'views', 'watch_time_hours', 'avg_view_duration', 'avg_pct_viewed', 'engaged_views',
    'impressions', 'ctr_pct', 'subscribers_gained',
    'revenue_idr', 'yt_ad_revenue_idr', 'rpm_idr', 'cpm_idr', 'ad_impressions',
    'unique_viewers', 'new_viewers', 'returning_viewers',
    'ts1_views', 'ts2_views', 'ts3_views', 'ts4_views',
]

df_out = df[[c for c in output_cols if c in df.columns]].copy()

# Konversi tipe data
df_out['publish_date']       = pd.to_datetime(df_out['publish_date'], errors='coerce')
df_out['video_duration_sec'] = pd.to_numeric(df_out['video_duration_sec'], errors='coerce')
df_out['views']              = pd.to_numeric(df_out['views'], errors='coerce')
df_out['impressions']        = pd.to_numeric(df_out['impressions'], errors='coerce')
df_out['ctr_pct']            = pd.to_numeric(df_out['ctr_pct'], errors='coerce')

# Simpan
df_out.to_csv('data/raw/hippo_academy_raw.csv', index=False)

print(f'Saved  : data/raw/hippo_academy_raw.csv')
print(f'Shape  : {df_out.shape}')
print(f'Kolom  : {df_out.columns.tolist()}')
