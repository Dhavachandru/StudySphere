-- Fix study_group_members RLS policies to allow group owners to invite and manage members
DROP POLICY IF EXISTS "insert_own_study_group_members" ON study_group_members;
DROP POLICY IF EXISTS "insert_study_group_members" ON study_group_members;

CREATE POLICY "insert_study_group_members"
ON study_group_members FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM study_groups
    WHERE study_groups.id = study_group_members.group_id
    AND study_groups.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "delete_own_study_group_members" ON study_group_members;
DROP POLICY IF EXISTS "delete_study_group_members" ON study_group_members;

CREATE POLICY "delete_study_group_members"
ON study_group_members FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM study_groups
    WHERE study_groups.id = study_group_members.group_id
    AND study_groups.owner_id = auth.uid()
  )
);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
