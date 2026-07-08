-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Organizers can create events" ON events;

-- Create new policy allowing any authenticated user to create events
CREATE POLICY "Authenticated users can create events" 
ON events FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = organizer_id);