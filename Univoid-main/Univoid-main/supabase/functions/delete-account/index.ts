import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  // Rate Limiting
  const { allowRequest } = await import("../_shared/rateLimiter.ts");
  const authHeader = req.headers.get("Authorization");
  // Use auth token as key if available, otherwise IP (though delete requires auth)
  const rateKey = authHeader ? authHeader.substring(0, 20) : (req.headers.get("x-forwarded-for") || "unknown");

  if (!allowRequest(rateKey, 5, 20)) {
    return new Response(
      JSON.stringify({ success: false, message: "Too many requests" }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const logs: string[] = [];
  const log = (message: string) => {
    console.log(message);
    logs.push(`${new Date().toISOString()}: ${message}`);
  };

  // ALWAYS return 200, use success flag in response
  const respond = (success: boolean, message: string, extra: Record<string, unknown> = {}) => {
    return new Response(
      JSON.stringify({ success, message, logs, ...extra }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  };

  try {
    log("Starting account deletion process");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      log("ERROR: Missing authorization header");
      return respond(false, "Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      log("ERROR: Missing environment variables");
      return respond(false, "Server configuration error");
    }

    // Step 1: Verify user token using anon key
    log("Step 1: Verifying user token");
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      log(`ERROR: Invalid token - ${userError?.message || 'No user found'}`);
      return respond(false, "Invalid or expired token");
    }

    const userId = user.id;
    const userEmail = user.email;
    log(`User verified: ${userId} (${userEmail})`);

    // Create admin client with service role for all operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Step 2: Check if user profile exists (idempotency check)
    log("Step 2: Checking if user exists");
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      log(`Warning: Could not check profile - ${profileError.message}`);
    }

    if (!profile) {
      log("User profile not found - may already be deleted, checking auth");

      // Try to delete from auth anyway (idempotent)
      try {
        const { error: authCheckError } = await adminClient.auth.admin.deleteUser(userId);
        if (authCheckError && !authCheckError.message.includes("not found")) {
          log(`Auth deletion returned: ${authCheckError.message}`);
        }
      } catch (e) {
        log(`Auth check exception: ${e}`);
      }

      return respond(true, "Account already deleted or not found");
    }

    // Step 3: Delete all user data using the admin function
    log("Step 3: Deleting all user data via permanently_delete_user_admin");
    const { data: deleteResult, error: deleteDataError } = await adminClient.rpc(
      "permanently_delete_user_admin",
      { target_user_id: userId }
    );

    if (deleteDataError) {
      log(`ERROR in data deletion: ${deleteDataError.message}`);
      log(`Error code: ${deleteDataError.code || 'N/A'}`);
      return respond(false, "Failed to delete user data", {
        error_code: deleteDataError.code,
        error_detail: deleteDataError.message
      });
    }

    if (deleteResult === false) {
      log("WARNING: Delete function returned false, but continuing");
    } else {
      log("User data deleted successfully");
    }

    // Step 4: Sign out all sessions
    log("Step 4: Signing out all user sessions");
    try {
      await adminClient.auth.admin.signOut(userId, 'global');
      log("All sessions signed out");
    } catch (signOutError: unknown) {
      const errMsg = signOutError instanceof Error ? signOutError.message : 'Unknown';
      log(`Warning: Session signout issue - ${errMsg} (non-critical)`);
    }

    // Step 5: Delete the auth user
    log("Step 5: Deleting auth user record");
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      // Check if already deleted
      if (authDeleteError.message.includes("not found") || authDeleteError.message.includes("User not found")) {
        log("Auth user already deleted");
      } else {
        log(`ERROR deleting auth user: ${authDeleteError.message}`);
        return respond(false, "Failed to delete authentication record", {
          error_detail: authDeleteError.message
        });
      }
    } else {
      log("Auth user deleted successfully");
    }

    log("=== ACCOUNT DELETION COMPLETED SUCCESSFULLY ===");
    return respond(true, "Account permanently deleted");

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    const errStack = error instanceof Error ? error.stack : undefined;
    console.error("Delete account error:", error);
    log(`FATAL ERROR: ${errMsg}`);
    if (errStack) {
      log(`Stack: ${errStack.substring(0, 500)}`);
    }

    // Still return 200, but with success=false
    return respond(false, "Internal server error", { error_detail: errMsg });
  }
});
