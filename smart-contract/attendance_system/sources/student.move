module attendance_system::student {
    use std::string::String;
    use sui::object::Self;
    use sui::transfer;
    use std::vector;
    use std::option;
    use 0x2::table;
    use attendance_system::types::{Self as types, AttendanceSystem, AttendanceOrganisation, Student, RegisterResponse};
    use attendance_system::events;
    use attendance_system::constants;

    /// Register a new student
    public fun register_student(
        org: &mut AttendanceOrganisation,
        name: String,
        card_id: String,
        department: String,
        ctx: &mut sui::tx_context::TxContext,
    ): RegisterResponse {
        let sender = sui::tx_context::sender(ctx);
        
        // Access control: only organization owner can register students
        assert!(types::get_org_owner(org) == sender, constants::e_unauthorized());

        // Check for duplicate card_id
        assert!(!table::contains(types::get_card_id_to_student(org), card_id), constants::e_duplicate_card_id());

        let student = types::create_student(name, department, card_id, ctx);
        let the_address: address = object::id(&student).to_address();
        let student_name = name;
        let student_department = department;
        let student_card_id = card_id;
        
        vector::push_back(types::get_students_mut(org), the_address);
        table::add(types::get_records_by_student_mut(org), the_address, vector::empty<address>());
        table::add(types::get_card_id_to_student_mut(org), card_id, the_address);
        
        events::emit_student_registered(
            the_address,
            student_name,
            student_department,
            student_card_id,
            object::id(org).to_address(),
        );
        
        transfer::public_transfer(student, sender);

        types::create_register_response(std::string::utf8(b"Student registered"))
    }

    /// Get number of students created
    /// Can be called by organisation owner or system owner (server)
    public fun get_number_students(
        system: &AttendanceSystem,
        org: &AttendanceOrganisation,
        ctx: &mut sui::tx_context::TxContext,
    ): u64 {
        // Access control: allow organisation owner or system owner (server)
        let caller = sui::tx_context::sender(ctx);
        assert!(types::verify_owner_or_system(org, system, caller), constants::e_unauthorized());
        vector::length(types::get_students(org))
    }

    /// Get student address by card_id (for RFID lookup)
    /// Can be called by organisation owner or system owner (server)
    public fun get_student_by_card_id(
        system: &AttendanceSystem,
        org: &AttendanceOrganisation,
        card_id: String,
        ctx: &mut sui::tx_context::TxContext,
    ): std::option::Option<address> {
        // Access control: allow organisation owner or system owner (server)
        let caller = sui::tx_context::sender(ctx);
        assert!(types::verify_owner_or_system(org, system, caller), constants::e_unauthorized());
        if (table::contains(types::get_card_id_to_student(org), card_id)) {
            std::option::some(*table::borrow(types::get_card_id_to_student(org), card_id))
        } else {
            std::option::none()
        }
    }

    /// Check if student exists in organization
    /// Can be called by organisation owner or system owner (server)
    public fun is_student_registered(
        system: &AttendanceSystem,
        org: &AttendanceOrganisation,
        student_addr: address,
        ctx: &mut sui::tx_context::TxContext,
    ): bool {
        // Access control: allow organisation owner or system owner (server)
        let caller = sui::tx_context::sender(ctx);
        assert!(types::verify_owner_or_system(org, system, caller), constants::e_unauthorized());
        table::contains(types::get_records_by_student(org), student_addr)
    }

    /// Get student address by index (test helper)
    #[test_only]
    public fun get_student_address(org: &AttendanceOrganisation, index: u64): address {
        *vector::borrow(types::get_students(org), index)
    }
}

