-- Drop and recreate the permanently_delete_user function to work with service role
-- The function should accept a service_role_override parameter for Edge Functions

CREATE OR REPLACE FUNCTION public.permanently_delete_user_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- This function is designed to be called from Edge Functions with service role
  -- It performs all deletions without auth.uid() check

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
  DELETE FROM public.project_tasks WHERE assigned_to = target_user_id;
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
  
  -- Delete check-in audit logs for organizer
  DELETE FROM public.check_in_audit_log WHERE organizer_id = target_user_id;
  
  -- Delete form templates
  DELETE FROM public.event_form_templates WHERE organizer_id = target_user_id;
  
  -- Finally delete the profile
  DELETE FROM public.profiles WHERE id = target_user_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and return false
    RAISE WARNING 'Error deleting user %: %', target_user_id, SQLERRM;
    RETURN FALSE;
END;
$$;