#[test_only]
module attendance_system::attendance_system_tests;
    use sui::test_scenario as ts;
    use sui::test_utils::{destroy};
    use std::unit_test::assert_eq; 
    use attendance_system::attendance_system::{Self, AttendanceList};
    use std::string::String;
       

//     #[test]
//     public fun test_that_test_scenerio_works() {
//         let mut test = ts::begin(@USER);
//         attendance_system::init_for_testing(test.ctx());
//         test.next_tx(@USER);
//         test.end();
// }

#[test]
public fun test_to_register_a_student() {
    let mut test = ts::begin(@USER);
    attendance_system::init_for_testing(test.ctx());
    test.next_tx(@USER);

    //learning this 
    let mut attendance_list = ts::take_from_sender<AttendanceList>($test);

    attendance_system::register_student(
        b"Miracle".to_string(),
        b"124455".to_string(),
        b"Industrial Maintenance Engineering".to_string(),
        test.ctx(),
    );

    let number_of_created_students = attendance_system::get_number_student_student_created(attendance_list);
    assert!( number_of_created_students == 1, 0);
    destroy(registered_student);
    test.end();
}