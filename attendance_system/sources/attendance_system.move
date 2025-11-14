module attendance_system::attendance_system {
    use std::string::String;
    use sui::event;
    use sui::object::{UID, Self};
    use sui::tx_context::TxContext;
    use sui::transfer;
    use std::vector;
    use 0x2::table;

    public struct AttendanceSystem has key, store {
        id: UID,
        organisations: vector<address>,
    }

    public struct AttendanceOrganisation has key, store {
        id: UID,
        name: String,
        owner: address,
        students: vector<address>,
        records_by_student: table::Table<address, vector<address>>,
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

    public struct OrganisationCreatedEvent has copy, drop {
        organisation: address,
        name: String,
        owner: address,
    }

    public struct StudentRegisteredEvent has copy, drop {
        student: address,
        name: String,
        department: String,
        card_id: String,
        organisation: address,
    }

    public struct AttendanceRecordedEvent has copy, drop {
        record: address,
        student: address,
        timestamp: u64,
        organisation: address,
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
            records_by_student: table::new<address, vector<address>>(ctx),
        };
        let address_of_organisation: address = org.id.to_address();
        vector::push_back(&mut system.organisations, address_of_organisation);

        event::emit(OrganisationCreatedEvent {
            organisation: address_of_organisation,
            name: org.name,
            owner: org.owner,
        });
        
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
        table::add(&mut org.records_by_student, the_address, vector::empty<address>());
        transfer::public_transfer(student, ctx.sender());

        event::emit(StudentRegisteredEvent {
            student: the_address,
            name,
            department,
            card_id,
            organisation: org.id.to_address(),
        });

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
        let records_vec = table::borrow_mut(&mut org.records_by_student, student_addr);
        vector::push_back(records_vec, rec_addr);

        transfer::transfer(rec, org.owner);

        event::emit(AttendanceRecordedEvent {
            record: rec_addr,
            student: student_addr,
            timestamp,
            organisation: org.id.to_address(),
        });

        RegisterResponse {
            message: b"Attendance recorded".to_string()
        }
    }

    public fun get_attendance_records_for_student(
        org: &AttendanceOrganisation,
        student_addr: address
    ): &vector<address> {
        table::borrow(&org.records_by_student, student_addr)
    }

    public fun get_number_of_organisation_created(attendance_system: &AttendanceSystem): u64 {
        vector::length(&attendance_system.organisations)
    }

    public fun get_number_student_created(org: &AttendanceOrganisation): u64 {
        vector::length(&org.students)
    }

    public fun get_number_attendance_records(org: &AttendanceOrganisation, student_addr: address): u64 {
        let records = table::borrow(&org.records_by_student, student_addr);
        vector::length(records)
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) { init(ctx); }
    
    #[test_only]
    public fun get_student_address(organisation: &AttendanceOrganisation, index: u64): address {
          *vector::borrow(&organisation.students, index)
    }

}
