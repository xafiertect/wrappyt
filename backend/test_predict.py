import requests

url = "http://localhost:8000/predict/"
payload = {
  "views": 15000,
  "ctr": 4.5,
  "impressions": 200000,
  "avg_view_duration": "00:03:30",
  "video_duration": "00:10:00",
  "likes": 500,
  "comments": 120,
  "retention_rate": 35.0,
  "subscriber_gained": 50,
  "video_age_days": 5,
  "lag_views_7d": 12000,
  "rolling_mean_views_14d": 11000
}
res = requests.post(url, json=payload)
print(res.status_code, res.text)
