#[test_only]
module attendance_system::attendance_system_tests {
    use sui::test_scenario as ts;
    use sui::test_utils::{destroy};
    use attendance_system::attendance_system::{Self};
    use attendance_system::types::{AttendanceSystem, Student, AttendanceRecord, AttendanceOrganisation};
    use std::unit_test::assert_eq;
    use std::vector;
    use sui::clock;
    use sui::coin;
    use sui::sui::SUI;
    use sui::object;

    #[test]
    public fun test_to_register_to_create_organisation() {
        let mut test = ts::begin(@USER);
        attendance_system::init_for_testing(test.ctx());
        test.next_tx(@USER);

        // Get the AttendanceSystem object (now shared)
        let mut attendance_system = ts::take_shared<AttendanceSystem>(&mut test);

        let new_organization = attendance_system::create_organisation(&mut attendance_system, b"Sui hub".to_string(), test.ctx());

        let number_of_created_organizations = attendance_system::get_number_of_organisation_created(&attendance_system);
        assert!(number_of_created_organizations == 1, 0);

        // Return shared object
        ts::return_shared(attendance_system);
        destroy(new_organization);
        test.end();
    }

    #[test]
    public fun test_to_register_student() {
        let mut test = ts::begin(@USER);
        attendance_system::init_for_testing(test.ctx());
        test.next_tx(@USER);

        let mut attendance_system = ts::take_shared<AttendanceSystem>(&mut test);
        let new_organization = attendance_system::create_organisation(&mut attendance_system, b"Sui hub".to_string(), test.ctx());
        let number_of_created_organizations = attendance_system::get_number_of_organisation_created(&attendance_system);
        assert!(number_of_created_organizations == 1, 0);

        test.next_tx(@USER);  // Proceed with next transaction
        let mut attendance_organisation = ts::take_shared<AttendanceOrganisation>(&mut test);

        let register_student_response = attendance_system::register_student(
            &mut attendance_organisation, 
            b"Miracle".to_string(),
            b"cardId123".to_string(),
            b"sui move engineer".to_string(),
            test.ctx(),
        );

        let the_number_of_student_created = attendance_system::get_number_student_created(&attendance_system, &attendance_organisation, test.ctx());
        assert_eq!(the_number_of_student_created, 1);

        // Return shared objects
        ts::return_shared(attendance_system);
        ts::return_shared(attendance_organisation);
        test.end();
    }

   #[test]
    public fun test_to_register_student_and_record_attendance() {
        let mut test = ts::begin(@USER);
        attendance_system::init_for_testing(test.ctx());
        
        // Create and share clock in first transaction
        let clock = clock::create_for_testing(test.ctx());
        let clock_id = object::id(&clock);
        clock::share_for_testing(clock);
        
        test.next_tx(@USER);

        let mut attendance_system = ts::take_shared<AttendanceSystem>(&mut test);
        let clock_obj = ts::take_shared<clock::Clock>(&mut test);
        let new_organization = attendance_system::create_organisation(&mut attendance_system, b"Sui hub".to_string(), test.ctx());
        let number_of_created_organizations = attendance_system::get_number_of_organisation_created(&attendance_system);
        assert!(number_of_created_organizations == 1, 0);

        test.next_tx(@USER);  // Proceed to next transaction
        let mut attendance_organisation = ts::take_shared<AttendanceOrganisation>(&mut test);

        let register_student_response = attendance_system::register_student(
            &mut attendance_organisation, 
            b"Miracle".to_string(),
            b"cardId123".to_string(),
            b"sui move engineer".to_string(),
            test.ctx(),
        );

        let the_number_of_student_created = attendance_system::get_number_student_created(&attendance_system, &attendance_organisation, test.ctx());
        assert_eq!(the_number_of_student_created, 1);

        // Get the student address from organisation.students vector
        let student_addr = attendance_system::get_student_address(&attendance_organisation, 0);

        // Proceed to next transaction for subscription payment
        test.next_tx(@USER);

        // First, pay subscription to enable attendance recording
        let payment = coin::mint_for_testing<SUI>(10000000000, test.ctx()); // 10 SUI
        attendance_system::pay_subscription(&attendance_system, &mut attendance_organisation, payment, &clock_obj, test.ctx());

        test.next_tx(@USER);

        // Timestamp is now automatically generated from on-chain clock (prevents manipulation)
        let attendance_record_response = attendance_system::record_attendance(
            &attendance_system,
            &mut attendance_organisation,
            student_addr,
            &clock_obj,
            test.ctx(),
        );

        // Assert that attendance was recorded (e.g., check attendance count)
        let attendance_count = attendance_system::get_number_attendance_records(&attendance_system, &attendance_organisation, student_addr, test.ctx());
        assert_eq!(attendance_count, 1);

        // Return shared objects
        ts::return_shared(attendance_system);
        ts::return_shared(clock_obj);
        ts::return_shared(attendance_organisation);
        test.end();
    }

