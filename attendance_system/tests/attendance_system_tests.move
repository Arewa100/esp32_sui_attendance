#[test_only]
module attendance_system::attendance_system_tests {
    use sui::test_scenario as ts;
    use sui::test_utils::{destroy};
    use attendance_system::attendance_system::{Self, AttendanceSystem, Student, AttendanceRecord, AttendanceOrganisation};
    use std::unit_test::assert_eq;


    #[test]
    public fun test_to_register_to_create_organisation() {
        let mut test = ts::begin(@USER);
        attendance_system::init_for_testing(test.ctx());
        test.next_tx(@USER);

        // Get the AttendanceOrganisation object from sender
        let mut attendance_system = ts::take_from_sender<AttendanceSystem>(&mut test);

        let new_organization = attendance_system::create_organisation(&mut attendance_system, b"Sui hub".to_string(), test.ctx());

        let number_of_created_organizations = attendance_system::get_number_of_organisation_created(&attendance_system);
        assert!(number_of_created_organizations == 1, 0);

        destroy(attendance_system);
        destroy(new_organization);
        test.end();
    }

    #[test]
    public fun test_to_register_student() {
        let mut test = ts::begin(@USER);
        attendance_system::init_for_testing(test.ctx());
        test.next_tx(@USER);

        let mut attendance_system = ts::take_from_sender<AttendanceSystem>(&mut test);
        let new_organization = attendance_system::create_organisation(&mut attendance_system, b"Sui hub".to_string(), test.ctx());
        let number_of_created_organizations = attendance_system::get_number_of_organisation_created(&attendance_system);
        assert!(number_of_created_organizations == 1, 0);

        test.next_tx(@USER);  // i am proceeding with next transaction
        let mut attendance_organisation = ts::take_from_sender<AttendanceOrganisation>(&mut test);

        let register_student_response = attendance_system::register_student(
            &mut attendance_organisation, 
            b"Miracle".to_string(),
            b"cardId123".to_string(),
            b"sui move engineer".to_string(),
            test.ctx(),
            );

        let the_number_of_student_created = attendance_system::get_number_student_created(&attendance_organisation);
        assert_eq!(the_number_of_student_created, 1);



        destroy(attendance_system);
        destroy(attendance_organisation);
        test.end();

    }
}
