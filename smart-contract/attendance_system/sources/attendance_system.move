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
        // Share the system object so anyone can create organisations
        // Subscription payments still go to system_owner (deployer address)
        sui::transfer::public_share_object(system);

        // Create and transfer AdminCap to the deployer
        let admin_cap = types::create_admin_cap(ctx);
        sui::transfer::public_transfer(admin_cap, sui::tx_context::sender(ctx));
    }

    // ========== ORGANISATION MANAGEMENT ==========

    /// Create a new organisation (permissionless - anyone can call when system is shared)
    /// Subscription payments will go to the system_owner (deployer)
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

    public fun get_number_student_created(
        system: &AttendanceSystem,
        org: &AttendanceOrganisation,
        ctx: &mut sui::tx_context::TxContext,
    ): u64 {
        student::get_number_students(system, org, ctx)
    }

    public fun get_student_by_card_id(
        system: &AttendanceSystem,
        org: &AttendanceOrganisation,
        card_id: String,
        ctx: &mut sui::tx_context::TxContext,
    ): std::option::Option<address> {
        student::get_student_by_card_id(system, org, card_id, ctx)
    }

    public fun is_student_registered(
        system: &AttendanceSystem,
        org: &AttendanceOrganisation,
        student_addr: address,
        ctx: &mut sui::tx_context::TxContext,
    ): bool {
        student::is_student_registered(system, org, student_addr, ctx)
    }

    // ========== ATTENDANCE RECORDING ==========

    public fun record_attendance(
        system: &AttendanceSystem,
        org: &mut AttendanceOrganisation,
        student_addr: address,
        clock: &Clock,
        ctx: &mut sui::tx_context::TxContext,
    ): RegisterResponse {
        attendance::record_attendance(system, org, student_addr, clock, ctx)
    }

    public fun get_attendance_records_for_student(
        system: &AttendanceSystem,
        org: &AttendanceOrganisation,
        student_addr: address,
        ctx: &mut sui::tx_context::TxContext,
    ): &vector<address> {
        attendance::get_attendance_records_for_student(system, org, student_addr, ctx)
    }

    public fun get_number_attendance_records(
        system: &AttendanceSystem,
        org: &AttendanceOrganisation,
        student_addr: address,
        ctx: &mut sui::tx_context::TxContext,
    ): u64 {
        attendance::get_number_attendance_records(system, org, student_addr, ctx)
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
    /// Can be called by organisation owner or system owner (server)
    public fun check_subscription_active(
        system: &AttendanceSystem,
        org: &AttendanceOrganisation,
        clock: &Clock,
        ctx: &mut sui::tx_context::TxContext,
    ): bool {
        subscription::check_subscription_active(system, org, clock, ctx)
    }

    /// Get subscription status (for view functions)
    /// Can be called by organisation owner or system owner (server)
    public fun get_subscription_status(
        system: &AttendanceSystem,
        org: &AttendanceOrganisation,
        clock: &Clock,
        ctx: &mut sui::tx_context::TxContext,
    ): (bool, u64, u64) {
        subscription::get_subscription_status(system, org, clock, ctx)
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