    #[test]
    public fun test_subscription_payment() {
        let mut test = ts::begin(@USER);
        attendance_system::init_for_testing(test.ctx());
        
        // Create and share clock in first transaction
        let clock = clock::create_for_testing(test.ctx());
        let clock_id = object::id(&clock);
        clock::share_for_testing(clock);
        
        test.next_tx(@USER);

        let mut attendance_system = ts::take_shared<AttendanceSystem>(&mut test);
        let clock_obj = ts::take_shared<clock::Clock>(&mut test);
        let new_organization = attendance_system::create_organisation(&mut attendance_system, b"Test Org".to_string(), test.ctx());

        test.next_tx(@USER);
        let mut attendance_organisation = ts::take_shared<AttendanceOrganisation>(&mut test);

        // Check subscription is not active initially
        let (is_active, _, _) = attendance_system::get_subscription_status(&attendance_system, &attendance_organisation, &clock_obj, test.ctx());
        assert!(!is_active, 0);

        // Pay subscription
        let payment = coin::mint_for_testing<SUI>(10000000000, test.ctx()); // 10 SUI
        attendance_system::pay_subscription(&attendance_system, &mut attendance_organisation, payment, &clock_obj, test.ctx());

        // Check subscription is now active
        let (is_active_after, expiry, payment_amount) = attendance_system::get_subscription_status(&attendance_system, &attendance_organisation, &clock_obj, test.ctx());
        assert!(is_active_after, 1);
        assert!(expiry > 0, 2);
        assert_eq!(payment_amount, 10000000000);

        // Return shared objects
        ts::return_shared(attendance_system);
        ts::return_shared(clock_obj);
        ts::return_shared(attendance_organisation);
        test.end();
    }

    #[test]
    #[expected_failure(abort_code = 1)]
    public fun test_attendance_without_subscription() {
        let mut test = ts::begin(@USER);
        attendance_system::init_for_testing(test.ctx());
        
        // Create and share clock in first transaction
        let clock = clock::create_for_testing(test.ctx());
        let clock_id = object::id(&clock);
        clock::share_for_testing(clock);
        
        test.next_tx(@USER);

        let mut attendance_system = ts::take_shared<AttendanceSystem>(&mut test);
        let clock_obj = ts::take_shared<clock::Clock>(&mut test);
        let new_organization = attendance_system::create_organisation(&mut attendance_system, b"Test Org".to_string(), test.ctx());

        test.next_tx(@USER);
        let mut attendance_organisation = ts::take_shared<AttendanceOrganisation>(&mut test);

        let register_student_response = attendance_system::register_student(
            &mut attendance_organisation, 
            b"Test Student".to_string(),
            b"cardId456".to_string(),
            b"Engineering".to_string(),
            test.ctx(),
        );

        let student_addr = attendance_system::get_student_address(&attendance_organisation, 0);

        test.next_tx(@USER);

        // This should fail because subscription is not active
        // Timestamp is now automatically generated from on-chain clock
        attendance_system::record_attendance(
            &attendance_system,
            &mut attendance_organisation,
            student_addr,
            &clock_obj,
            test.ctx(),
        );

        // Return shared objects
        // Note: This test is expected to fail, so cleanup code below won't execute
        ts::return_shared(attendance_system);
        ts::return_shared(clock_obj);
        ts::return_shared(attendance_organisation);
        test.end();
    }

    #[test]
    #[expected_failure(abort_code = 2)]
    public fun test_subscription_payment_insufficient() {
        let mut test = ts::begin(@USER);
        attendance_system::init_for_testing(test.ctx());
        
        // Create and share clock in first transaction
        let clock = clock::create_for_testing(test.ctx());
        let clock_id = object::id(&clock);
        clock::share_for_testing(clock);
        
        test.next_tx(@USER);

        let mut attendance_system = ts::take_shared<AttendanceSystem>(&mut test);
        let clock_obj = ts::take_shared<clock::Clock>(&mut test);
        let new_organization = attendance_system::create_organisation(&mut attendance_system, b"Test Org".to_string(), test.ctx());

        test.next_tx(@USER);
        let mut attendance_organisation = ts::take_shared<AttendanceOrganisation>(&mut test);

        // Try to pay with insufficient amount (less than 10 SUI)
        let payment = coin::mint_for_testing<SUI>(5000000000, test.ctx()); // 5 SUI
        attendance_system::pay_subscription(&attendance_system, &mut attendance_organisation, payment, &clock_obj, test.ctx());

        // Return shared objects
        // Note: This test is expected to fail, so cleanup code below won't execute
        ts::return_shared(attendance_system);
        ts::return_shared(clock_obj);
        ts::return_shared(attendance_organisation);
        test.end();
    }
}