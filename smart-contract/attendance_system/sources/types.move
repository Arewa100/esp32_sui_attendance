module attendance_system::types {
    use std::string::String;
    use sui::object::{Self, UID};
    use std::vector;
    use std::option::Option;
    use 0x2::table;

    // ========== TYPE DEFINITIONS ==========
    
    public struct AttendanceSystem has key, store {
        id: UID,
        organisations: vector<address>,
        system_owner: address,
    }

    // Changed from owned to shared object so server (system owner) can sign transactions
    // Access control is enforced via owner field checks in functions
    public struct AttendanceOrganisation has key {
        id: UID,
        name: String,
        owner: address,
        students: vector<address>,
        records_by_student: table::Table<address, vector<address>>,
        card_id_to_student: table::Table<String, address>,
        subscription: Option<Subscription>,
    }

    public struct Subscription has key, store {
        id: UID,
        expiry_timestamp: u64,
        payment_amount: u64,
        is_active: bool,
    }

    public struct AdminCap has key, store {
        id: UID,
    }

    public fun create_admin_cap(ctx: &mut sui::tx_context::TxContext): AdminCap {
        AdminCap {
            id: object::new(ctx),
        }
    }

    public struct Student has key, store {
        id: UID,
        name: String,
        department: String,
        card_id: String,
    }

    public struct AttendanceRecord has key, store {
        id: UID,
        student_id: address,
        timestamp: u64,
    }

    public struct RegisterResponse has copy, drop {
        message: String,
    }

    // ========== ATTENDANCE SYSTEM GETTERS/SETTERS ==========

    public fun create_attendance_system(
        organisations: vector<address>,
        system_owner: address,
        ctx: &mut sui::tx_context::TxContext,
    ): AttendanceSystem {
        AttendanceSystem {
            id: object::new(ctx),
            organisations,
            system_owner,
        }
    }

    public fun get_system_id(system: &AttendanceSystem): &UID {
        &system.id
    }

    public fun get_organisations(system: &AttendanceSystem): &vector<address> {
        &system.organisations
    }

    public fun get_organisations_mut(system: &mut AttendanceSystem): &mut vector<address> {
        &mut system.organisations
    }

    public fun get_system_owner(system: &AttendanceSystem): address {
        system.system_owner
    }

    // ========== ATTENDANCE ORGANISATION GETTERS/SETTERS ==========

    public fun create_attendance_organisation(
        name: String,
        owner: address,
        students: vector<address>,
        records_by_student: table::Table<address, vector<address>>,
        card_id_to_student: table::Table<String, address>,
        subscription: Option<Subscription>,
        ctx: &mut sui::tx_context::TxContext,
    ): AttendanceOrganisation {
        AttendanceOrganisation {
            id: object::new(ctx),
            name,
            owner,
            students,
            records_by_student,
            card_id_to_student,
            subscription,
        }
    }

    public fun get_org_id(org: &AttendanceOrganisation): &UID {
        &org.id
    }

    public fun get_org_name(org: &AttendanceOrganisation): &String {
        &org.name
    }

    public fun get_org_owner(org: &AttendanceOrganisation): address {
        org.owner
    }

    public fun get_students(org: &AttendanceOrganisation): &vector<address> {
        &org.students
    }

    public fun get_students_mut(org: &mut AttendanceOrganisation): &mut vector<address> {
        &mut org.students
    }

    public fun get_records_by_student(org: &AttendanceOrganisation): &table::Table<address, vector<address>> {
        &org.records_by_student
    }

    public fun get_records_by_student_mut(org: &mut AttendanceOrganisation): &mut table::Table<address, vector<address>> {
        &mut org.records_by_student
    }

    public fun get_card_id_to_student(org: &AttendanceOrganisation): &table::Table<String, address> {
        &org.card_id_to_student
    }

    public fun get_card_id_to_student_mut(org: &mut AttendanceOrganisation): &mut table::Table<String, address> {
        &mut org.card_id_to_student
    }

    public fun get_subscription(org: &AttendanceOrganisation): &Option<Subscription> {
        &org.subscription
    }

    public fun get_subscription_mut(org: &mut AttendanceOrganisation): &mut Option<Subscription> {
        &mut org.subscription
    }

    // ========== SUBSCRIPTION GETTERS/SETTERS ==========

    public fun create_subscription(
        expiry_timestamp: u64,
        payment_amount: u64,
        is_active: bool,
        ctx: &mut sui::tx_context::TxContext,
    ): Subscription {
        Subscription {
            id: object::new(ctx),
            expiry_timestamp,
            payment_amount,
            is_active,
        }
    }

    public fun get_subscription_id(subscription: &Subscription): &UID {
        &subscription.id
    }

    public fun get_expiry_timestamp(subscription: &Subscription): u64 {
        subscription.expiry_timestamp
    }

    public fun set_expiry_timestamp(subscription: &mut Subscription, expiry: u64) {
        subscription.expiry_timestamp = expiry;
    }

    public fun get_payment_amount(subscription: &Subscription): u64 {
        subscription.payment_amount
    }

    public fun set_payment_amount(subscription: &mut Subscription, amount: u64) {
        subscription.payment_amount = amount;
    }

    public fun get_is_active(subscription: &Subscription): bool {
        subscription.is_active
    }

    public fun set_is_active(subscription: &mut Subscription, active: bool) {
        subscription.is_active = active;
    }

    // ========== STUDENT GETTERS/SETTERS ==========

    public fun create_student(
        name: String,
        department: String,
        card_id: String,
        ctx: &mut sui::tx_context::TxContext,
    ): Student {
        Student {
            id: object::new(ctx),
            name,
            department,
            card_id,
        }
    }

    public fun get_student_id(student: &Student): &UID {
        &student.id
    }

    public fun get_student_name(student: &Student): &String {
        &student.name
    }

    public fun get_student_department(student: &Student): &String {
        &student.department
    }

    public fun get_student_card_id(student: &Student): &String {
        &student.card_id
    }

    // ========== ATTENDANCE RECORD GETTERS/SETTERS ==========

    public fun create_attendance_record(
        student_id: address,
        timestamp: u64,
        ctx: &mut sui::tx_context::TxContext,
    ): AttendanceRecord {
        AttendanceRecord {
            id: object::new(ctx),
            student_id,
            timestamp,
        }
    }

    public fun get_record_id(record: &AttendanceRecord): &UID {
        &record.id
    }

    public fun get_record_student_id(record: &AttendanceRecord): address {
        record.student_id
    }

    public fun get_record_timestamp(record: &AttendanceRecord): u64 {
        record.timestamp
    }

    // ========== REGISTER RESPONSE ==========

    public fun create_register_response(message: String): RegisterResponse {
        RegisterResponse { message }
    }

    public fun get_response_message(response: &RegisterResponse): &String {
        &response.message
    }

    // ========== ACCESS CONTROL HELPERS ==========

    /// Verify that caller is the organisation owner
    public fun verify_owner(org: &AttendanceOrganisation, caller: address): bool {
        get_org_owner(org) == caller
    }

    /// Verify that caller is either the organisation owner or system owner
    public fun verify_owner_or_system(
        org: &AttendanceOrganisation,
        system: &AttendanceSystem,
        caller: address
    ): bool {
        get_org_owner(org) == caller || get_system_owner(system) == caller
    }
}

