import { createAdminClient } from "@/lib/supabase/admin";

export type AdminAuditAction =
  | "approve_enrollment"
  | "reject_enrollment"
  | "manual_enroll"
  | "revoke_enrollment"
  | "block_user"
  | "unblock_user"
  | "change_user_role"
  | "create_course"
  | "update_course"
  | "delete_course"
  | "create_lesson"
  | "update_lesson"
  | "delete_lesson"
  | "issue_certificate"
  | "revoke_certificate"
  | "update_site_settings"
  | "delete_message";

export interface LogAdminActionParams {
  adminId: string;
  action: AdminAuditAction | string;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, any>;
  ipAddress?: string | null;
}

/**
 * Persists an immutable administrative audit log entry
 */
export async function logAdminAction(params: LogAdminActionParams): Promise<void> {
  try {
    const adminClient = createAdminClient();
    await adminClient.from("admin_audit_logs").insert([
      {
        admin_id: params.adminId,
        action: params.action,
        target_type: params.targetType,
        target_id: params.targetId || null,
        details: params.details || {},
        ip_address: params.ipAddress || "127.0.0.1",
      },
    ]);
  } catch (err) {
    // Non-blocking: never crash core operation if audit logging fails
    console.error("Failed to write admin audit log:", err);
  }
}
