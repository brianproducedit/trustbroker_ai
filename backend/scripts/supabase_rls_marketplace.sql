-- TrustBroker AI — marketplace RLS (run in Supabase SQL editor after schema).
-- FastAPI uses the direct Postgres role and is not blocked by these policies.
-- They protect PostgREST / authenticated browser access.

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vetting_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_self_read ON profiles;
CREATE POLICY profiles_self_read ON profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid());

DROP POLICY IF EXISTS profiles_self_update ON profiles;
CREATE POLICY profiles_self_update ON profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid());

DROP POLICY IF EXISTS contracts_party_or_open ON contracts;
CREATE POLICY contracts_party_or_open ON contracts
    FOR SELECT TO authenticated
    USING (
        client_id = auth.uid()
        OR freelancer_id = auth.uid()
        OR (visibility = 'open' AND status = 'OPEN')
    );

DROP POLICY IF EXISTS applications_freelancer_own ON applications;
CREATE POLICY applications_freelancer_own ON applications
    FOR SELECT TO authenticated
    USING (
        freelancer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM contracts c
            WHERE c.id = applications.contract_id AND c.client_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS applications_freelancer_insert ON applications;
CREATE POLICY applications_freelancer_insert ON applications
    FOR INSERT TO authenticated
    WITH CHECK (freelancer_id = auth.uid());

DROP POLICY IF EXISTS vetting_client_or_self ON vetting_reports;
CREATE POLICY vetting_client_or_self ON vetting_reports
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM applications a
            JOIN contracts c ON c.id = a.contract_id
            WHERE a.id = vetting_reports.application_id
              AND (a.freelancer_id = auth.uid() OR c.client_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS notifications_own ON notifications;
CREATE POLICY notifications_own ON notifications
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS payouts_party ON payouts;
CREATE POLICY payouts_party ON payouts
    FOR SELECT TO authenticated
    USING (
        freelancer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM contracts c
            WHERE c.id = payouts.contract_id AND c.client_id = auth.uid()
        )
    );
