module attendance_system::attendance {
    use sui::object::Self;
    use sui::transfer;
    use std::vector;
    use 0x2::table;
    use sui::clock::Clock;
    use attendance_system::types::{Self as types, AttendanceSystem, AttendanceOrganisation, AttendanceRecord, RegisterResponse};
    use attendance_system::events;
    use attendance_system::constants;
    use attendance_system::subscription;

    /// Record attendance for a student
    /// Can be called by organisation owner or system owner (server)
    public fun record_attendance(
        system: &AttendanceSystem,
        org: &mut AttendanceOrganisation,
        student_addr: address,
        clock: &Clock,
        ctx: &mut sui::tx_context::TxContext,
    ): RegisterResponse {
        // Access control: allow organisation owner or system owner (server)
        let caller = sui::tx_context::sender(ctx);
        assert!(types::verify_owner_or_system(org, system, caller), constants::e_unauthorized());

        // Check if subscription is active before recording attendance
        // Note: check_subscription_active also does access control, but caller is already verified above
        assert!(subscription::check_subscription_active(system, org, clock, ctx), constants::e_subscription_expired());

        // Validate that student belongs to this organization
        assert!(table::contains(types::get_records_by_student(org), student_addr), constants::e_student_not_found());

        // Use on-chain clock timestamp to prevent manipulation
        let timestamp = sui::clock::timestamp_ms(clock);

        let rec = types::create_attendance_record(student_addr, timestamp, ctx);
        let rec_addr: address = object::id(&rec).to_address();
        
        let records_vec = table::borrow_mut(types::get_records_by_student_mut(org), student_addr);
        vector::push_back(records_vec, rec_addr);

        sui::transfer::public_transfer(rec, types::get_org_owner(org));

        events::emit_attendance_recorded(
            rec_addr,
            student_addr,
            timestamp,
            object::id(org).to_address(),
        );

        types::create_register_response(std::string::utf8(b"Attendance recorded"))
    }

    /// Get attendance records for a student
    /// Can be called by organisation owner or system owner (server)
    public fun get_attendance_records_for_student(
        system: &AttendanceSystem,
        org: &AttendanceOrganisation,
        student_addr: address,
        ctx: &mut sui::tx_context::TxContext,
    ): &vector<address> {
        // Access control: allow organisation owner or system owner (server)
        let caller = sui::tx_context::sender(ctx);
        assert!(types::verify_owner_or_system(org, system, caller), constants::e_unauthorized());
        table::borrow(types::get_records_by_student(org), student_addr)
    }

    /// Get number of attendance records for a student
    /// Can be called by organisation owner or system owner (server)
    public fun get_number_attendance_records(
        system: &AttendanceSystem,
        org: &AttendanceOrganisation,
        student_addr: address,
        ctx: &mut sui::tx_context::TxContext,
    ): u64 {
        // Access control: allow organisation owner or system owner (server)
        let caller = sui::tx_context::sender(ctx);
        assert!(types::verify_owner_or_system(org, system, caller), constants::e_unauthorized());
        let records = table::borrow(types::get_records_by_student(org), student_addr);
        vector::length(records)
    }
}

