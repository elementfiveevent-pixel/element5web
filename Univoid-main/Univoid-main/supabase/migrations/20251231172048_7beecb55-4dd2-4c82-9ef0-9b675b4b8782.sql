-- Create a function to permanently delete a user and all their data
CREATE OR REPLACE FUNCTION public.permanently_delete_user(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the calling user is the target user (can only delete own account)
  IF auth.uid() IS NULL OR auth.uid() != target_user_id THEN
    RAISE EXCEPTION 'Not authorized to delete this account';
  END IF;

  -- Delete volunteer attendance records
  DELETE FROM public.volunteer_attendance WHERE user_id = target_user_id;
  
  -- Delete volunteer assignments
  DELETE FROM public.volunteer_assignments WHERE user_id = target_user_id;
  
  -- Delete event volunteer invites
  DELETE FROM public.event_volunteer_invites WHERE user_id = target_user_id OR invited_by = target_user_id;
  
  -- Delete event tickets
  DELETE FROM public.event_tickets WHERE user_id = target_user_id;
  
  -- Delete event registrations
  DELETE FROM public.event_registrations WHERE user_id = target_user_id;
  
  -- Delete events created by user (this will cascade to event_form_fields, event_materials, event_clubs, etc.)
  DELETE FROM public.events WHERE organizer_id = target_user_id;
  
  -- Delete materials
  DELETE FROM public.materials WHERE created_by = target_user_id;
  
  -- Delete material likes
  DELETE FROM public.material_likes WHERE user_id = target_user_id;
  
  -- Delete books
  DELETE FROM public.books WHERE created_by = target_user_id;
  
  -- Delete news
  DELETE FROM public.news WHERE created_by = target_user_id;
  
  -- Delete projects and related data
  DELETE FROM public.project_requests WHERE user_id = target_user_id;
  DELETE FROM public.project_members WHERE user_id = target_user_id;
  DELETE FROM public.projects WHERE owner_id = target_user_id;
  
  -- Delete task bids
  DELETE FROM public.task_bids WHERE solver_id = target_user_id;
  
  -- Delete task requests
  DELETE FROM public.task_requests WHERE requester_id = target_user_id OR assigned_to = target_user_id;
  
  -- Delete scholarship reminders
  DELETE FROM public.scholarship_reminders WHERE user_id = target_user_id;
  
  -- Delete reports (both reported and reporter)
  DELETE FROM public.reports WHERE reporter_id = target_user_id OR reported_user_id = target_user_id;
  
  -- Delete notifications
  DELETE FROM public.notifications WHERE user_id = target_user_id;
  
  -- Delete push subscriptions
  DELETE FROM public.push_subscriptions WHERE user_id = target_user_id;
  
  -- Delete email preferences
  DELETE FROM public.email_preferences WHERE user_id = target_user_id;
  
  -- Delete contact messages (if any linked)
  -- Note: contact_messages doesn't have user_id, skipping
  
  -- Delete XP transactions
  DELETE FROM public.xp_transactions WHERE user_id = target_user_id;
  
  -- Delete user roles
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  
  -- Delete club memberships
  DELETE FROM public.club_members WHERE user_id = target_user_id;
  
  -- Delete clubs created by user
  DELETE FROM public.clubs WHERE created_by = target_user_id;
  
  -- Delete organizer applications
  DELETE FROM public.organizer_applications WHERE user_id = target_user_id;
  
  -- Delete OTP records
  DELETE FROM public.phone_otp_codes WHERE user_id = target_user_id;
  DELETE FROM public.otp_rate_limits WHERE user_id = target_user_id;
  
  -- Delete admin invites
  DELETE FROM public.admin_invites WHERE invited_by = target_user_id;
  
  -- Delete error logs
  DELETE FROM public.error_logs WHERE user_id = target_user_id;
  
  -- Finally delete the profile
  DELETE FROM public.profiles WHERE id = target_user_id;
  
  -- Delete from auth.users (this requires service role, handled by edge function)
  -- The auth user deletion will be handled separately
  
  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.permanently_delete_user(UUID) TO authenticated;