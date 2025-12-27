#[test_only]
module attendance_system::attendance_system_tests {
    use sui::test_scenario as ts;
    use sui::test_utils::{destroy};
    use attendance_system::attendance_system::{Self};
    use attendance_system::types::{AttendanceSystem, Student, AttendanceRecord, AttendanceOrganisation};
    use std::unit_test::assert_eq;
    use std::vector;
    use std::option;
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

    #[test]
    #[expected_failure(abort_code = 6)]
    public fun test_duplicate_checkin_same_day() {
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

        // Register a student
        let register_student_response = attendance_system::register_student(
            &mut attendance_organisation, 
            b"Test Student".to_string(),
            b"cardId789".to_string(),
            b"Engineering".to_string(),
            test.ctx(),
        );

        let student_addr = attendance_system::get_student_address(&attendance_organisation, 0);

        test.next_tx(@USER);

        // Pay subscription
        let payment = coin::mint_for_testing<SUI>(10000000000, test.ctx()); // 10 SUI
        attendance_system::pay_subscription(&attendance_system, &mut attendance_organisation, payment, &clock_obj, test.ctx());

        test.next_tx(@USER);

        // First check-in should succeed
        let attendance_record_response = attendance_system::record_attendance(
            &attendance_system,
            &mut attendance_organisation,
            student_addr,
            &clock_obj,
            test.ctx(),
        );

        // Second check-in on the same day should fail with error code 6 (e_already_checked_in_today)
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

    // ========== DEVICE MANAGEMENT TESTS ==========

    #[test]
    public fun test_register_device() {
        let mut test = ts::begin(@USER);
        attendance_system::init_for_testing(test.ctx());
        test.next_tx(@USER);

        let mut attendance_system = ts::take_shared<AttendanceSystem>(&mut test);
        let new_organization = attendance_system::create_organisation(&mut attendance_system, b"Test Org".to_string(), test.ctx());

        test.next_tx(@USER);
        let mut attendance_organisation = ts::take_shared<AttendanceOrganisation>(&mut test);

        // Register a device
        let device_id = b"ESP32_DEVICE_001".to_string();
        let register_response = attendance_system::register_device(
            &mut attendance_system,
            &mut attendance_organisation,
            device_id,
            test.ctx(),
        );

        // Verify device is registered to this organisation
        let is_registered = attendance_system::is_device_registered(
            &attendance_system,
            &attendance_organisation,
            device_id,
            test.ctx(),
        );
        assert!(is_registered, 0);

        // Return shared objects
        ts::return_shared(attendance_system);
        ts::return_shared(attendance_organisation);
        test.end();
    }

    #[test]
    #[expected_failure(abort_code = 7)]
    public fun test_register_duplicate_device_different_org() {
        let mut test = ts::begin(@USER);
        attendance_system::init_for_testing(test.ctx());
        test.next_tx(@USER);

        let mut attendance_system = ts::take_shared<AttendanceSystem>(&mut test);
        
        // Create first organisation
        let org1 = attendance_system::create_organisation(&mut attendance_system, b"Org 1".to_string(), test.ctx());
        
        test.next_tx(@USER);
        let mut attendance_org1 = ts::take_shared<AttendanceOrganisation>(&mut test);
        
        // Register device to first organisation
        let device_id = b"ESP32_DEVICE_001".to_string();
        attendance_system::register_device(
            &mut attendance_system,
            &mut attendance_org1,
            device_id,
            test.ctx(),
        );

        // Return org1 and create second organisation
        ts::return_shared(attendance_system);
        ts::return_shared(attendance_org1);
        test.next_tx(@USER);
        
        let mut attendance_system = ts::take_shared<AttendanceSystem>(&mut test);
        let org2 = attendance_system::create_organisation(&mut attendance_system, b"Org 2".to_string(), test.ctx());
        
        test.next_tx(@USER);
        let mut attendance_org2 = ts::take_shared<AttendanceOrganisation>(&mut test);

        // Try to register the same device to second organisation - should fail with error code 7
        attendance_system::register_device(
            &mut attendance_system,
            &mut attendance_org2,
            device_id,
            test.ctx(),
        );

        // Return shared objects
        // Note: This test is expected to fail, so cleanup code below won't execute
        ts::return_shared(attendance_system);
        ts::return_shared(attendance_org2);
        test.end();
    }

    #[test]
    public fun test_register_device_idempotent() {
        let mut test = ts::begin(@USER);
        attendance_system::init_for_testing(test.ctx());
        test.next_tx(@USER);

        let mut attendance_system = ts::take_shared<AttendanceSystem>(&mut test);
        let new_organization = attendance_system::create_organisation(&mut attendance_system, b"Test Org".to_string(), test.ctx());

        test.next_tx(@USER);
        let mut attendance_organisation = ts::take_shared<AttendanceOrganisation>(&mut test);

        // Register a device first time
        let device_id = b"ESP32_DEVICE_002".to_string();
        attendance_system::register_device(
            &mut attendance_system,
            &mut attendance_organisation,
            device_id,
            test.ctx(),
        );

        // Register the same device again to the same organisation - should succeed (idempotent)
        attendance_system::register_device(
            &mut attendance_system,
            &mut attendance_organisation,
            device_id,
            test.ctx(),
        );

        // Verify device is still registered
        let is_registered = attendance_system::is_device_registered(
            &attendance_system,
            &attendance_organisation,
            device_id,
            test.ctx(),
        );
        assert!(is_registered, 0);

        // Return shared objects
        ts::return_shared(attendance_system);
        ts::return_shared(attendance_organisation);
        test.end();
    }

    #[test]
    public fun test_unregister_device() {
        let mut test = ts::begin(@USER);
        attendance_system::init_for_testing(test.ctx());
        test.next_tx(@USER);

        let mut attendance_system = ts::take_shared<AttendanceSystem>(&mut test);
        let new_organization = attendance_system::create_organisation(&mut attendance_system, b"Test Org".to_string(), test.ctx());

        test.next_tx(@USER);
        let mut attendance_organisation = ts::take_shared<AttendanceOrganisation>(&mut test);

        // Register a device
        let device_id = b"ESP32_DEVICE_003".to_string();
        attendance_system::register_device(
            &mut attendance_system,
            &mut attendance_organisation,
            device_id,
            test.ctx(),
        );

        // Verify device is registered
        let is_registered_before = attendance_system::is_device_registered(
            &attendance_system,
            &attendance_organisation,
            device_id,
            test.ctx(),
        );
        assert!(is_registered_before, 0);

        // Unregister the device
        attendance_system::unregister_device(
            &mut attendance_system,
            &mut attendance_organisation,
            device_id,
            test.ctx(),
        );

        // Verify device is no longer registered
        let is_registered_after = attendance_system::is_device_registered(
            &attendance_system,
            &attendance_organisation,
            device_id,
            test.ctx(),
        );
        assert!(!is_registered_after, 1);

        // Return shared objects
        ts::return_shared(attendance_system);
        ts::return_shared(attendance_organisation);
        test.end();
    }

    #[test]
    public fun test_update_device_heartbeat() {
        let mut test = ts::begin(@USER);
        attendance_system::init_for_testing(test.ctx());
        test.next_tx(@USER);

        let mut attendance_system = ts::take_shared<AttendanceSystem>(&mut test);
        let new_organization = attendance_system::create_organisation(&mut attendance_system, b"Test Org".to_string(), test.ctx());

        test.next_tx(@USER);
        let mut attendance_organisation = ts::take_shared<AttendanceOrganisation>(&mut test);

        // Register a device
        let device_id = b"ESP32_DEVICE_004".to_string();
        attendance_system::register_device(
            &mut attendance_system,
            &mut attendance_organisation,
            device_id,
            test.ctx(),
        );

        // Update device heartbeat
        let timestamp = 1234567890000; // Mock timestamp
        attendance_system::update_device_heartbeat(
            &mut attendance_system,
            &mut attendance_organisation,
            device_id,
            timestamp,
            test.ctx(),
        );

        // Verify heartbeat was updated (returns Option<u64>)
        let heartbeat_option = attendance_system::get_device_heartbeat(
            &attendance_system,
            &attendance_organisation,
            device_id,
            test.ctx(),
        );
        // Check that heartbeat exists and matches timestamp
        assert!(option::is_some(&heartbeat_option), 0);
        let heartbeat = *option::borrow(&heartbeat_option);
        assert!(heartbeat == timestamp, 1);

        // Return shared objects
        ts::return_shared(attendance_system);
        ts::return_shared(attendance_organisation);
        test.end();
    }

    #[test]
    public fun test_register_device_after_unregister() {
        let mut test = ts::begin(@USER);
        attendance_system::init_for_testing(test.ctx());
        test.next_tx(@USER);

        let mut attendance_system = ts::take_shared<AttendanceSystem>(&mut test);
        let new_organization = attendance_system::create_organisation(&mut attendance_system, b"Test Org".to_string(), test.ctx());

        test.next_tx(@USER);
        let mut attendance_organisation = ts::take_shared<AttendanceOrganisation>(&mut test);

        // Register a device
        let device_id = b"ESP32_DEVICE_005".to_string();
        attendance_system::register_device(
            &mut attendance_system,
            &mut attendance_organisation,
            device_id,
            test.ctx(),
        );

        // Unregister the device
        attendance_system::unregister_device(
            &mut attendance_system,
            &mut attendance_organisation,
            device_id,
            test.ctx(),
        );

        // Now register it again - should succeed (device is free)
        attendance_system::register_device(
            &mut attendance_system,
            &mut attendance_organisation,
            device_id,
            test.ctx(),
        );

        // Verify device is registered again
        let is_registered = attendance_system::is_device_registered(
            &attendance_system,
            &attendance_organisation,
            device_id,
            test.ctx(),
        );
        assert!(is_registered, 0);

        // Return shared objects
        ts::return_shared(attendance_system);
        ts::return_shared(attendance_organisation);
        test.end();
    }
}