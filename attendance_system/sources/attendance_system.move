/// Main module: Central orchestration module for the Attendance System
/// This module provides high-level entry points that coordinate all sub-modules
module attendance_system::attendance_system {
    use std::string::String;
    use std::vector;
    use sui::coin::Coin;
    use sui::sui::SUI;
    use sui::clock::Clock;
    
    // Import sub-modules
    use attendance_system::organisation::{Self};
    use attendance_system::student::{Self};
    use attendance_system::attendance::{Self};
    use attendance_system::subscription::{Self};
    
    // Import types for internal use
    use attendance_system::types::{
        AttendanceSystem,
        AttendanceOrganisation,
        RegisterResponse,
    };

    // ========== INITIALIZATION ==========

    fun init(ctx: &mut sui::tx_context::TxContext) {
        use attendance_system::types::{Self as types};
        
        let system = types::create_attendance_system(
            vector::empty<address>(),
            sui::tx_context::sender(ctx),
            ctx,
        );
        sui::transfer::public_transfer(system, sui::tx_context::sender(ctx));

        // Create and transfer AdminCap to the deployer
        let admin_cap = types::create_admin_cap(ctx);
        sui::transfer::public_transfer(admin_cap, sui::tx_context::sender(ctx));
    }

    // ========== ORGANISATION MANAGEMENT ==========

    public fun create_organisation(
        system: &mut AttendanceSystem,
        name: String,
        ctx: &mut sui::tx_context::TxContext,
    ): RegisterResponse {
        organisation::create_organisation(system, name, ctx)
    }

    public fun get_number_of_organisation_created(system: &AttendanceSystem): u64 {
        organisation::get_number_of_organisations(system)
    }

    public fun get_org_owner(org: &AttendanceOrganisation): address {
        organisation::get_org_owner(org)
    }

    // ========== STUDENT MANAGEMENT ==========

    public fun register_student(
        org: &mut AttendanceOrganisation,
        name: String,
        card_id: String,
        department: String,
        ctx: &mut sui::tx_context::TxContext,
    ): RegisterResponse {
        student::register_student(org, name, card_id, department, ctx)
    }

    public fun get_number_student_created(org: &AttendanceOrganisation): u64 {
        student::get_number_students(org)
    }

    public fun get_student_by_card_id(org: &AttendanceOrganisation, card_id: String): std::option::Option<address> {
        student::get_student_by_card_id(org, card_id)
    }

    public fun is_student_registered(org: &AttendanceOrganisation, student_addr: address): bool {
        student::is_student_registered(org, student_addr)
    }

    // ========== ATTENDANCE RECORDING ==========

    public fun record_attendance(
        org: &mut AttendanceOrganisation,
        student_addr: address,
        clock: &Clock,
        ctx: &mut sui::tx_context::TxContext,
    ): RegisterResponse {
        attendance::record_attendance(org, student_addr, clock, ctx)
    }

    public fun get_attendance_records_for_student(
        org: &AttendanceOrganisation,
        student_addr: address,
    ): &vector<address> {
        attendance::get_attendance_records_for_student(org, student_addr)
    }

    public fun get_number_attendance_records(org: &AttendanceOrganisation, student_addr: address): u64 {
        attendance::get_number_attendance_records(org, student_addr)
    }

    // ========== SUBSCRIPTION MANAGEMENT ==========

    /// Pay subscription fee (10 SUI) to extend subscription by 30 days
    public entry fun pay_subscription(
        system: &AttendanceSystem,
        org: &mut AttendanceOrganisation,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut sui::tx_context::TxContext,
    ) {
        subscription::pay_subscription(system, org, payment, clock, ctx)
    }

    /// Check if subscription is active
    public fun check_subscription_active(org: &AttendanceOrganisation, clock: &Clock): bool {
        subscription::check_subscription_active(org, clock)
    }

    /// Get subscription status (for view functions)
    public fun get_subscription_status(org: &AttendanceOrganisation, clock: &Clock): (bool, u64, u64) {
        subscription::get_subscription_status(org, clock)
    }

    // ========== SYSTEM QUERIES ==========

    public fun get_system_owner(system: &AttendanceSystem): address {
        attendance_system::types::get_system_owner(system)
    }

    // ========== TEST HELPERS ==========

    #[test_only]
    public fun init_for_testing(ctx: &mut sui::tx_context::TxContext) { 
        init(ctx) 
    }
    
    #[test_only]
    public fun get_student_address(org: &AttendanceOrganisation, index: u64): address {
        student::get_student_address(org, index)
    }
}
