#[test_only]
module attendance_system::attendance_system_tests {
    use sui::test_scenario as ts;
    use sui::test_utils::{destroy};
    use attendance_system::attendance_system::{Self, AttendanceSystem, Student, AttendanceRecord};

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

    
}
