// Mock client for local offline testing (temporary bypass)
export const supabase = {
  channel: (channelName: string) => {
    console.log(`[Mock Supabase] Subscribed to channel: ${channelName}`);
    return {
      on: (event: string, filter: any, callback: (payload: any) => void) => {
        return {
          subscribe: () => {
            console.log(`[Mock Supabase] Active channel subscription`);
            return {};
          }
        };
      }
    };
  },
  removeChannel: (channel: any) => {
    console.log(`[Mock Supabase] Channel removed`);
  },
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: File, options?: any) => {
        console.log(`[Mock Supabase] Uploading file to bucket ${bucket} at path ${path}`);
        await new Promise((resolve) => setTimeout(resolve, 850));
        return { data: { path }, error: null };
      },
      getPublicUrl: (path: string) => {
        let url = "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=500&fit=crop";
        if (path.includes("qrs")) {
          url = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=element5@upi%26pn=Element5";
        } else if (path.includes("payments") || path.includes("receipt")) {
          url = "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=400&fit=crop";
        }
        return { data: { publicUrl: url } };
      }
    })
  }
};
