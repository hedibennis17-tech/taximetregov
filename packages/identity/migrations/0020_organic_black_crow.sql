ALTER TABLE "profile_audit_events" DROP CONSTRAINT "profile_audit_events_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "profile_audit_events" ADD CONSTRAINT "profile_audit_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;