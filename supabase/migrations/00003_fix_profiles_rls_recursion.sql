-- Fix infinite recursion in profiles RLS policies
-- The self-referencing policy "Super admin full access to profiles" queries profiles
-- inside a profiles policy, causing infinite recursion. Replace with a SECURITY DEFINER
-- function that reads the role without triggering RLS.

-- Drop the recursive policy
DROP POLICY IF EXISTS "Super admin full access to profiles" ON profiles;

-- Create a SECURITY DEFINER function to check the current user's role
-- (runs with the owner's privileges, bypassing RLS on profiles)
CREATE OR REPLACE FUNCTION public.is_staff(min_role TEXT DEFAULT 'viewer')
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND is_active = true
    AND (
      (min_role = 'viewer'      AND role IN ('super_admin','admin','editor','viewer','translator')) OR
      (min_role = 'translator'  AND role IN ('super_admin','admin','editor','translator')) OR
      (min_role = 'editor'      AND role IN ('super_admin','admin','editor')) OR
      (min_role = 'admin'       AND role IN ('super_admin','admin')) OR
      (min_role = 'super_admin' AND role IN ('super_admin'))
    )
  );
$$;

-- Re-grant access using the helper function (no recursion)
CREATE POLICY "Super admin full access to profiles"
  ON profiles FOR ALL
  USING (public.is_staff('super_admin'));

-- Keep self-access policies (these don't recurse — they use auth.uid() directly)
-- (Users can view own profile / update own profile already exist)
