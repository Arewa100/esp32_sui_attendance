#[test_only]
module attendance_system::attendance_system_tests {
    use sui::test_scenario as ts;
    use sui::test_utils::{destroy};
    use attendance_system::attendance_system::{Self, AttendanceOrganisation, Student};

    #[test]
    public fun test_to_register_a_student() {
        let mut test = ts::begin(@USER);
        attendance_system::init_for_testing(test.ctx());
        test.next_tx(@USER);

        // Get the AttendanceOrganisation object from sender
        let mut attendance_organisation = ts::take_from_sender<AttendanceOrganisation>(&mut test);

        let registered_student = attendance_system::register_student(
            &mut attendance_organisation,
            b"Miracle".to_string(),
            b"124455".to_string(),
            b"Industrial Maintenance Engineering".to_string(),
            test.ctx(),
        );

        let number_of_created_students = attendance_system::get_number_student_created(&attendance_organisation);
        assert!(number_of_created_students == 1, 0);

        destroy(registered_student);
        destroy(attendance_organisation);
        test.end();
    }
}
