module attendance_system::attendance_system;
    use std::string::String;


    public struct Student has key, store {
        id: object::UID,
        name: String,
        department: String,
        card_id: String
    }

    public struct AttendanceList has key {
        id: object::UID,
        number_of_students: u64,
    }

    fun init(ctx: &mut TxContext) {
        let attendance_list = AttendanceList {
            id: object::new(ctx),
            number_of_students:0,
        };

        sui::transfer::transfer(attendance_list, ctx.sender())
    }

    public fun register_student(name: String, card_id: String, department: String, ctx: &mut TxContext) {
        let new_student = Student{
            id :object::new(ctx),
            name,
            department,
            card_id, 
        };
        sui::transfer::public_transfer(new_student, ctx.sender());

    }

    

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx)
    }

    #[test_only]
    public fun get_number_student_student_created(attendance_list: AttendanceList) {
        attendance_list.number_of_students
    }




//do things from here
    public fun register_student(
    attendance_list: &mut AttendanceList,
    name: String,
    card_id: String,
    department: String,
    ctx: &mut TxContext
): Student {
    let new_student = Student {
        id: object::new(ctx),
        name,
        department,
        card_id,
    };
    // Increment counter
    attendance_list.number_of_students = attendance_list.number_of_students + 1;

    sui::transfer::public_transfer(new_student, ctx.sender());
    new_student
}

