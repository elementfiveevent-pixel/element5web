import { supabase } from '@/integrations/supabase/client';

export type ReportContentType = 'materials' | 'news' | 'books' | 'profiles';
export type ReportStatus = 'pending' | 'resolved' | 'ignored';

export const REPORT_REASONS = [
  'Spam or promotional content',
  'Fake or misleading information',
  'Inappropriate or abusive content',
  'Copyright violation',
  'Harassment or hate speech',
  'Scam or fraud',
  'Other',
] as const;

export type ReportReason = typeof REPORT_REASONS[number];

export interface Report {
  id: string;
  content_type: ReportContentType;
  content_id: string;
  reported_user_id: string;
  reporter_id: string;
  reasons: string[];
  comment: string | null;
  status: ReportStatus;
  created_at: string;
  // Joined data
  content_title?: string;
  reported_user_name?: string;
  reporter_name?: string;
}

export async function createReport(
  contentType: ReportContentType,
  contentId: string,
  reportedUserId: string,
  reporterId: string,
  reasons: string[],
  comment?: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('reports').insert({
    content_type: contentType,
    content_id: contentId,
    reported_user_id: reportedUserId,
    reporter_id: reporterId,
    reasons,
    comment: comment || null,
  });

  return { error: error as Error | null };
}

export async function getReports(status?: ReportStatus): Promise<Report[]> {
  let query = supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching reports:', error);
    return []; // Return empty array instead of throwing
  }

  const reports = data || [];

  // Fetch additional info for each report
  for (const report of reports) {
    try {
      // Get reporter name
      const { data: reporterData } = await supabase.rpc('get_contributor_name', {
        user_id: report.reporter_id,
      });
      (report as Report).reporter_name = reporterData || 'Anonymous';

      // Get reported user name
      const { data: reportedData } = await supabase.rpc('get_contributor_name', {
        user_id: report.reported_user_id,
      });
      (report as Report).reported_user_name = reportedData || 'Anonymous';

      // Get content title based on type
      if (report.content_type !== 'profiles') {
        let contentTitle = 'Unknown';
        
        if (report.content_type === 'materials') {
          const { data } = await supabase.from('materials').select('title').eq('id', report.content_id).maybeSingle();
          contentTitle = data?.title || 'Unknown';
        } else if (report.content_type === 'news') {
          const { data } = await supabase.from('news').select('title').eq('id', report.content_id).maybeSingle();
          contentTitle = data?.title || 'Unknown';
        } else if (report.content_type === 'books') {
          const { data } = await supabase.from('books').select('title').eq('id', report.content_id).maybeSingle();
          contentTitle = data?.title || 'Unknown';
        }
        
        (report as Report).content_title = contentTitle;
      } else {
        (report as Report).content_title = (report as Report).reported_user_name;
      }
    } catch {
      (report as Report).reporter_name = 'Anonymous';
      (report as Report).reported_user_name = 'Anonymous';
      (report as Report).content_title = 'Unknown';
    }
  }

  return reports as Report[];
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('reports')
    .update({ status })
    .eq('id', reportId);

  return { error: error as Error | null };
}

export async function deleteReportedContent(
  contentType: ReportContentType,
  contentId: string
): Promise<{ error: Error | null }> {
  if (contentType === 'profiles') {
    return { error: new Error('Cannot delete user profiles directly') };
  }

  const { error } = await supabase
    .from(contentType)
    .delete()
    .eq('id', contentId);

  return { error: error as Error | null };
}

export async function hasUserReported(
  contentType: ReportContentType,
  contentId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('reports')
    .select('id')
    .eq('content_type', contentType)
    .eq('content_id', contentId)
    .eq('reporter_id', userId)
    .maybeSingle();

  return !!data;
}
