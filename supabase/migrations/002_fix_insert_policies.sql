-- Fix missing INSERT policies that blocked the onboarding flow

-- Allow any logged-in user to create a new business (onboarding)
CREATE POLICY "authenticated users can create business"
  ON businesses FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to add themselves as a member (onboarding - chicken-and-egg fix)
CREATE POLICY "users can insert own membership"
  ON business_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Allow owners to create staff profiles for their business
CREATE POLICY "owners can insert staff profiles"
  ON staff_profiles FOR INSERT
  WITH CHECK (is_business_owner(business_id));

-- Allow users to create their own staff profile
CREATE POLICY "users can insert own staff profile"
  ON staff_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());
