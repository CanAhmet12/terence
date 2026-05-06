<?php

namespace App\Observers;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class UserAuditObserver
{
    /**
     * Handle the User "updating" event.
     * Log changes to critical fields: grade, target_exam, role
     */
    public function updating(User $user): void
    {
        // Critical fields to audit
        $auditFields = ['grade', 'target_exam', 'role'];
        
        $changes = [];
        foreach ($auditFields as $field) {
            if ($user->isDirty($field)) {
                $changes[] = [
                    'user_id' => $user->id,
                    'field_name' => $field,
                    'old_value' => $user->getOriginal($field),
                    'new_value' => $user->$field,
                    'changed_by' => Auth::id(),
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }
        
        if (!empty($changes)) {
            // Insert into audit_logs table
            // Note: Assumes audit_logs table exists with these columns
            try {
                DB::table('audit_logs')->insert($changes);
            } catch (\Exception $e) {
                // Log error but don't block the update
                \Log::error('Failed to write audit log: ' . $e->getMessage());
            }
        }
    }
}
