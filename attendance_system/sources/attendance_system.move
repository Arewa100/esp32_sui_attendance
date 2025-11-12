module attendance_system::attendance_system {
    use std::string::String;
    use sui::object::{UID, Self};
    use sui::tx_context::TxContext;
    use sui::transfer;
    use std::vector;

    /// Top-level singleton system resource (holds all orgs)
    public struct AttendanceSystem has key, store {
        id: UID,
        organisations: vector<UID>, // UIDs of AttendanceOrganisation
    }

    /// Individual organization resource with vector<address> for students
    public struct AttendanceOrganisation has key, store {
        id: UID,
        name: String,
        owner: address,
        students: vector<address>,     // addresses of registered students
        records: vector<UID>,          // UIDs of AttendanceRecord
    }

    /// Student resource (holds full info, but tracked via address in org)
    public struct Student has key, store {
        id: UID,
        name: String,
        department: String,
        card_id: String,
    }

    /// AttendanceRecord (keeps Student UID for detailed tracking)
    public struct AttendanceRecord has key, store {
        id: UID,
        student_id: UID,
        timestamp: u64,
    }

    /// UX/response struct (optional)
    public struct RegisterResponse has copy, drop {
        message: String,
    }

    /// System initializer (singleton)
    fun init(ctx: &mut TxContext) {
        let system = AttendanceSystem {
            id: object::new(ctx),
            organisations: vector::empty<UID>(),
        };
        transfer::transfer(system, ctx.sender());
    }

    /// Create an organisation (admin/user call)
    public fun create_organisation(
        system: &mut AttendanceSystem,
        name: String,
        ctx: &mut TxContext
    ): RegisterResponse {
        let org = AttendanceOrganisation {
            id: object::new(ctx),
            name,
            owner: ctx.sender(),
            students: vector::empty<address>(), // changed here!
            records: vector::empty<UID>(),
        };
        vector::push_back(&mut system.organisations, org.id);
        transfer::transfer(org, ctx.sender());
        RegisterResponse {
            message: b"Organisation created".to_string()
        }
    }

    /// Register a student: store student and their address in the org
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
        // Store address of student (not UID)
        vector::push_back(&mut org.students, ctx.sender());
        transfer::public_transfer(student, ctx.sender());
        RegisterResponse {
            message: b"Student registered".to_string()
        }
    }

    /// Record an attendance event for a student in an org
    public fun record_attendance(
        org: &mut AttendanceOrganisation,
        student_id: UID,
        timestamp: u64,
        ctx: &mut TxContext
    ): RegisterResponse {
        let rec = AttendanceRecord {
            id: object::new(ctx),
            student_id,
            timestamp,
        };
        vector::push_back(&mut org.records, rec.id);
        transfer::transfer(rec, org.owner);
        RegisterResponse {
            message: b"Attendance recorded".to_string()
        }
    }

    /// Utility: number of students in org (tracked by address)
    public fun get_number_student_created(org: &AttendanceOrganisation): u64 {
        vector::length(&org.students)
    }

    /// Utility: number of attendance records in org
    public fun get_number_attendance_records(org: &AttendanceOrganisation): u64 {
        vector::length(&org.records)
    }

    /// System test helper
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) { init(ctx); }
}
