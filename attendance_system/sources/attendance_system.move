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

    public fun register_student(name: String, card_id: String, department: String, ctx: &mut TxContext) {
        let new_strudent: Student = Student{
            id :object::new(ctx),
            name,
            department, 
            card_id, 
        }

    }

    fun init(ctx: &mut TxContext) {
        let attendance_list = AttendanceList {
            id: object::new(ctx),
            number_of_students:0,
        };

        sui::transfer::transfer(attendance_list, ctx.sender())
    }

    #[test_only]
    use sui::test_scenario as ts;
    #[test_only]
    use sui::test_utils::{destroy};
    

    #[test]
    public fun test_that_test_scenerio_works() {
        let mut test = ts::begin(@USER);
        init(test.ctx());
        test.next_tx(@USER);
        test.end();
    }