module attendance_system::attendance_system {
    use std::string::String;
    // use sui::object::{UID, Self};
    // use sui::tx_context::TxContext;
    // use sui::transfer;
    // use std::vector;

    public struct AttendanceSystem has key, store {
        id: UID,
        organisations: vector<address>,
    }


    public struct AttendanceOrganisation has key, store {
        id: UID,
        name: String,
        owner: address,
        students: vector<address>,     
        records: vector<address>,  
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

    fun init(ctx: &mut TxContext) {
        let system = AttendanceSystem {
            id: object::new(ctx),
            organisations: vector::empty<address>(),
        };
        transfer::transfer(system, ctx.sender());
    }

    public fun create_organisation(
        system: &mut AttendanceSystem,
        name: String,
        ctx: &mut TxContext
    ): RegisterResponse {
        let org = AttendanceOrganisation {
            id: object::new(ctx),
            name,
            owner: ctx.sender(),
            students: vector::empty<address>(),
            records: vector::empty<address>(), 
        };
        let address_of_organisation: address = org.id.to_address();
        vector::push_back(&mut system.organisations, address_of_organisation);
        transfer::transfer(org, ctx.sender());

        RegisterResponse {
            message: b"Organisation created".to_string()
        }
    }

    public fun register_student(
        org: &mut AttendanceOrganisation,
        name: String,
        card_id: String,
        department: String,
        ctx: &mut TxContext
    ): RegisterResponse {
        let student = Student {
            id: object::new(ctx),
            name,
            department,
            card_id,
        };
     
        let the_address: address = student.id.to_address();
        vector::push_back(&mut org.students, the_address);
        transfer::public_transfer(student, ctx.sender());
        RegisterResponse {
            message: b"Student registered".to_string()
        }
    }

    public fun record_attendance(
        org: &mut AttendanceOrganisation,
        student_addr: address,
        timestamp: u64,
        ctx: &mut TxContext
    ): RegisterResponse {
        let rec = AttendanceRecord {
            id: object::new(ctx),
            student_id: student_addr,
            timestamp,
        };
        let rec_addr: address = rec.id.to_address();
        vector::push_back(&mut org.records, rec_addr);
        transfer::transfer(rec, org.owner);
        RegisterResponse {
            message: b"Attendance recorded".to_string()
        }
    }

    public fun get_number_of_organisation_created(attendance_system: &AttendanceSystem): u64 {
        vector::length(&attendance_system.organisations)
    }

    public fun get_number_student_created(org: &AttendanceOrganisation): u64 {
        vector::length(&org.students)
    }

    public fun get_number_attendance_records(org: &AttendanceOrganisation): u64 {
        vector::length(&org.records)
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) { init(ctx); }
}
