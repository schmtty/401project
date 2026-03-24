-- Area Book 2.0 - Seed Data
-- Users first (required for FK), then settings, then connections/events/goals

-- Users (default profile)
INSERT INTO users (id, name, pin, avatar) VALUES
('u1', 'Default User', NULL, '👨');

-- User settings for default user
INSERT INTO user_settings (id, user_id, theme, language) VALUES
('us1', 'u1', 'light', 'en');

-- Connections (belong to u1)
INSERT INTO connections (id, user_id, name, age, phone, location, notes, gender, relationship, liked, created_at, milestones) VALUES
('1', 'u1', 'John Cena', 24, '555-0101', 'Provo Library', 'Likes to wrestle', 'male', 'friend', false, '2025-12-01', '{"dates":3,"heldHands":true,"kissed":false,"metParents":false,"contactStreak":7}'),
('2', 'u1', 'Kristy Jensen', 22, '555-0102', 'The Coffee Pod Provo', 'DATE PLANNED THIS FRIDAY DON''T BE LATE', 'female', 'connection', true, '2025-11-15', '{"dates":5,"heldHands":true,"kissed":true,"metParents":false,"contactStreak":14}'),
('3', 'u1', 'Don Pedro', 25, '555-0103', 'Vasa Fitness Orem', 'Need to setup some pickle ball with him soon...', 'male', 'friend', false, '2025-10-20', '{"dates":1,"heldHands":false,"kissed":false,"metParents":false,"contactStreak":2}'),
('4', 'u1', 'Brinleigh Jackson', 23, '555-0104', 'UVU Art Building', 'SHE WAS CUTE GOTTA MAKE IT HAPPEN', 'female', 'connection', true, '2026-01-10', '{"dates":2,"heldHands":false,"kissed":false,"metParents":false,"contactStreak":5}'),
('5', 'u1', 'Jake Jake', 26, '555-0105', 'Westview Park Orem', 'My absolute dog', 'male', 'friend', false, '2026-01-25', '{"dates":0,"heldHands":false,"kissed":false,"metParents":false,"contactStreak":1}');

-- Calendar events (belong to u1)
INSERT INTO calendar_events (id, user_id, title, date, time, location, notes, type, connection_id, color, status, reported_at, report_notes, report_milestones) VALUES
('1', 'u1', 'Breakfast with Brooke', '2026-02-11', '10:00', 'BYU Cougareat, Provo, UT', '', 'date', '2', '#3b82f6', 'planned', NULL, NULL, NULL),
('2', 'u1', 'Study Spanish', '2026-02-11', '11:00', 'Provo City Library, Provo, UT', '', 'other', NULL, '#ef4444', 'planned', NULL, NULL, NULL),
('3', 'u1', 'Lunch with David', '2026-02-11', '12:00', 'BYU Wilkinson Center, Provo, UT', '', 'hangout', '3', '#22c55e', 'planned', NULL, NULL, NULL),
('4', 'u1', 'Group Blind Date', '2026-02-11', '17:00', 'Center Street, Provo, UT', '', 'date', NULL, '#eab308', 'planned', NULL, NULL, NULL),
('5', 'u1', 'Pickle Ball with the boys', '2026-02-14', '15:00', 'Provo Recreation Center, Provo, UT', '', 'hangout', '3', '#8b5cf6', 'planned', NULL, NULL, NULL),
('6', 'u1', 'Date with Katelyn', '2026-02-14', '18:00', 'Brick Oven Pizza, Provo, UT', '', 'date', '2', '#ec4899', 'planned', NULL, NULL, NULL),
('7', 'u1', 'Dinner date', '2026-02-15', '19:00', 'Happy Sumo Sushi, Provo, UT', '', 'date', '4', '#06b6d4', 'planned', NULL, NULL, NULL);

-- Goals (belong to u1)
INSERT INTO goals (id, user_id, title, goal_type, measure, actions, target_date, notes, category, target, current, completed, history) VALUES
('1', 'u1', 'Go on 10 dates', 'measurable', 'Number of dates', 'Ask someone out each week', '2026-06-01', '', 'love', 10, 6, false, '[{"date":"2026-01-29","value":2},{"date":"2026-02-01","value":3},{"date":"2026-02-05","value":4},{"date":"2026-02-08","value":5},{"date":"2026-02-11","value":6}]'),
('2', 'u1', 'Hit the gym 5x/week', 'measurable', 'Gym visits per week', 'Morning workouts', '2026-04-01', '', 'fitness', 20, 12, false, '[{"date":"2026-01-28","value":4},{"date":"2026-02-02","value":6},{"date":"2026-02-06","value":8},{"date":"2026-02-09","value":10},{"date":"2026-02-11","value":12}]'),
('3', 'u1', 'Get 3.5 GPA', 'measurable', 'GPA score', 'Study 2 hours daily', '2026-05-15', '', 'school', 100, 78, false, '[]'),
('4', 'u1', 'Land internship', 'completion', '', 'Apply to 5 companies per week', '2026-03-01', '', 'work', 0, 0, false, '[]'),
('5', 'u1', 'Expand social circle', 'measurable', 'New people met', 'Attend 2 social events/week', '2026-06-01', '', 'social', 30, 12, false, '[]');
