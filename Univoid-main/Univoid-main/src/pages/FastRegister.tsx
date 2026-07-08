import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { fetchEventById, checkUserRegistration } from "@/services/eventsService";
import { uploadPaymentScreenshot } from "@/services/registrationService";
import { useMobileValidation } from "@/hooks/useMobileValidation";
import { useRateLimiter } from "@/hooks/useRateLimiter";
import UpsellScreen from "@/components/events/UpsellScreen";
import { toDisplayUrl } from "@/lib/storageProxy";
import { validateFileUpload } from "@/lib/fileValidation";
import {
  fetchEventUpsells,
  fetchUpsellSettings,
  type EventUpsell,
  type SelectedUpsell,
  calculateTotalWithUpsells,
} from "@/services/upsellService";
import {
  Zap,
  Calendar,
  MapPin,
  Loader2,
  Phone,
  CheckCircle,
  ArrowRight,
  Ticket,
  Upload,
  CreditCard,
  Clock,
  IndianRupee,
  AlertCircle,
  ArrowLeft
} from "lucide-react";

type Step = 'auth' | 'phone' | 'upsells' | 'payment' | 'register' | 'complete';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const FastRegister = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, refreshProfile, isLoading: authLoading } = useAuth();

  const [step, setStep] = useState<Step>('auth');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  // Payment state for paid events
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [isUploadingPayment, setIsUploadingPayment] = useState(false);

  // Upsell state
  const [groupSize, setGroupSize] = useState(1);
  const [selectedUpsells, setSelectedUpsells] = useState<SelectedUpsell[]>([]);

  // Mobile validation
  const {
    isChecking: isCheckingMobile,
    isDuplicate: isMobileDuplicate,
    isValidFormat: isValidMobileFormat,
    checkMobileExists
  } = useMobileValidation({ excludeUserId: user?.id });

  // Rate Limiter
  const { checkLimit: checkAuthLimit } = useRateLimiter({
    key: 'auth_google_fast_register',
    limit: 5,
    window: 60000,
  });

  // Check mobile when it changes
  useEffect(() => {
    if (mobileNumber.length === 10) {
      const timer = setTimeout(() => {
        checkMobileExists(mobileNumber);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [mobileNumber, checkMobileExists]);

  // Fetch event data
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => fetchEventById(eventId!),
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
  });

  // Check if user already registered - use event.id (actual UUID) for DB queries
  const { data: existingRegistration, refetch: refetchRegistration } = useQuery({
    queryKey: ["registration", event?.id, user?.id],
    queryFn: () => checkUserRegistration(event!.id, user!.id),
    enabled: !!event?.id && !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch upsell settings and upsells - use event.id for DB queries
  const { data: upsellSettings } = useQuery({
    queryKey: ["upsell-settings", event?.id],
    queryFn: () => fetchUpsellSettings(event!.id),
    enabled: !!event?.id && !!event?.is_paid,
  });

  const { data: upsells = [] } = useQuery({
    queryKey: ["event-upsells", event?.id],
    queryFn: () => fetchEventUpsells(event!.id),
    enabled: !!event?.id && !!event?.is_paid && !!upsellSettings?.upsell_enabled,
  });

  // Calculate price with upsells
  const groupOffers = useMemo(() =>
    upsells.filter(u => u.upsell_type === 'group_offer'),
    [upsells]
  );

  const priceCalculation = useMemo(() => {
    const basePrice = event?.price || 0;
    return calculateTotalWithUpsells(basePrice, groupSize, selectedUpsells, groupOffers);
  }, [event?.price, groupSize, selectedUpsells, groupOffers]);

  // Check if upsells are available
  const hasUpsells = upsellSettings?.upsell_enabled && upsells.length > 0;

  // Determine current step based on user state
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setStep('auth');
    } else if (!profile?.mobile_number) {
      setStep('phone');
    } else if (existingRegistration) {
      setStep('complete');
      fetchTicketId();
    } else if (event?.is_paid) {
      // For paid events, show upsells first if available
      if (hasUpsells) {
        setStep('upsells');
      } else {
        setStep('payment');
      }
    } else {
      setStep('register');
    }
  }, [user, profile, authLoading, existingRegistration, event, hasUpsells]);

  const fetchTicketId = async () => {
    if (!user || !eventId) return;
    const { data } = await supabase
      .from('event_tickets')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();
    if (data) setTicketId(data.id);
  };

  // Progress calculation
  const getTotalSteps = () => {
    if (!event?.is_paid) return 3; // auth, phone/skip, register
    if (hasUpsells) return 5; // auth, phone/skip, upsells, payment, register
    return 4; // auth, phone/skip, payment, register
  };

  const getStepNumber = () => {
    if (step === 'auth') return 1;
    if (step === 'phone') return 2;
    if (step === 'upsells') return 3;
    if (step === 'payment') return hasUpsells ? 4 : 3;
    if (step === 'register') return getTotalSteps();
    return getTotalSteps();
  };

  const totalSteps = getTotalSteps();
  const stepNumber = getStepNumber();
  const progress = (stepNumber / totalSteps) * 100;

  const handleGoogleSignIn = async () => {
    if (!eventId) return;
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/register/${eventId}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        toast({
          title: "Sign-in failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to sign in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSavePhone = async () => {
    if (!isValidMobileFormat(mobileNumber)) {
      toast({
        title: "Invalid number",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate before saving
    const exists = await checkMobileExists(mobileNumber);
    if (exists) {
      toast({
        title: "Number already in use",
        description: "This mobile number is already registered. Please use a different number.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingPhone(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          mobile_number: mobileNumber.replace(/\s/g, ''),
          phone_verified: false,
          profile_type: 'quick',
          onboarding_status: 'partial',
        })
        .eq('id', user!.id);

      if (error) {
        // Handle unique constraint violation
        if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
          toast({
            title: "Number already in use",
            description: "This mobile number is already registered. Please use a different number.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Phone saved!",
        description: "Proceeding to registration",
      });

      if (refreshProfile) await refreshProfile();

      // Go to upsells step for paid events with upsells, payment otherwise
      if (event?.is_paid) {
        if (hasUpsells) {
          setStep('upsells');
        } else {
          setStep('payment');
        }
      } else {
        setStep('register');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save phone number",
        variant: "destructive",
      });
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handlePaymentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateFileUpload(file, 'image');
      if (validationError) {
        toast({
          title: "Invalid file",
          description: validationError,
          variant: "destructive",
        });
        return;
      }
      setPaymentScreenshot(file);
    }
  };

  const handleUpsellContinue = () => {
    setStep('payment');
  };

  const handleUpsellSkip = () => {
    setSelectedUpsells([]);
    setGroupSize(1);
    setStep('payment');
  };

  const handleProceedToRegister = () => {
    if (!paymentScreenshot && event?.is_paid) {
      toast({
        title: "Payment screenshot required",
        description: "Please upload your payment screenshot to proceed",
        variant: "destructive",
      });
      return;
    }
    setStep('register');
  };

  const handleQuickRegister = async () => {
    if (!user || !event) return;

    // UUID validation - use event.id (actual UUID) not eventId (URL param which could be a slug)
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(event.id) || !UUID_REGEX.test(user.id)) {
      toast({
        title: "Invalid request",
        description: "Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsRegistering(true);
    try {
      let screenshotUrl: string | null = null;

      // Upload payment screenshot for paid events - use event.id for consistent path
      if (event.is_paid && paymentScreenshot) {
        setIsUploadingPayment(true);
        try {
          screenshotUrl = await uploadPaymentScreenshot(paymentScreenshot, user.id, event.id);
        } catch (uploadError: any) {
          toast({
            title: "Upload failed",
            description: "Failed to upload payment screenshot. Please try again.",
            variant: "destructive",
          });
          setIsUploadingPayment(false);
          setIsRegistering(false);
          return;
        }
        setIsUploadingPayment(false);
      }

      // Include upsell data in custom_data
      const customData = event.is_paid && hasUpsells ? {
        _group_size: groupSize,
        _base_amount: priceCalculation.baseTotal,
        _addons_amount: priceCalculation.addonsTotal,
        _total_amount: priceCalculation.finalTotal,
        _selected_addons: selectedUpsells.map(u => ({
          name: u.upsell.name,
          quantity: u.quantity,
          price: u.totalPrice,
        })),
      } : {};

      const { data, error } = await supabase.rpc('register_for_event_atomic', {
        p_event_id: event.id,
        p_user_id: user.id,
        p_custom_data: customData,
        p_payment_screenshot_url: screenshotUrl,
        p_group_size: groupSize,
        p_is_group_booking: groupSize > 1,
      });

      if (error) throw error;

      const result = data as { success: boolean; registration_id?: string; ticket_id?: string; error?: string };

      if (result.success) {
        // Different toast messages for paid vs free events
        if (event.is_paid) {
          toast({
            title: "Registration Submitted! ⏳",
            description: "Awaiting organizer approval. You'll get a ticket once approved.",
          });
        } else {
          toast({
            title: "Registration Complete! 🎉",
            description: "Your ticket has been generated",
          });
          setTicketId(result.ticket_id || null);
        }
        await refetchRegistration();
        setStep('complete');
      } else {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  // Loading state
  if (eventLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-x-hidden">
        <Card className="w-full max-w-md box-border">
          <CardContent className="p-8">
            <Skeleton className="h-8 w-3/4 mx-auto mb-4" />
            <Skeleton className="h-4 w-1/2 mx-auto mb-8" />
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Event not found
  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-x-hidden">
        <Card className="w-full max-w-md text-center box-border">
          <CardContent className="p-8">
            <h1 className="text-xl font-bold mb-4">Event Not Found</h1>
            <Link to="/events">
              <Button>Browse Events</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if quick registration is disabled for this event
  if ((event as any).enable_quick_register === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-x-hidden">
        <Card className="w-full max-w-md text-center box-border">
          <CardContent className="p-8 space-y-4">
            <h1 className="text-xl font-bold">Quick Registration Not Available</h1>
            <p className="text-muted-foreground">
              This event requires full registration details.
            </p>
            <Link to={`/events/${eventId}`}>
              <Button className="w-full">View Event & Register</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if registration is pending payment approval for paid events
  const isPendingApproval = existingRegistration &&
    event.is_paid &&
    existingRegistration.payment_status === 'pending';

  const isApproved = existingRegistration &&
    existingRegistration.payment_status === 'approved';

  const isRejected = existingRegistration &&
    existingRegistration.payment_status === 'rejected';

  // Calculate display price
  const displayPrice = hasUpsells ? priceCalculation.finalTotal : (event.price || 0);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 overflow-x-hidden">
      {/* Progress */}
      <div className="w-full max-w-md mb-4 px-1 box-border">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground text-center mt-2">
          Step {stepNumber} of {totalSteps}
        </p>
      </div>

      <Card className="w-full max-w-md overflow-hidden box-border">
        {/* Event Header */}
        <div className="bg-primary px-6 py-6 text-primary-foreground">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5" />
            <span className="text-sm font-medium">Quick Registration</span>
          </div>
          <h1 className="text-xl font-bold mb-2 line-clamp-2 break-words">{event.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-primary-foreground/80">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(event.start_date), "MMM d, yyyy")}</span>
            </div>
            {event.venue_name && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span className="truncate max-w-[150px]">{event.venue_name}</span>
              </div>
            )}
          </div>
          {/* Price badge */}
          <div className="mt-3">
            <Badge variant={event.is_paid ? "secondary" : "outline"} className="text-primary-foreground border-primary-foreground/30">
              {event.is_paid ? (
                <span className="flex items-center gap-1">
                  <IndianRupee className="w-3 h-3" />
                  {displayPrice}
                </span>
              ) : "Free"}
            </Badge>
          </div>
        </div>

        <CardContent className="p-6 overflow-hidden">
          {/* Step: Google Auth */}
          {step === 'auth' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold mb-2">Sign in to Register</h2>
                <p className="text-sm text-muted-foreground">
                  Quick registration in seconds — no password needed
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full h-14 font-bold text-base"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                <span className="ml-3">Continue with Google</span>
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By continuing, you agree to our{" "}
                <Link to="/terms" className="text-foreground font-semibold hover:underline">Terms</Link>
                {" "}and{" "}
                <Link to="/privacy-policy" className="text-foreground font-semibold hover:underline">Privacy Policy</Link>
              </p>
            </div>
          )}

          {/* Step: Phone Number */}
          {step === 'phone' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold mb-2">Add Your Phone</h2>
                <p className="text-sm text-muted-foreground">
                  We'll use this to contact you about the event
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 bg-muted rounded-l-md border border-r-0 border-input">
                      <span className="text-sm text-muted-foreground">+91</span>
                    </div>
                    <Input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit number"
                      className="rounded-l-none"
                      maxLength={10}
                    />
                  </div>
                  {mobileNumber && !isValidMobileFormat(mobileNumber) && (
                    <p className="text-xs text-destructive">Enter exactly 10 digits</p>
                  )}
                  {mobileNumber && isValidMobileFormat(mobileNumber) && isMobileDuplicate && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      This mobile number is already in use
                    </p>
                  )}
                  {isCheckingMobile && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Checking...
                    </p>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={handleSavePhone}
                  disabled={!isValidMobileFormat(mobileNumber) || isMobileDuplicate || isCheckingMobile || isSavingPhone}
                >
                  {isSavingPhone ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    <>Continue <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step: Upsells (for paid events with upsells) */}
          {step === 'upsells' && event.is_paid && hasUpsells && (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('phone')}
                className="mb-2 -ml-2"
                disabled={!!profile?.mobile_number}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <UpsellScreen
                upsells={upsells}
                basePrice={event.price || 0}
                groupSize={groupSize}
                onGroupSizeChange={setGroupSize}
                selectedUpsells={selectedUpsells}
                onUpsellsChange={setSelectedUpsells}
                onContinue={handleUpsellContinue}
                onSkip={handleUpsellSkip}
              />
            </div>
          )}

          {/* Step: Payment (for paid events only) */}
          {step === 'payment' && event.is_paid && (
            <div className="space-y-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => hasUpsells ? setStep('upsells') : setStep('phone')}
                className="mb-2 -ml-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>

              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold mb-2">Complete Payment</h2>
                <p className="text-sm text-muted-foreground">
                  Pay ₹{displayPrice} and upload screenshot for verification
                </p>
              </div>

              {/* Price breakdown for upsells */}
              {hasUpsells && (groupSize > 1 || selectedUpsells.length > 0) && (
                <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base ({groupSize} × ₹{event.price})</span>
                    <span>₹{priceCalculation.baseTotal}</span>
                  </div>
                  {priceCalculation.discounts > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Group Discount</span>
                      <span>-₹{priceCalculation.discounts}</span>
                    </div>
                  )}
                  {priceCalculation.addonsTotal > 0 && (
                    <div className="flex justify-between">
                      <span>Add-ons</span>
                      <span>+₹{priceCalculation.addonsTotal}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base pt-2 border-t">
                    <span>Total</span>
                    <span>₹{priceCalculation.finalTotal}</span>
                  </div>
                </div>
              )}

              {/* Payment Instructions */}
              <div className="bg-muted rounded-xl p-4 space-y-4">
                <p className="text-sm font-medium text-center">Scan QR or use UPI ID to pay</p>

                {/* UPI QR Code */}
                {event.upi_qr_url && (
                  <div className="bg-white p-4 rounded-xl w-fit mx-auto">
                    <img
                      src={toDisplayUrl(event.upi_qr_url, { forceImage: true }) || undefined}
                      alt="UPI QR Code"
                      className="w-48 h-48 object-contain max-w-full"
                    />
                  </div>
                )}

                {/* UPI ID */}
                {event.upi_vpa && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">UPI ID</p>
                    <code className="bg-background px-3 py-1.5 rounded text-sm font-mono break-all">
                      {event.upi_vpa}
                    </code>
                  </div>
                )}

                {/* Amount */}
                <div className="flex items-center justify-center gap-2 text-lg font-bold">
                  <IndianRupee className="w-5 h-5" />
                  <span>{displayPrice}</span>
                </div>
              </div>

              {/* Upload Screenshot */}
              <div className="space-y-2">
                <Label>Upload Payment Screenshot *</Label>
                <div className="border-2 border-dashed rounded-xl p-6 text-center">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handlePaymentFileChange}
                    className="hidden"
                    id="payment-screenshot"
                  />
                  <label htmlFor="payment-screenshot" className="cursor-pointer flex flex-col items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${paymentScreenshot ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'
                      }`}>
                      {paymentScreenshot ? (
                        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground break-all max-w-full">
                      {paymentScreenshot ? paymentScreenshot.name : "Click to upload screenshot"}
                    </span>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Max 5MB. Supports JPG, PNG, WEBP
                </p>
              </div>

              <Button
                className="w-full"
                onClick={handleProceedToRegister}
                disabled={!paymentScreenshot}
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step: Confirm Registration */}
          {step === 'register' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-lg font-semibold mb-2">
                  {event.is_paid ? "Submit Registration" : "Ready to Register!"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {event.is_paid
                    ? "Review details and submit for approval"
                    : "Confirm your registration for this event"
                  }
                </p>
              </div>

              {/* User info summary */}
              <div className="bg-muted rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium break-words max-w-[180px] text-right">{profile?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium truncate max-w-[180px]">{profile?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">+91 {profile?.mobile_number}</span>
                </div>
              </div>

              {/* Event info */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event</span>
                  <span className="font-medium text-right max-w-[180px] truncate">{event.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{format(new Date(event.start_date), "MMM d, yyyy")}</span>
                </div>
                {hasUpsells && groupSize > 1 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Group Size</span>
                    <span className="font-medium">{groupSize} tickets</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <Badge variant={event.is_paid ? "default" : "secondary"}>
                    {event.is_paid ? `₹${displayPrice}` : "Free"}
                  </Badge>
                </div>
                {event.is_paid && paymentScreenshot && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Payment</span>
                    <span className="text-green-600 dark:text-green-400 flex items-center gap-1 text-xs">
                      <CheckCircle className="w-3 h-3" /> Screenshot uploaded
                    </span>
                  </div>
                )}
              </div>

              {event.is_paid && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3">
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                    <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                      Your ticket will be generated after the organizer approves your payment.
                      You'll receive a notification once approved.
                    </span>
                  </p>
                </div>
              )}

              <Button
                className="w-full h-12"
                onClick={handleQuickRegister}
                disabled={isRegistering || isUploadingPayment}
              >
                {isUploadingPayment ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                ) : isRegistering ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registering...</>
                ) : (
                  <>{event.is_paid ? "Submit for Approval" : "Confirm Registration"} <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </div>
          )}

          {/* Step: Complete */}
          {step === 'complete' && (
            <div className="space-y-6">
              <div className="text-center">
                {isPendingApproval ? (
                  <>
                    <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Payment Pending ⏳</h2>
                    <p className="text-sm text-muted-foreground">
                      Awaiting organizer approval. You'll get a notification and ticket once approved.
                    </p>
                  </>
                ) : isRejected ? (
                  <>
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Payment Rejected</h2>
                    <p className="text-sm text-muted-foreground">
                      Your payment was not approved. Please contact the organizer for more details.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Ticket className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">You're Registered! 🎉</h2>
                    <p className="text-sm text-muted-foreground">
                      {isApproved || !event.is_paid
                        ? "Your ticket has been generated"
                        : "Your registration is confirmed"
                      }
                    </p>
                  </>
                )}
              </div>

              <div className="space-y-3">
                {(isApproved || !event.is_paid) && ticketId && (
                  <Link to={`/my-tickets`} className="block">
                    <Button className="w-full" size="lg">
                      View My Ticket
                    </Button>
                  </Link>
                )}

                <Link to={`/events/${eventId}`} className="block">
                  <Button variant="outline" className="w-full">
                    View Event Details
                  </Button>
                </Link>

                <Link to="/events" className="block">
                  <Button variant="ghost" className="w-full">
                    Browse More Events
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skip to login for existing users */}
      {step === 'auth' && (
        <p className="text-sm text-muted-foreground mt-4 text-center">
          Already have an account?{" "}
          <Link to={`/events/${eventId}`} className="text-foreground font-semibold hover:underline">
            Login here
          </Link>
        </p>
      )}
    </div>
  );
};

export default FastRegister;