-- Insert a test result for the BUS dialogue to demonstrate the feature
INSERT INTO user_test_sessions (
  user_id,
  dialogue_id,
  target_language_id,
  status,
  total_score,
  completed_at,
  session_type,
  total_segments,
  completed_segments,
  time_spent_seconds
) VALUES (
  '2ea63a47-b493-4705-83c8-4757e015fe15',
  'eabf1c4d-8556-427e-a4a8-279194958655',
  'cd7fdc57-b3b8-4f24-95b1-69d2c0175447',
  'completed',
  38,
  NOW(),
  'practice',
  5,
  5,
  420
);